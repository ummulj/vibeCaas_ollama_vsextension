import * as vscode from 'vscode';

export interface GenerateOptions {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface GenerateRequest {
    model: string;
    prompt: string;
    context?: any;
    options?: GenerateOptions;
    stream?: boolean;
}

export interface GenerateResponse {
    response: string;
    model: string;
    created_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
    model: string;
    messages: ChatMessage[];
    options?: GenerateOptions;
}

export interface ModelInfo {
    name: string;
    size: number;
    modified_at: string;
}

export interface OllamaResponse {
    response: string;
    model: string;
    created_at: string;
}

export interface OllamaModelsResponse {
    models: ModelInfo[];
}

export class OllamaClient {
    private baseUrl: string;
    private logger?: any;

    constructor(baseUrl: string = 'http://localhost:11434', logger?: any) {
        this.baseUrl = baseUrl;
        this.logger = logger;
    }

    async generate(request: GenerateRequest, onToken?: (token: string) => void): Promise<GenerateResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: request.model,
                    prompt: request.prompt,
                    stream: request.stream || false,
                    options: request.options || {}
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (request.stream && onToken) {
                // Handle streaming response
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No response body');
                }

                let fullResponse = '';
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line) as OllamaResponse;
                            if (data.response) {
                                fullResponse += data.response;
                                onToken(data.response);
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                        }
                    }
                }

                return {
                    response: fullResponse,
                    model: request.model,
                    created_at: new Date().toISOString()
                };
            } else {
                // Handle non-streaming response
                const data = await response.json() as OllamaResponse;
                return {
                    response: data.response,
                    model: data.model,
                    created_at: data.created_at
                };
            }
        } catch (error) {
            this.logger?.error('Error generating response', error);
            throw error;
        }
    }

    async chat(model: string, messages: ChatMessage[], onToken?: (token: string) => void): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            let fullResponse = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            const token = data.message.content;
                            fullResponse += token;
                            onToken?.(token);
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }

            return fullResponse;
        } catch (error) {
            this.logger?.error('Error in chat', error);
            throw error;
        }
    }

    async listModels(): Promise<ModelInfo[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as OllamaModelsResponse;
            return data.models || [];
        } catch (error) {
            this.logger?.error('Error listing models', error);
            return [];
        }
    }

    async pullModel(modelName: string, onProgress?: (status: string) => void): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: modelName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Wait for the pull to complete
            const reader = response.body?.getReader();
            if (reader) {
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.status) {
                                onProgress?.(data.status);
                                if (data.status === 'success') {
                                    return;
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
        } catch (error) {
            this.logger?.error('Error pulling model', error);
            throw error;
        }
    }

    setBaseUrl(url: string): void {
        this.baseUrl = url;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }
}

