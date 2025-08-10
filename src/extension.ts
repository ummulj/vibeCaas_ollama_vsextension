import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { ChatViewProvider } from './chatViewProvider';
import { registerCommands } from './commands';
import { Logger } from './logger';
import { VoiceSession } from './voiceSession';

let chatProvider: ChatViewProvider | undefined;
let ollamaClient: OllamaClient | undefined;
let logger: Logger | undefined;
let voiceSession: VoiceSession | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('vibecaas');
  const debugEnabled = config.get<boolean>('enableDebug', false);
  logger = new Logger(debugEnabled);
  logger.info('Activating VibeCaas.ai extension');

  const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
  const defaultModel = config.get<string>('defaultModel', 'qwen2.5-coder:7b');

  ollamaClient = new OllamaClient(ollamaUrl, logger);

  chatProvider = new ChatViewProvider(context.extensionUri, ollamaClient, logger);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('vibecaas.chatView', chatProvider)
  );

  // Status bar: show current model and voice toggle
  const modelStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  modelStatus.command = 'vibecaas.changeModel';
  modelStatus.text = `$(server) ${defaultModel}`;
  modelStatus.tooltip = 'VibeCaas.ai: Change Model';
  modelStatus.show();
  context.subscriptions.push(modelStatus);

  const voiceStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  voiceStatus.command = 'vibecaas.toggleVoiceMode';
  voiceStatus.text = '$(unmute) Vibe';
  voiceStatus.tooltip = 'VibeCaas.ai: Toggle Voice Mode';
  voiceStatus.show();
  context.subscriptions.push(voiceStatus);

  const modeStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
  modeStatus.command = 'vibecaas.toggleMode';
  const currentMode = vscode.workspace.getConfiguration('vibecaas').get<'vibe' | 'code'>('mode', 'code');
  modeStatus.text = currentMode === 'code' ? '$(code) Code' : '$(megaphone) Vibe';
  modeStatus.tooltip = 'VibeCaas.ai: Toggle Vibe/Code Mode';
  modeStatus.show();
  context.subscriptions.push(modeStatus);

  registerCommands(context, {
    ollamaClient,
    chatProvider,
    logger,
    updateModelStatus: (model: string) => (modelStatus.text = `$(server) ${model}`),
  });

  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('vibecaas.enableDebug')) {
      const enabled = vscode.workspace.getConfiguration('vibecaas').get<boolean>('enableDebug', false);
      logger?.setEnabled(enabled ?? false);
    }
    if (e.affectsConfiguration('vibecaas.mode')) {
      const m = vscode.workspace.getConfiguration('vibecaas').get<'vibe' | 'code'>('mode', 'code');
      modeStatus.text = m === 'code' ? '$(code) Code' : '$(megaphone) Vibe';
    }
  });

  // Voice session lifecycle based on setting
  const voiceEnabled = vscode.workspace.getConfiguration('vibecaas').get<boolean>('enableVoice', false);
  voiceSession = new VoiceSession(ollamaClient, logger);
  if (voiceEnabled) {
    voiceSession.start();
  }
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('vibecaas.enableVoice')) {
        const enabled = vscode.workspace.getConfiguration('vibecaas').get<boolean>('enableVoice', false);
        if (enabled) await voiceSession?.start();
        else await voiceSession?.stop();
      }
    })
  );
}

export function deactivate() {}

