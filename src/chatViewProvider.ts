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

    constructor(
        ollamaClient: OllamaClient,
        logger: Logger
    ) {
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
                vscode.Uri.joinPath(this._getExtensionUri(), 'media')
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
            vscode.Uri.joinPath(this._getExtensionUri(), 'media', 'VibeCaaSLogo.png')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCaas Chat</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(vscode.Uri.joinPath(this._getExtensionUri(), 'media', 'chat.css'))}">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Header with Logo and Actions -->
    <div class="chat-header">
        <div class="logo-container">
            <img src="${logoUri}" alt="VibeCaas" class="logo">
            <span class="logo-text">VibeCaas</span>
        </div>
        
        <div class="header-actions">
            <button class="header-button" id="settingsBtn">⚙️ Settings</button>
            <button class="header-button" id="profileBtn">👤 Profile</button>
            <button class="header-button" id="helpBtn">❓ Help</button>
        </div>
    </div>

    <!-- Main Chat Container -->
    <div class="chat-container">
        <!-- Messages Area -->
        <div class="messages-container" id="messagesContainer">
            <!-- Welcome Message -->
            <div class="message assistant">
                <div class="message-avatar">AI</div>
                <div class="message-content">
                    <div class="message-text">
                        👋 Welcome to VibeCaas! I'm your AI coding assistant powered by local Ollama models.
                        <br><br>
                        <strong>What can I help you with today?</strong>
                        <br><br>
                        💡 <strong>New Feature:</strong> Try asking me to create a complete application! I have specialized AI agents that work together to:
                        <br>• 🏗️ Design system architecture
                        <br>• 🎨 Create frontend components
                        <br>• 🔧 Build backend APIs
                        <br>• 🚀 Handle deployment
                    </div>
                    <div class="action-chips">
                        <div class="action-chip" data-action="plan">📋 Generate Plan</div>
                        <div class="action-chip" data-action="debug">🐛 Debug Code</div>
                        <div class="action-chip" data-action="explain">💡 Explain Code</div>
                        <div class="action-chip" data-action="scaffold">🏗️ Scaffold App</div>
                        <div class="action-chip" data-action="create-app">🚀 Create Full App</div>
                    </div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-container">
            <div class="input-wrapper">
                <textarea 
                    id="messageInput" 
                    class="input-field" 
                    placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                    rows="1"
                ></textarea>
                <button class="voice-button" id="voiceButton" title="Toggle Voice Mode">
                    🎤
                </button>
                <button class="send-button" id="sendButton" disabled>
                    Send
                </button>
            </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
            <div class="status-item">
                <div class="status-dot" id="ollamaStatus"></div>
                <span id="ollamaStatusText">Ollama</span>
            </div>
            <div class="status-item">
                <div class="status-dot" id="modelStatus"></div>
                <span id="modelStatusText">Model</span>
            </div>
            <div class="status-item">
                <div class="status-dot" id="voiceStatus"></div>
                <span id="voiceStatusText">Voice</span>
            </div>
            <div class="status-item">
                <span id="currentMode">Mode: Chat</span>
            </div>
        </div>
    </div>

    <!-- Settings Modal -->
    <div id="settingsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>⚙️ Settings</h2>
                <button class="modal-close" id="settingsClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h3>🤖 Ollama Configuration</h3>
                    <div class="setting-item">
                        <label for="ollamaUrl">Ollama URL:</label>
                        <input type="text" id="ollamaUrl" placeholder="http://localhost:11434">
                    </div>
                    <div class="setting-item">
                        <label for="defaultModel">Default Model:</label>
                        <select id="defaultModel">
                            <option value="codellama:13b">CodeLlama 13B</option>
                            <option value="qwen2.5-coder:7b">Qwen2.5 Coder 7B</option>
                            <option value="mistral:latest">Mistral Latest</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="maxContextBytes">Max Context (bytes):</label>
                        <input type="number" id="maxContextBytes" value="8192">
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎤 Voice Settings</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="enableVoice"> Enable Voice Mode
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="voskModelPath">Vosk Model Path:</label>
                        <input type="text" id="voskModelPath" placeholder="/path/to/vosk/model">
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🔧 Advanced Settings</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="enableDebug"> Enable Debug Logging
                        </label>
                    </div>
                    <div class="setting-item">
                        <label for="mode">Default Mode:</label>
                        <select id="mode">
                            <option value="chat">Chat</option>
                            <option value="vibe">Vibe Mode</option>
                            <option value="code">Code Mode</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🏗️ Scaffold Settings</h3>
                    <div class="setting-item">
                        <label for="maxFiles">Max Files:</label>
                        <input type="number" id="maxFiles" value="10">
                    </div>
                    <div class="setting-item">
                        <label for="maxTotalBytes">Max Total Size (bytes):</label>
                        <input type="number" id="maxTotalBytes" value="1048576">
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="allowOverwrite"> Allow File Overwrite
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="settingsReset">Reset to Defaults</button>
                <button class="btn-primary" id="settingsSave">Save Settings</button>
            </div>
        </div>
    </div>

    <!-- Profile Modal -->
    <div id="profileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>👤 Profile & Preferences</h2>
                <button class="modal-close" id="profileClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="profile-section">
                    <h3>👨‍💻 Developer Profile</h3>
                    <div class="setting-item">
                        <label for="developerName">Name:</label>
                        <input type="text" id="developerName" placeholder="Your Name">
                    </div>
                    <div class="setting-item">
                        <label for="preferredLanguage">Preferred Language:</label>
                        <select id="preferredLanguage">
                            <option value="typescript">TypeScript</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="rust">Rust</option>
                            <option value="go">Go</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="framework">Preferred Framework:</label>
                        <select id="framework">
                            <option value="react">React</option>
                            <option value="vue">Vue</option>
                            <option value="angular">Angular</option>
                            <option value="nextjs">Next.js</option>
                            <option value="express">Express</option>
                            <option value="fastapi">FastAPI</option>
                        </select>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🎨 UI Preferences</h3>
                    <div class="setting-item">
                        <label for="theme">Theme:</label>
                        <select id="theme">
                            <option value="dark">Dark (Default)</option>
                            <option value="light">Light</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="fontSize">Font Size:</label>
                        <select id="fontSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>📊 Usage Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="totalMessages">0</div>
                            <div class="stat-label">Messages</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalTokens">0</div>
                            <div class="stat-label">Tokens Used</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="projectsCreated">0</div>
                            <div class="stat-label">Projects</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="profileExport">Export Profile</button>
                <button class="btn-primary" id="profileSave">Save Profile</button>
            </div>
        </div>
    </div>

    <!-- Help Modal -->
    <div id="helpModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>❓ Help & Documentation</h2>
                <button class="modal-close" id="helpClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="help-section">
                    <h3>🚀 Getting Started</h3>
                    <p>VibeCaas is your AI-powered coding assistant that runs locally using Ollama models.</p>
                    <ul>
                        <li><strong>Chat Mode:</strong> General conversation and code assistance</li>
                        <li><strong>Vibe Mode:</strong> Brainstorming and planning</li>
                        <li><strong>Code Mode:</strong> Direct code generation</li>
                        <li><strong>App Creation:</strong> Full application development with AI agents</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>🤖 AI Development Agents</h3>
                    <p>VibeCaas uses specialized AI agents that work together:</p>
                    <ul>
                        <li><strong>System Architect:</strong> Designs system architecture and technology stack</li>
                        <li><strong>Frontend Developer:</strong> Creates React components and UI</li>
                        <li><strong>Backend Developer:</strong> Builds APIs and server logic</li>
                        <li><strong>DevOps Engineer:</strong> Handles deployment and infrastructure</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item">
                            <kbd>Enter</kbd>
                            <span>Send message</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Shift + Enter</kbd>
                            <span>New line</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Cmd/Ctrl + K</kbd>
                            <span>Clear chat</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Cmd/Ctrl + ,</kbd>
                            <span>Open settings</span>
                        </div>
                    </div>
                </div>

                <div class="help-section">
                    <h3>🤖 Available Models</h3>
                    <p>Make sure you have Ollama installed and running locally. Recommended models:</p>
                    <ul>
                        <li><strong>codellama:13b</strong> - Best for code generation</li>
                        <li><strong>qwen2.5-coder:7b</strong> - Fast and efficient</li>
                        <li><strong>mistral:latest</strong> - Good all-around performance</li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3>🔧 Troubleshooting</h3>
                    <p>If you encounter issues:</p>
                    <ol>
                        <li>Check that Ollama is running on localhost:11434</li>
                        <li>Verify your model is downloaded: <code>ollama list</code></li>
                        <li>Check the status indicators in the bottom bar</li>
                        <li>Reload the extension if needed</li>
                    </ol>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" id="helpCloseBtn">Got it!</button>
            </div>
        </div>
    </div>

    <!-- Modal Styles -->
    <style>
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: linear-gradient(145deg, var(--darker) 0%, var(--dark) 100%);
            margin: 5% auto;
            padding: 0;
            border: 1px solid rgba(94, 54, 133, 0.5);
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
            background: rgba(72, 28, 109, 0.6);
            padding: 20px;
            border-bottom: 1px solid rgba(94, 54, 133, 0.4);
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            margin: 0;
            color: var(--white);
            font-size: 20px;
        }

        .modal-close {
            background: none;
            border: none;
            color: var(--white);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }

        .modal-close:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
            padding: 20px;
        }

        .modal-footer {
            background: rgba(72, 28, 109, 0.4);
            padding: 20px;
            border-top: 1px solid rgba(94, 54, 133, 0.4);
            border-radius: 0 0 12px 12px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .settings-section,
        .profile-section,
        .help-section {
            margin-bottom: 24px;
        }

        .settings-section h3,
        .profile-section h3,
        .help-section h3 {
            color: var(--light);
            margin-bottom: 16px;
            font-size: 16px;
            border-bottom: 1px solid rgba(94, 54, 133, 0.3);
            padding-bottom: 8px;
        }

        .setting-item {
            margin-bottom: 16px;
        }

        .setting-item label {
            display: block;
            margin-bottom: 6px;
            color: var(--white);
            font-weight: 500;
        }

        .setting-item input[type="text"],
        .setting-item input[type="number"],
        .setting-item select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid rgba(94, 54, 133, 0.5);
            border-radius: 6px;
            background: rgba(94, 54, 133, 0.3);
            color: var(--white);
            font-size: 14px;
        }

        .setting-item input[type="checkbox"] {
            margin-right: 8px;
        }

        .btn-primary,
        .btn-secondary {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent) 0%, var(--medium) 100%);
            color: var(--white);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(130, 0, 126, 0.3);
        }

        .btn-secondary {
            background: rgba(94, 54, 133, 0.3);
            color: var(--white);
            border: 1px solid rgba(94, 54, 133, 0.5);
        }

        .btn-secondary:hover {
            background: rgba(94, 54, 133, 0.5);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 16px;
        }

        .stat-item {
            text-align: center;
            padding: 16px;
            background: rgba(72, 28, 109, 0.3);
            border-radius: 8px;
            border: 1px solid rgba(94, 54, 133, 0.3);
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--accent);
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 12px;
            color: var(--light);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .shortcuts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
        }

        .shortcut-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background: rgba(72, 28, 109, 0.3);
            border-radius: 6px;
        }

        kbd {
            background: rgba(94, 54, 133, 0.5);
            border: 1px solid rgba(94, 54, 133, 0.7);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            font-family: monospace;
            color: var(--light);
        }

        .help-section ul,
        .help-section ol {
            margin: 12px 0;
            padding-left: 20px;
        }

        .help-section li {
            margin-bottom: 8px;
            color: var(--light);
        }

        .help-section code {
            background: rgba(28, 28, 28, 0.8);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            color: var(--light);
        }
    </style>

    <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this._getExtensionUri(), 'media', 'chat.js'))}"></script>
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
        return vscode.Uri.file(__dirname).with({ scheme: 'vscode-resource' });
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

