import { Logger } from './logger';
import { LruCache } from './cache';

type GenerateOptions = {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  context?: unknown;
};

export class OllamaClient {
  private baseUrl: string;
  private logger?: Logger;
  private cache: LruCache<string>;
  constructor(baseUrl: string, logger?: Logger) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.logger = logger;
    this.cache = new LruCache<string>(20);
  }

  async listModels(): Promise<string[]> {
    const res: any = await this.postOrGet(`${this.baseUrl}/api/tags`, { method: 'GET' });
    const json: any = await res.json();
    const models: any[] = json?.models ?? [];
    return models.map((m: any) => (m.model || m.name || '').toString()).filter(Boolean);
  }

  async pullModel(model: string, onProgress?: (status: string) => void): Promise<void> {
    const res = await this.postOrGet(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: model, stream: true }),
      headers: { 'content-type': 'application/json' },
    });
    if (!res.body) return;
    const reader = (res.body as any).getReader ? (res.body as any).getReader() : undefined;
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        onProgress?.(text);
      }
      return;
    }
    // Fallback non-stream
    await res.text();
  }

  async generate(opts: GenerateOptions, onToken?: (token: string) => void): Promise<string> {
    const cacheKey = `${opts.model}::${opts.prompt}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger?.info('cache hit for prompt');
      onToken?.(cached);
      return cached;
    }
    const payload = {
      model: opts.model,
      prompt: opts.prompt,
      stream: opts.stream ?? true,
      system: opts.system,
      context: opts.context,
    } as any;
    this.logger?.info('Generating with model', opts.model);
    const res = await this.postOrGet(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    });
    if (opts.stream !== false && res.body && (res.body as any).getReader) {
      const reader = (res.body as any).getReader();
      const decoder = new TextDecoder();
      let out = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(/\n+/).filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              onToken?.(json.response);
              out += json.response;
            }
          } catch {
            // ignore
          }
        }
      }
      this.cache.set(cacheKey, out);
      return out;
    } else {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const result = json.response ?? text;
        this.cache.set(cacheKey, result);
        return result;
      } catch {
        this.cache.set(cacheKey, text);
        return text;
      }
    }
  }

  async chat(model: string, messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, onToken?: (token: string) => void): Promise<string> {
    const payload = { model, messages, stream: true };
    const res = await this.postOrGet(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    });
    if (res.body && (res.body as any).getReader) {
      const reader = (res.body as any).getReader();
      const decoder = new TextDecoder();
      let out = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(/\n+/).filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const token = json.message?.content ?? json.response ?? '';
            if (token) {
              onToken?.(token);
              out += token;
            }
          } catch {
            // ignore
          }
        }
      }
      return out;
    }
    return '';
  }

  private async postOrGet(url: string, init: any): Promise<any> {
    const fetchImpl: any = (globalThis as any).fetch ?? (await import('node-fetch')).default;
    const res: any = await fetchImpl(url, init);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return res;
  }
}

