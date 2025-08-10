import * as vscode from 'vscode';
import * as path from 'path';
import { OllamaClient } from './ollamaClient';
import { Logger } from './logger';
import { collectEditorContext } from './contextCollector';

type PlannedFile = { path: string; content: string };
type Plan = { files: PlannedFile[]; instructions?: string };

function sanitizeRelativePath(filePath: string): string | undefined {
  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/'));
  if (normalized.startsWith('../') || normalized.startsWith('..\\') || path.isAbsolute(normalized)) {
    return undefined;
  }
  return normalized.replace(/^\/+/, '');
}

function extractJson(text: string): any | undefined {
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    const slice = text.slice(first, last + 1);
    try { return JSON.parse(slice); } catch {}
  }
  return undefined;
}

export async function scaffoldFromPrompt(opts: {
  ollama: OllamaClient;
  logger?: Logger;
  prompt: string;
}): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('vibecaas');
  const modelPref = cfg.get<string>('defaultModel', 'qwen2.5-coder:7b');
  const enableTurbo = cfg.get<boolean>('enableTurbo', false);
  const turboModel = cfg.get<string>('turboModel', '') || modelPref;
  const model = enableTurbo ? turboModel : modelPref;
  const maxContext = cfg.get<number>('maxContextBytes', 200000);
  const maxFiles = cfg.get<number>('scaffold.maxFiles', 20);
  const maxBytes = cfg.get<number>('scaffold.maxTotalBytes', 400000);
  const allowOverwrite = cfg.get<boolean>('scaffold.allowOverwrite', false);

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('Open a workspace folder to scaffold files.');
    return;
  }

  const context = await collectEditorContext(maxContext);
  const system = `You are a code generation assistant integrated with VS Code. Generate project files as JSON only.
Rules:
- Output strictly valid JSON with keys: files (array of {path, content}), optional instructions.
- Use forward slashes in paths. No absolute paths and no parent directory traversal.
- Keep total size minimal and relevant to the request.
Example output:\n{\n  "files": [ { "path": "README.md", "content": "..." } ],\n  "instructions": "..."\n}`;
  const userPrompt = `Request:\n${opts.prompt}\n\nWorkspace context (may be truncated):\n${context}\n\nRespond with JSON only.`;

  let out = '';
  await opts.ollama.generate({ model, prompt: `${system}\n\n${userPrompt}`, stream: true }, (t) => (out += t));
  const json = extractJson(out);
  if (!json || !Array.isArray(json.files)) {
    vscode.window.showErrorMessage('Failed to parse scaffold plan from model output.');
    return;
  }
  const files: PlannedFile[] = json.files
    .map((f: any) => ({ path: String(f.path ?? ''), content: String(f.content ?? '') }))
    .filter((f: PlannedFile) => f.path && f.content !== undefined);

  if (files.length === 0) {
    vscode.window.showInformationMessage('No files to create.');
    return;
  }
  if (files.length > maxFiles) {
    vscode.window.showWarningMessage(`Plan includes ${files.length} files, exceeding limit ${maxFiles}. Aborting.`);
    return;
  }
  const totalBytes = files.reduce((n, f) => n + Buffer.byteLength(f.content, 'utf8'), 0);
  if (totalBytes > maxBytes) {
    vscode.window.showWarningMessage(`Plan size ${totalBytes} bytes exceeds limit ${maxBytes}. Aborting.`);
    return;
  }

  // Show summary and confirm
  const summary = files.map((f) => `- ${f.path} (${Buffer.byteLength(f.content, 'utf8')} bytes)`).join('\n');
  const confirm = await vscode.window.showInformationMessage(
    `Scaffold will create/update ${files.length} file(s):\n${summary}`,
    { modal: true, detail: json.instructions || '' },
    'Apply',
    'Review...'
  );
  if (!confirm) return;

  if (confirm === 'Review...') {
    // Open diffs sequentially
    for (const f of files) {
      const rel = sanitizeRelativePath(f.path);
      if (!rel) continue;
      const target = vscode.Uri.joinPath(workspaceFolder.uri, rel);
      const exist = await fileExists(target);
      const left = exist ? target : vscode.Uri.parse('untitled:' + target.toString());
      const temp = await createTempDocument(f.content, path.basename(rel));
      await vscode.commands.executeCommand('vscode.diff', left, temp, `Scaffold Preview: ${rel}`);
    }
    const apply = await vscode.window.showInformationMessage('Apply scaffold changes?', { modal: true }, 'Apply');
    if (apply !== 'Apply') return;
  }

  // Apply WorkspaceEdit
  const edit = new vscode.WorkspaceEdit();
  for (const f of files) {
    const rel = sanitizeRelativePath(f.path);
    if (!rel) continue;
    const target = vscode.Uri.joinPath(workspaceFolder.uri, rel);
    const exist = await fileExists(target);
    if (!exist) {
      edit.createFile(target, { overwrite: false, ignoreIfExists: true });
    } else if (!allowOverwrite) {
      const ans = await vscode.window.showWarningMessage(`Overwrite existing file ${rel}?`, { modal: true }, 'Overwrite', 'Skip');
      if (ans !== 'Overwrite') continue;
    }
    edit.set(target, [vscode.TextEdit.replace(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, 0), f.content)]);
  }
  const applied = await vscode.workspace.applyEdit(edit);
  if (applied) {
    vscode.window.showInformationMessage('Scaffold applied.');
  } else {
    vscode.window.showErrorMessage('Failed to apply scaffold edits.');
  }
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function createTempDocument(content: string, name: string): Promise<vscode.Uri> {
  const doc = await vscode.workspace.openTextDocument({ content, language: guessLanguage(name) });
  return doc.uri;
}

function guessLanguage(fileName: string): string | undefined {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.ts': return 'typescript';
    case '.tsx': return 'typescriptreact';
    case '.js': return 'javascript';
    case '.jsx': return 'javascriptreact';
    case '.py': return 'python';
    case '.md': return 'markdown';
    case '.json': return 'json';
    case '.yml':
    case '.yaml': return 'yaml';
    case '.go': return 'go';
    case '.rs': return 'rust';
    case '.java': return 'java';
    case '.gradle': return 'groovy';
    default: return undefined;
  }
}


