import * as vscode from 'vscode';

export class ToolsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vibecaas.toolsView';
  public static current?: ToolsViewProvider;
  private _view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) { ToolsViewProvider.current = this; }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };
    webview.html = this.getHtml(webview);
    webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'browse': {
          const url = String(msg.url || '');
          try {
            const res = await fetch(url);
            const text = await res.text();
            const trimmed = text.slice(0, 200000); // 200KB cap
            this.post({ type: 'browseResult', url, content: trimmed });
          } catch (e: any) {
            this.post({ type: 'browseError', error: e?.message || String(e) });
          }
          break;
        }
        case 'openExternal': {
          const url = String(msg.url || '');
          if (url) vscode.env.openExternal(vscode.Uri.parse(url));
          break;
        }
      }
    });
  }

  public reveal(): void {
    vscode.commands.executeCommand('vibecaas.toolsView.focus');
  }

  public post(message: any) {
    this._view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'tools.js'));
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: var(--vscode-font-family); margin: 0; }
    .tabs { display: flex; gap: 6px; padding: 8px; border-bottom: 1px solid var(--vscode-editorGroup-border); }
    .tab { padding: 6px 10px; border: 1px solid var(--vscode-editorGroup-border); border-radius: 6px; cursor: pointer; }
    .tab.active { background: var(--vscode-editor-inactiveSelectionBackground); }
    .panel { display: none; height: calc(100vh - 48px); }
    .panel.active { display: block; }
    .row { display: flex; gap: 6px; padding: 8px; align-items: center; }
    .col { padding: 8px; }
    textarea, input { width: 100%; font-family: var(--vscode-editor-font-family); }
    #preview { width: 100%; height: 60vh; border: 1px solid var(--vscode-editorGroup-border); }
    #browseResult { white-space: pre-wrap; overflow: auto; height: 60vh; border: 1px solid var(--vscode-editorGroup-border); padding: 8px; }
  </style>
</head>
<body>
  <div class="tabs">
    <div class="tab active" data-tab="browser">Browser</div>
    <div class="tab" data-tab="sandbox">Sandbox</div>
  </div>
  <div id="browser" class="panel active">
    <div class="row">
      <input id="url" placeholder="https://example.com" />
      <button id="go">Go</button>
      <button id="openExternal">Open External</button>
    </div>
    <div id="browseResult" class="col"></div>
  </div>
  <div id="sandbox" class="panel">
    <div class="row">
      <button id="run">Run</button>
    </div>
    <div class="row">
      <div class="col" style="flex:1">
        <label>HTML</label>
        <textarea id="html" rows="8"><div id="app">Hello VibeCaas Sandbox</div></textarea>
        <label>CSS</label>
        <textarea id="css" rows="6">#app{font-weight:bold;color:rebeccapurple}</textarea>
        <label>JS</label>
        <textarea id="js" rows="8">document.getElementById('app').innerText = 'Sandbox running'</textarea>
      </div>
      <div class="col" style="flex:1">
        <iframe id="preview" sandbox="allow-scripts"></iframe>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}


