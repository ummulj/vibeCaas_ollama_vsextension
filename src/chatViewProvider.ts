import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';
import { Logger } from './logger';
import { AgentOrchestrator } from './agents';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vibecaas.chatView';

    private _view?: vscode.WebviewView;
    private _ollamaClient: OllamaClient;
    private _logger: Logger;
    private _agentOrchestrator: AgentOrchestrator;
    private _extensionUri: vscode.Uri;

    constructor(
        extensionUri: vscode.Uri,
        ollamaClient: OllamaClient,
        logger: Logger
    ) {
        this._extensionUri = extensionUri;
        this._ollamaClient = ollamaClient;
        this._logger = logger;
        this._agentOrchestrator = new AgentOrchestrator(ollamaClient, logger);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                await this._handleWebviewMessage(message);
            } catch (error) {
                this._logger.error('Error handling webview message', error);
                this._postMessageToWebview('showError', { error: String(error) });
            }
        });

        // Send initial status
        this._updateStatus();
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'VibeCaaSLogo.png')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCaas Chat</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.css'))}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Modern Chat Interface -->
    <div class="chat-app">
        <!-- Clean Header -->
        <div class="chat-header">
            <div class="header-left">
                <div class="logo-section">
                    <img src="${logoUri}" alt="VibeCaas" class="header-logo">
                    <span class="header-title">VibeCaas</span>
                </div>
                <div class="header-subtitle">AI Coding Assistant</div>
            </div>
            
            <div class="header-actions">
                <button class="action-btn" id="settingsBtn" title="Settings">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                    </svg>
                </button>
                <button class="action-btn" id="helpBtn" title="Help">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <path d="M12 17h.01"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chat-main">
            <!-- Messages Container -->
            <div class="messages-container" id="messagesContainer">
                <!-- Welcome Message -->
                <div class="message assistant">
                    <div class="message-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">VibeCaas AI</span>
                            <span class="message-time">Just now</span>
                        </div>
                        <div class="message-text">
                            <p>👋 Welcome! I'm your AI coding assistant powered by local Ollama models.</p>
                            <p>I can help you with:</p>
                            <ul>
                                <li>🏗️ <strong>Planning & Architecture</strong> - Design system architecture and implementation plans</li>
                                <li>💻 <strong>Code Generation</strong> - Write idiomatic, well-documented code</li>
                                <li>🐛 <strong>Debugging & Review</strong> - Identify issues and suggest improvements</li>
                                <li>🚀 <strong>Application Scaffolding</strong> - Generate complete applications</li>
                            </ul>
                        </div>
                        
                        <!-- Quick Action Buttons -->
                        <div class="quick-actions">
                            <button class="quick-action-btn" data-action="plan">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 11H1l8-8v8Z"/>
                                    <path d="M23 13h-8l8 8v-8Z"/>
                                    <path d="M9 13H1l8 8v-8Z"/>
                                    <path d="M23 11h-8l8-8v8Z"/>
                                </svg>
                                Plan Project
                            </button>
                            <button class="quick-action-btn" data-action="debug">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 9l3 3-3 3"/>
                                    <path d="M16 9l-3 3 3 3"/>
                                    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/>
                                </svg>
                                Debug Code
                            </button>
                            <button class="quick-action-btn" data-action="explain">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                    <path d="M12 17h.01"/>
                                </svg>
                                Explain Code
                            </button>
                            <button class="quick-action-btn" data-action="scaffold">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3h18v18H3z"/>
                                    <path d="M9 9h6v6H9z"/>
                                    <path d="M3 9h6"/>
                                    <path d="M15 9h6"/>
                                    <path d="M3 15h6"/>
                                    <path d="M15 15h6"/>
                                </svg>
                                Scaffold App
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modern Input Area -->
            <div class="input-area">
                <div class="input-container">
                    <div class="input-wrapper">
                        <div class="input-field-container">
                            <textarea 
                                id="messageInput" 
                                class="input-field" 
                                placeholder="Ask anything... (selection and open files included as context)"
                                rows="1"
                            ></textarea>
                            <div class="input-actions">
                                <button class="input-action-btn" id="voiceButton" title="Voice Input">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                        <line x1="12" y1="19" x2="12" y2="23"/>
                                        <line x1="8" y1="23" x2="16" y2="23"/>
                                    </svg>
                                </button>
                                <button class="input-action-btn" id="refreshButton" title="Refresh">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                        <path d="M21 3v5h-5"/>
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                        <path d="M3 21v-5h5"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <button class="send-button" id="sendButton" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13"/>
                                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
            <div class="status-section">
                <div class="status-item">
                    <div class="status-indicator" id="ollamaStatus"></div>
                    <span class="status-text" id="ollamaStatusText">Ollama</span>
                </div>
                <div class="status-item">
                    <div class="status-indicator" id="modelStatus"></div>
                    <span class="status-text" id="modelStatusText">Model</span>
                </div>
            </div>
            
            <div class="status-section">
                <div class="status-item">
                    <div class="status-indicator" id="voiceStatus"></div>
                    <span class="status-text" id="voiceStatusText">Voice</span>
                </div>
                <div class="status-item">
                    <span class="mode-indicator" id="currentMode">Chat Mode</span>
                </div>
            </div>
        </div>
    </div>

    <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.js'))}"></script>
