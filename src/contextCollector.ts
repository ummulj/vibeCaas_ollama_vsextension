import * as vscode from 'vscode';

export async function collectEditorContext(maxBytes: number): Promise<string> {
  const editor = vscode.window.activeTextEditor;
  let context = '';
  if (editor) {
    const doc = editor.document;
    const selection = editor.selection;
    if (!selection.isEmpty) {
      context += `Selected code from ${doc.fileName}:\n\n`;
      context += doc.getText(selection);
    } else {
      const visible = doc.getText();
      context += `Active file ${doc.fileName}:\n\n` + visible;
    }
  }
  // Include other visible editors (limited)
  for (const vis of vscode.window.visibleTextEditors) {
    if (vis === editor) continue;
    context += `\n\nOpen file ${vis.document.fileName}:\n\n`;
    context += vis.document.getText();
    if (context.length > maxBytes) break;
  }
  // Trim to maxBytes
  if (context.length > maxBytes) {
    context = context.slice(0, maxBytes);
  }
  return context;
}

