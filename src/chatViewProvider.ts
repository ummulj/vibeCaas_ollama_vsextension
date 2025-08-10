import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { Logger } from './logger';
import { collectEditorContext } from './contextCollector';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vibecaas.chatView';
  private _view?: vscode.WebviewView;
  private ollama: OllamaClient;
  private logger?: Logger;

  constructor(private readonly extensionUri: vscode.Uri, ollama: OllamaClient, logger?: Logger) {
    this.ollama = ollama;
    this.logger = logger;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webview.html = this.getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'requestModels': {
          try {
            const models = await this.ollama.listModels();
            this.post({ type: 'models', data: models });
          } catch (e: any) {
            this.post({ type: 'error', error: e.message || String(e) });
          }
          break;
        }
        case 'toggleVoice': {
          await vscode.commands.executeCommand('vibecaas.toggleVoiceMode');
          break;
        }
        case 'chat': {
          const cfg = vscode.workspace.getConfiguration('vibecaas');
          const model = msg.model || cfg.get<string>('defaultModel', 'qwen2.5-coder:7b');
          const maxBytes = cfg.get<number>('maxContextBytes', 200000);
          const editorContext = await collectEditorContext(maxBytes);
          const messages = [
            { role: 'system', content: 'You are VibeCaas.ai, a helpful coding assistant integrated with VS Code. Keep answers concise and cite code snippets when appropriate.' },
            { role: 'user', content: `${msg.text}\n\nContext (may be truncated):\n${editorContext}` }
          ] as any[];
          try {
            // Scaffold shortcut: if message starts with "Scaffold:" trigger the file generator command
            const text: string = msg.text || '';
            if (/^\s*scaffold\s*:/i.test(text)) {
              await vscode.commands.executeCommand('vibecaas.scaffoldFromPrompt', text.replace(/^\s*scaffold\s*:/i, '').trim());
              return;
            }
            this.post({ type: 'chatStart' });
            let acc = '';
            await this.ollama.chat(model, messages as any, (t) => {
              acc += t;
              this.post({ type: 'chatDelta', data: t });
            });
            this.post({ type: 'chatEnd' });
          } catch (e: any) {
            this.post({ type: 'error', error: e.message || String(e) });
          }
          break;
        }
      }
    });
  }

  public notifyVoiceToggled(enabled: boolean) {
    this.post({ type: 'voiceToggled', enabled });
  }

  private post(message: any) {
    this._view?.webview.postMessage(message);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.css'));
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet" />
  <title>VibeCaas.ai</title>
  <style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-foreground);
    --muted: var(--vscode-descriptionForeground);
    --border: var(--vscode-editorGroup-border);
    --accent: var(--vscode-textLink-foreground);
  }
  body { font-family: var(--vscode-font-family); margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
  .container { display: flex; flex-direction: column; height: 100vh; }
  .toolbar { display: flex; gap: 8px; padding: 10px; align-items: center; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 1; }
  .toolbar .spacer { flex: 1; }
  .toolbar button, .toolbar select { height: 28px; }
  .chips { display: flex; gap: 6px; }
  .chip { border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
  .messages { flex: 1; padding: 12px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .bubble { max-width: 90%; padding: 10px 12px; border-radius: 10px; white-space: pre-wrap; }
  .bubble.user { align-self: flex-end; background: rgba(127,127,127,0.15); }
  .bubble.assistant { align-self: flex-start; background: var(--vscode-editor-inactiveSelectionBackground); }
  .footer { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--border); position: sticky; bottom: 0; background: var(--bg); }
  .footer textarea { flex: 1; resize: vertical; min-height: 48px; }
  .icon { filter: grayscale(100%); }
  </style>
</head>
<body>
  <div class="container">
    <div class="toolbar">
      <img class="icon" title="VibeCaas.ai" width="18" height="18" src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'VibeCaaSLogo.png'))}">
      <select id="model"></select>
      <div class="chips">
        <div class="chip" data-action="plan">Plan</div>
        <div class="chip" data-action="debug">Debug</div>
        <div class="chip" data-action="explain">Explain</div>
        <div class="chip" data-action="scaffold">Scaffold</div>
      </div>
      <div class="spacer"></div>
      <button id="mic" title="Toggle Voice">🎙️</button>
      <button id="refresh" title="Refresh Models">⟳</button>
    </div>
    <div id="messages" class="messages"></div>
    <div class="footer">
      <textarea id="input" placeholder="Ask anything…  (@ selection and open files included as context)"></textarea>
      <button id="send">Send</button>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