</body>
</html>`;
    }

    private async _handleWebviewMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'chat':
                await this._handleChatMessage(message);
                break;
            case 'requestModels':
                await this._handleRequestModels();
                break;
            case 'toggleVoice':
                await this._handleToggleVoice();
                break;
            case 'updateSettings':
                await this._handleUpdateSettings(message.settings);
                break;
            case 'getStatus':
                await this._updateStatus();
                break;
            case 'createApp':
                await this._handleCreateApp(message.requirements);
                break;
            default:
                this._logger.log(`Unknown message command: ${message.command}`);
        }
    }

    private async _handleChatMessage(message: any): Promise<void> {
        try {
            // Check if this is a request to create an app
            if (message.message.toLowerCase().includes('create app') || 
                message.message.toLowerCase().includes('build app') ||
                message.message.toLowerCase().includes('generate app')) {
                await this._handleCreateApp(message.message);
                return;
            }

            // Check if this is a scaffold request
            if (message.message.toLowerCase().includes('scaffold')) {
                await this._handleScaffoldRequest(message.message);
                return;
            }

            // Regular chat message
            const response = await this._ollamaClient.generate({
                model: 'mistral:latest',
                prompt: message.message,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 2048
                }
            });

            this._postMessageToWebview('addMessage', {
                sender: 'assistant',
                content: response.response,
                timestamp: Date.now()
            });

        } catch (error) {
            this._logger.error('Error handling chat message', error);
            this._postMessageToWebview('showError', { error: String(error) });
        }
    }

    private async _handleCreateApp(requirements: string): Promise<void> {
        try {
            this._postMessageToWebview('addMessage', {
                sender: 'assistant',
                content: `🚀 Starting to create your application! Let me break this down and coordinate with my specialized AI agents...`,
                timestamp: Date.now()
            });

            // Create a new project
            const project = await this._agentOrchestrator.createProject({
                name: 'AI Generated App',
                description: requirements,
                requirements: requirements,
                targetPlatform: 'web',
                complexity: 'medium'
            });

            // Execute the project
            const result = await this._agentOrchestrator.executeProject(project.id);

            // Send the result back to the chat
            this._postMessageToWebview('addMessage', {
                sender: 'assistant',
                content: `✅ Application created successfully! Here's what was generated:

🏗️ **Architecture**: ${result.architecture ? 'Completed' : 'Failed'}
🎨 **Frontend**: ${result.frontend ? 'Completed' : 'Failed'}
🔧 **Backend**: ${result.backend ? 'Completed' : 'Failed'}
🚀 **DevOps**: ${result.devops ? 'Completed' : 'Failed'}

📁 **Files Generated**: ${result.files.length} files
⏱️ **Total Time**: ${this._calculateTimeDifference(result.createdAt, result.completedAt)}

Your application is ready! The AI agents have created a complete, deployable application based on your requirements.`,
                timestamp: Date.now(),
                showActions: false
            });

            // Show the generated files
            if (result.files.length > 0) {
                this._postMessageToWebview('addMessage', {
                    sender: 'assistant',
                    content: `📁 **Generated Files:**

${result.files.map(file => `• \`${file.path}\` (${file.language})`).join('\n')}

Would you like me to create these files in your workspace?`,
                    timestamp: Date.now(),
                    showActions: false
                });
            }

        } catch (error) {
            this._logger.error('Error creating app', error);
            this._postMessageToWebview('addMessage', {
                sender: 'assistant',
                content: `❌ Sorry, I encountered an error while creating your application: ${error}`,
                timestamp: Date.now(),
                showActions: false
            });
        }
    }

    private async _handleScaffoldRequest(message: string): Promise<void> {
        // This will be handled by the existing scaffold functionality
        // For now, just acknowledge it
        this._postMessageToWebview('addMessage', {
            sender: 'assistant',
            content: `🏗️ Scaffolding request received: ${message}`,
            timestamp: Date.now()
        });
    }

    private async _handleRequestModels(): Promise<void> {
        try {
            const models = await this._ollamaClient.listModels();
            this._postMessageToWebview('setModels', { models: models.map(m => m.name) });
        } catch (error) {
            this._logger.error('Error requesting models', error);
        }
    }

    private async _handleToggleVoice(): Promise<void> {
        // This will be handled by the voice session
        this._logger.log('Voice toggle requested');
    }

    private async _handleUpdateSettings(settings: any): Promise<void> {
        // Update extension settings
        const config = vscode.workspace.getConfiguration('vibecaas');
        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value);
        }
        this._logger.log('Settings updated');
    }

    private async _updateStatus(): Promise<void> {
        try {
            // Check Ollama status
            const models = await this._ollamaClient.listModels();
            const ollamaStatus = models.length > 0 ? 'online' : 'offline';

            // Check current model
            const currentModel = models.length > 0 ? models[0].name : 'none';

            this._postMessageToWebview('updateStatus', {
                ollama: ollamaStatus,
                model: ollamaStatus === 'online' ? 'online' : 'offline',
                voice: 'offline' // Voice status will be updated by voice session
            });

        } catch (error) {
            this._logger.error('Error updating status', error);
            this._postMessageToWebview('updateStatus', {
                ollama: 'offline',
                model: 'offline',
                voice: 'offline'
            });
        }
    }

    private _postMessageToWebview(command: string, data: any): void {
        if (this._view) {
            this._view.webview.postMessage({ command, ...data });
        }
    }

    private _getExtensionUri(): vscode.Uri {
        return this._extensionUri;
    }

    public notifyVoiceToggled(enabled: boolean): void {
        this._postMessageToWebview('voiceToggled', { enabled });
    }

    private _calculateTimeDifference(start: Date, end?: Date): string {
        if (!end) return 'Unknown';
        const diff = end.getTime() - start.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
}

