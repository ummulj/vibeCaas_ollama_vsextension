import * as vscode from 'vscode';

export async function safeOpen(pathOrUri: string) {
  const uri = vscode.Uri.file(pathOrUri);
  await vscode.window.showTextDocument(uri, { preview: false });
}

export async function safeShowDiff(left: vscode.Uri, right: vscode.Uri, title?: string) {
  await vscode.commands.executeCommand('vscode.diff', left, right, title ?? 'Diff');
}

export async function confirmAndSaveActive(): Promise<boolean> {
  const doc = vscode.window.activeTextEditor?.document;
  if (!doc) return false;
  const choice = await vscode.window.showWarningMessage('Save current file?', { modal: true }, 'Save', 'Cancel');
  if (choice === 'Save') {
    return await doc.save();
  }
  return false;
}

