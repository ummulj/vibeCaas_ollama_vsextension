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
        this._logger.log('ChatViewProvider constructor called');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._logger.log('=== CHAT VIEW PROVIDER RESOLVE START ===');
        this._logger.log(`Resolving webview view for type: ${webviewView.viewType}`);
        this._logger.log(`Webview view visible: ${webviewView.visible}`);
        this._logger.log(`Webview view title: ${webviewView.title}`);
        this._logger.log(`Context: ${JSON.stringify(context)}`);
        
        this._view = webviewView;
        
        // Add debugging
        this._logger.log('Resolving webview view');
        this._logger.log(`Webview view type: ${webviewView.viewType}`);
        this._logger.log(`Webview view visible: ${webviewView.visible}`);

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };
        
        this._logger.log('Webview options set');

        const html = this._getHtmlForWebview(webviewView.webview);
        this._logger.log(`Generated HTML length: ${html.length}`);
        
        try {
            webviewView.webview.html = html;
            this._logger.log('HTML set on webview successfully');
        } catch (error) {
            this._logger.error('Failed to set HTML on webview:', error);
        }

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            this._logger.log(`Received message from webview: ${JSON.stringify(message)}`);
            try {
                await this._handleWebviewMessage(message);
            } catch (error) {
                this._logger.error('Error handling webview message', error);
                this._postMessageToWebview('showError', { error: String(error) });
            }
        });

        // Send initial status
        this._updateStatus();
        
        this._logger.log('Webview view resolved successfully');
        this._logger.log('=== CHAT VIEW PROVIDER RESOLVE END ===');
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'VibeCaaSLogo.png')
        );
        
        this._logger.log(`Logo URI: ${logoUri.toString()}`);
        this._logger.log(`Extension URI: ${this._extensionUri.toString()}`);

        // First, try a simple HTML to test if the issue is with complex content
        const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCaas Chat</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #f0f0f0; 
            color: #333; 
        }
        .test-content { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        h1 { color: #2563eb; }
        .status { 
            background: #10b981; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 10px 0; 
        }
    </style>
</head>
<body>
    <div class="test-content">
        <h1>VibeCaas Chat Test</h1>
        <div class="status">✅ Webview is working!</div>
        <p>If you can see this, the webview is functioning correctly.</p>
        <p>Logo URI: ${logoUri.toString()}</p>
        <p>Extension URI: ${this._extensionUri.toString()}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
    </div>
    <script>
        console.log('VibeCaas chat webview loaded successfully');
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded in VibeCaas webview');
        });
    </script>
</body>
</html>`;

        this._logger.log(`Generated simple HTML with ${simpleHtml.length} characters`);
        return simpleHtml;
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

