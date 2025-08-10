import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getWorkspaceRoot(): Promise<string | undefined> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

export async function getGitDiff(opts?: { staged?: boolean }): Promise<string> {
  const root = await getWorkspaceRoot();
  if (!root) return '';
  try {
    const cmd = opts?.staged ? 'git diff --staged' : 'git diff';
    const { stdout } = await execAsync(cmd, { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    return stdout || '';
  } catch {
    return '';
  }
}

export async function getGitStatusShort(): Promise<string> {
  const root = await getWorkspaceRoot();
  if (!root) return '';
  try {
    const { stdout } = await execAsync('git status -s', { cwd: root });
    return stdout || '';
  } catch {
    return '';
  }
}

