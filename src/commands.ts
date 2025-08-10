import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { ChatViewProvider } from './chatViewProvider';
import { Logger } from './logger';
import { collectEditorContext } from './contextCollector';
import { confirmAndSaveActive, safeOpen, safeShowDiff } from './safeCommands';
import { getGitDiff, getGitStatusShort } from './gitUtils';

type Ctx = {
  ollamaClient?: OllamaClient;
  chatProvider?: ChatViewProvider;
  logger?: Logger;
  updateModelStatus: (model: string) => void;
};

export function registerCommands(context: vscode.ExtensionContext, ctx: Ctx) {
  const config = () => vscode.workspace.getConfiguration('vibecaas');

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.openChat', async () => {
      await vscode.commands.executeCommand('vibecaas.chatView.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.generateCode', async () => {
      if (!ctx.ollamaClient) return;
      const model = config().get<string>('defaultModel', 'qwen2.5-coder:7b');
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe the code to generate',
        placeHolder: 'e.g., Write a FastAPI user creation endpoint',
      });
      if (!prompt) return;
      const maxBytes = config().get<number>('maxContextBytes', 200000);
      const editorContext = await collectEditorContext(maxBytes);
      const templates = config().get<any>('promptTemplates') || {};
      const prefix = templates.generate || 'Generate idiomatic, well-documented code for the following request.';
      const full = `${prefix}\n\nRequest:\n${prompt}\n\nRelevant context (may be truncated):\n${editorContext}`;
      const channel = vscode.window.createOutputChannel('VibeCaas.ai');
      channel.show(true);
      channel.appendLine(`Model: ${model}`);
      channel.appendLine('Generating code...');
      try {
        let out = '';
        await ctx.ollamaClient.generate({ model, prompt: full, stream: true }, (t) => {
          channel.append(t);
          out += t;
        });
        await vscode.env.clipboard.writeText(out);
        vscode.window.showInformationMessage('Code copied to clipboard. Paste into your editor or Cursor Composer.');
      } catch (err: any) {
        vscode.window.showErrorMessage(`Ollama error: ${err.message || err}`);
      }
    })
  );

  // Generate Plan (Vibe Mode)
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.generatePlan', async () => {
      if (!ctx.ollamaClient) return;
      const model = config().get<string>('defaultModel', 'qwen2.5-coder:7b');
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe what to plan/spec',
        placeHolder: 'e.g., Plan a Python FastAPI REST API',
      });
      if (!prompt) return;
      const maxBytes = config().get<number>('maxContextBytes', 200000);
      const editorContext = await collectEditorContext(maxBytes);
      const templates = config().get<any>('promptTemplates') || {};
      const prefix = templates.plan || 'Create a step-by-step implementation plan for the following task.';
      const full = `${prefix}\n\nTask:\n${prompt}\n\nContext (may be truncated):\n${editorContext}\n\nOutput a concise, well-structured markdown product spec.`;
      try {
        let out = '# Spec\n\n';
        await ctx.ollamaClient.generate({ model, prompt: full, stream: true }, (t) => (out += t));
        const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: out });
        await vscode.window.showTextDocument(doc, { preview: false });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Ollama error: ${err.message || err}`);
      }
    })
  );

  // Debug selection prompt
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.debugSelection', async () => {
      if (!ctx.ollamaClient) return;
      const model = config().get<string>('defaultModel', 'qwen2.5-coder:7b');
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('Select some code to debug.');
        return;
      }
      const selected = editor.document.getText(editor.selection);
      const templates = config().get<any>('promptTemplates') || {};
      const prefix = templates.debug || 'Identify potential errors or edge cases in the following code and suggest fixes.';
      const full = `${prefix}\n\nCode:\n\n${selected}`;
      const channel = vscode.window.createOutputChannel('VibeCaas.ai');
      channel.show(true);
      try {
        await ctx.ollamaClient.generate({ model, prompt: full, stream: true }, (t) => channel.append(t));
      } catch (err: any) {
        vscode.window.showErrorMessage(`Ollama error: ${err.message || err}`);
      }
    })
  );

  // Toggle mode
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.toggleMode', async () => {
      const current = config().get<'vibe' | 'code'>('mode', 'code');
      const next = current === 'code' ? 'vibe' : 'code';
      await config().update('mode', next, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Mode: ${next.toUpperCase()}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.changeModel', async () => {
      if (!ctx.ollamaClient) return;
      try {
        const models = await ctx.ollamaClient.listModels();
        const pick = await vscode.window.showQuickPick(models, { placeHolder: 'Select default model' });
        if (pick) {
          await config().update('defaultModel', pick, vscode.ConfigurationTarget.Global);
          ctx.updateModelStatus(pick);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to list models: ${err.message || err}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.pullModel', async () => {
      if (!ctx.ollamaClient) return;
      const name = await vscode.window.showInputBox({ prompt: 'Model name to pull (e.g., codellama:13b)' });
      if (!name) return;
      const progressOpts = { location: vscode.ProgressLocation.Notification, title: `Pulling ${name}` };
      await vscode.window.withProgress(progressOpts, async (p) => {
        try {
          await ctx.ollamaClient!.pullModel(name, (s) => p.report({ message: s.slice(-80) }));
          vscode.window.showInformationMessage(`Model ${name} pulled.`);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Failed to pull model: ${err.message || err}`);
        }
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.toggleVoiceMode', async () => {
      const enabled = config().get<boolean>('enableVoice', false);
      await config().update('enableVoice', !enabled, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Voice Mode ${!enabled ? 'enabled' : 'disabled'}.`);
      if (!enabled) {
        process.stdout.write('\x07'); // BEL beep as a light cue
      }
      ctx.chatProvider?.notifyVoiceToggled(!enabled);
    })
  );

  // Safe command helpers
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.openFile', async (filePath?: string) => {
      if (!filePath) {
        const picked = await vscode.window.showOpenDialog({ canSelectMany: false });
        if (!picked || picked.length === 0) return;
        await safeOpen(picked[0].fsPath);
      } else {
        await safeOpen(filePath);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.showDiff', async () => {
      const picks = await vscode.window.showOpenDialog({ canSelectMany: true, openLabel: 'Pick two files for diff' });
      if (!picks || picks.length < 2) {
        vscode.window.showWarningMessage('Pick two files to diff.');
        return;
      }
      await safeShowDiff(picks[0], picks[1], 'VibeCaas Diff');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.saveActive', async () => {
      await confirmAndSaveActive();
    })
  );

  // Git-aware prompts
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.summarizeDiff', async () => {
      const diff = await getGitDiff({ staged: false });
      if (!diff) {
        vscode.window.showInformationMessage('No git diff found.');
        return;
      }
      if (!ctx.ollamaClient) return;
      const model = config().get<string>('defaultModel', 'qwen2.5-coder:7b');
      const prompt = `Summarize the following git diff, list key changes and potential risks:\n\n${diff}`;
      const ch = vscode.window.createOutputChannel('VibeCaas.ai');
      ch.show(true);
      await ctx.ollamaClient.generate({ model, prompt, stream: true }, (t) => ch.append(t));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibecaas.commitMessageFromDiff', async () => {
      const status = await getGitStatusShort();
      const diff = await getGitDiff({ staged: true });
      if (!diff) {
        vscode.window.showInformationMessage('No staged changes. Stage files first.');
        return;
      }
      if (!ctx.ollamaClient) return;
      const model = config().get<string>('defaultModel', 'qwen2.5-coder:7b');
      const prompt = `Write a concise Conventional Commit message based on the staged diff. Include scope if obvious.\n\nSTATUS:\n${status}\n\nDIFF:\n${diff}`;
      let out = '';
      await ctx.ollamaClient.generate({ model, prompt, stream: true }, (t) => (out += t));
      await vscode.env.clipboard.writeText(out.trim());
      vscode.window.showInformationMessage('Commit message copied to clipboard.');
    })
  );
}

