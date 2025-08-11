import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { Logger, ConsoleLogger } from './logger';
import { ChatViewProvider } from './chatViewProvider';
import { ToolsViewProvider } from './toolsViewProvider';
import { VoiceSession } from './voiceSession';
import { AgentOrchestrator } from './agents';
import { registerCommands } from './commands';

let ollamaClient: OllamaClient;
let logger: Logger;
let chatProvider: ChatViewProvider;
let toolsProvider: ToolsViewProvider;
let voiceSession: VoiceSession;
let agentOrchestrator: AgentOrchestrator;

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    logger = new ConsoleLogger();
    
    // Initialize Ollama client
    const config = vscode.workspace.getConfiguration('vibecaas');
    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
    ollamaClient = new OllamaClient(ollamaUrl, logger);
    
    // Initialize agent orchestrator
    agentOrchestrator = new AgentOrchestrator(ollamaClient, logger);

    // Register chat view provider
    chatProvider = new ChatViewProvider(context.extensionUri, ollamaClient, logger);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatProvider
        )
    );

    // Register tools view provider
    toolsProvider = new ToolsViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'vibecaas.toolsView',
            toolsProvider
        )
    );

    // Initialize voice session
    voiceSession = new VoiceSession(ollamaClient, logger);

    // Register all commands
    const ctx = {
        ollamaClient,
        chatProvider,
        logger,
        updateModelStatus: (model: string) => {
            // Update status bar with new model
            const modeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
            modeStatusBarItem.text = `$(symbol-color) ${model}`;
            modeStatusBarItem.show();
        }
    };
    
    registerCommands(context, ctx);

    // Status bar items
    const modelStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    modelStatusBarItem.text = '$(server) Ollama';
    modelStatusBarItem.tooltip = 'Click to change model';
    modelStatusBarItem.command = 'vibecaas.changeModel';
    context.subscriptions.push(modelStatusBarItem);

    const voiceStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    voiceStatusBarItem.text = '$(mic) Voice';
    voiceStatusBarItem.tooltip = 'Click to toggle voice mode';
    voiceStatusBarItem.command = 'vibecaas.toggleVoiceMode';
    context.subscriptions.push(voiceStatusBarItem);

    const modeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    modeStatusBarItem.text = '$(symbol-color) Chat';
    modeStatusBarItem.tooltip = 'Current mode';
    context.subscriptions.push(modeStatusBarItem);

    // Show status bar items
    modelStatusBarItem.show();
    voiceStatusBarItem.show();
    modeStatusBarItem.show();

    // Update status periodically
    const updateStatus = async () => {
        try {
            const models = await ollamaClient.listModels();
            const currentModel = config.get<string>('defaultModel', 'none');
            const isOnline = models.length > 0;
            
            modelStatusBarItem.text = `$(server) ${isOnline ? 'Online' : 'Offline'}`;
            modelStatusBarItem.backgroundColor = isOnline ? undefined : new vscode.ThemeColor('errorForeground');
            
            if (isOnline) {
                const hasCurrentModel = models.some(m => m.name === currentModel);
                modeStatusBarItem.text = `$(symbol-color) ${hasCurrentModel ? currentModel : models[0].name}`;
            } else {
                modeStatusBarItem.text = '$(symbol-color) Offline';
            }
        } catch (error) {
            modelStatusBarItem.text = '$(server) Error';
            modelStatusBarItem.backgroundColor = new vscode.ThemeColor('errorForeground');
            modeStatusBarItem.text = '$(symbol-color) Error';
        }
    };

    // Initial status update
    updateStatus();

    // Update status every 30 seconds
    const statusInterval = setInterval(updateStatus, 30000);
    context.subscriptions.push({ dispose: () => clearInterval(statusInterval) });

    // Configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('vibecaas.ollamaUrl')) {
                const newUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
                ollamaClient.setBaseUrl(newUrl);
                updateStatus();
            }
        })
    );

    logger.log('VibeCaas extension activated');
}

export function deactivate() {
    logger?.log('VibeCaas extension deactivated');
}

