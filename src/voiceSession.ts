import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { Logger } from './logger';
import { collectEditorContext } from './contextCollector';

type Recorder = {
  start: () => any;
  stop: () => any;
};

export class VoiceSession {
  private running = false;
  private recorder: Recorder | undefined;
  private recognizer: any | undefined;
  private disposeFns: Array<() => void> = [];
  constructor(private ollama: OllamaClient, private logger?: Logger) {}

  async start(): Promise<void> {
    if (this.running) return;
    const cfg = vscode.workspace.getConfiguration('vibecaas');
    const modelPath = cfg.get<string>('voskModelPath', '');
    if (!modelPath) {
      vscode.window.showWarningMessage('VibeCaas.ai: Set vibecaas.voskModelPath to enable Voice Mode.');
      return;
    }
    try {
      const vosk = await import('vosk');
      const rec = await import('node-record-lpcm16');
      vosk.setLogLevel(0);
      const Model = (vosk as any).Model;
      const Recognizer = (vosk as any).Recognizer;
      const model = new Model(modelPath);
      const sampleRate = 16000;
      this.recognizer = new Recognizer({ model, sampleRate });
      const recordProgram = process.platform === 'darwin' ? 'sox' : (process.platform === 'win32' ? 'sox' : undefined);
      this.recorder = (rec as any).record({ sampleRateHertz: sampleRate, threshold: 0, verbose: false, recordProgram });
      const stream = (this.recorder as any).stream();
      stream.on('data', (data: Buffer) => {
        if (this.recognizer.acceptWaveform(data)) {
          const res = this.recognizer.result();
          this.onTranscript(res?.text || '');
        } else {
          const partial = this.recognizer.partialResult();
          this.logger?.info('voice partial', partial);
        }
      });
      stream.on('error', (e: any) => this.logger?.error('voice error', e));
      this.running = true;
      vscode.window.setStatusBarMessage('VibeCaas Voice: Listening…', 3000);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Voice Mode failed: ${e.message || String(e)}. Install optional deps: npm i vosk node-record-lpcm16`);
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    try {
      this.recorder?.stop();
    } catch {}
    try {
      this.recognizer?.free?.();
    } catch {}
    this.disposeFns.forEach((d) => d());
    this.disposeFns = [];
    this.running = false;
  }

  private async onTranscript(text: string) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    this.logger?.info('voice transcript', trimmed);
    const cfg = vscode.workspace.getConfiguration('vibecaas');
    const defaultModel = cfg.get<string>('defaultModel', 'qwen2.5-coder:7b');
    const maxBytes = cfg.get<number>('maxContextBytes', 200000);
    const context = await collectEditorContext(maxBytes);

    // Simple intent detection
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('plan ') || lower.includes('plan a') || lower.includes('design ') || lower.includes('spec')) {
      await this.generatePlan(trimmed, defaultModel, context);
    } else if (lower.startsWith('write ') || lower.startsWith('generate ') || lower.includes('code')) {
      await this.generateCode(trimmed, defaultModel, context);
    } else {
      // Default to chat in sidebar via information message
      vscode.window.showInformationMessage(`Heard: ${trimmed}`);
    }
  }

  private async generatePlan(request: string, model: string, editorContext: string) {
    const tpl = vscode.workspace.getConfiguration('vibecaas').get<any>('promptTemplates') || {};
    const prefix = tpl.plan || 'Create a step-by-step implementation plan for the following task.';
    const prompt = `${prefix}\n\nTask:\n${request}\n\nContext (may be truncated):\n${editorContext}\n\nOutput a concise, well-structured markdown product spec with sections, bullet points, and code block stubs if relevant.`;
    try {
      let out = '# Plan\n\n';
      await this.ollama.generate({ model, prompt, stream: true }, (t) => (out += t));
      const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: out });
      await vscode.window.showTextDocument(doc, { preview: false });
      process.stdout.write('\u0007');
    } catch (e: any) {
      vscode.window.showErrorMessage(`Plan generation failed: ${e.message || String(e)}`);
    }
  }

  private async generateCode(request: string, model: string, editorContext: string) {
    const tpl = vscode.workspace.getConfiguration('vibecaas').get<any>('promptTemplates') || {};
    const prefix = tpl.generate || 'Generate idiomatic, well-documented code for the following request.';
    const prompt = `${prefix}\n\nRequest:\n${request}\n\nContext (may be truncated):\n${editorContext}`;
    try {
      let out = '';
      await this.ollama.generate({ model, prompt, stream: true }, (t) => (out += t));
      await vscode.env.clipboard.writeText(out);
      vscode.window.showInformationMessage('Generated code copied to clipboard.');
      process.stdout.write('\u0007');
    } catch (e: any) {
      vscode.window.showErrorMessage(`Code generation failed: ${e.message || String(e)}`);
    }
  }
}

