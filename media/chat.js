// VibeCaas Chat JavaScript - Modern UI Version
(function() {
    'use strict';

    // VS Code webview API
    const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : { postMessage: () => {} };

    // Global state
    let chatHistory = [];
    let currentSettings = {};
    let userProfile = {};
    let isTyping = false;
    let messageCounter = 0;

    // DOM elements
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const voiceButton = document.getElementById('voiceButton');
    const refreshButton = document.getElementById('refreshButton');
    
    // Status elements
    const ollamaStatus = document.getElementById('ollamaStatus');
    const modelStatus = document.getElementById('modelStatus');
    const voiceStatus = document.getElementById('voiceStatus');
    const currentMode = document.getElementById('currentMode');

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initializeChat();
        loadSettings();
        loadProfile();
        setupEventListeners();
        updateStatusIndicators();
    });

    function initializeChat() {
        // Load chat history from localStorage
        const savedHistory = localStorage.getItem('vibecaas_chat_history');
        if (savedHistory) {
            try {
                chatHistory = JSON.parse(savedHistory);
                renderChatHistory();
            } catch (e) {
                console.error('Failed to load chat history:', e);
                chatHistory = [];
            }
        }

        // Set initial message counter
        messageCounter = chatHistory.length;
    }

    function setupEventListeners() {
        // Message input handling
        messageInput.addEventListener('input', handleInputChange);
        messageInput.addEventListener('keydown', handleKeyDown);
        
        // Send button
        sendButton.addEventListener('click', sendMessage);
        
        // Voice button
        voiceButton.addEventListener('click', toggleVoiceMode);
        
        // Refresh button
        refreshButton.addEventListener('click', refreshChat);
        
        // Settings and help buttons
        document.getElementById('settingsBtn').addEventListener('click', openSettings);
        document.getElementById('helpBtn').addEventListener('click', openHelp);
        
        // Quick action buttons
        document.addEventListener('click', handleQuickActionClick);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        clearChat();
                        break;
                    case ',':
                        e.preventDefault();
                        openSettings();
                        break;
                }
            }
        });
    }

    function handleInputChange() {
        const hasText = messageInput.value.trim().length > 0;
        sendButton.disabled = !hasText;
        
        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage('user', message);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        handleInputChange();
        
        // Send to extension
        vscode.postMessage({
            command: 'chat',
            message: message,
            timestamp: Date.now()
        });

        // Show typing indicator
        showTypingIndicator();
    }

    function addMessage(sender, content, timestamp = Date.now()) {
        const messageId = ++messageCounter;
        const message = {
            id: messageId,
            sender,
            content,
            timestamp,
            type: 'text'
        };

        // Add to history
        chatHistory.push(message);
        
        // Save to localStorage
        saveChatHistory();
        
        // Render message
        renderMessage(message);
        
        // Scroll to bottom
        scrollToBottom();
        
        return messageId;
    }

    function renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}`;
        messageElement.dataset.messageId = message.id;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const content = document.createElement('div');
        content.className = 'message-content';

        const header = document.createElement('div');
        header.className = 'message-header';
        
        const author = document.createElement('span');
        author.className = 'message-author';
        
        const time = document.createElement('span');
        time.className = 'message-time';

        const text = document.createElement('div');
        text.className = 'message-text';

        // Set avatar icon
        switch(message.sender) {
            case 'user':
                avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                author.textContent = 'You';
                break;
            case 'assistant':
                avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
                author.textContent = 'VibeCaas AI';
                break;
            case 'agent':
                avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
                author.textContent = 'AI Agent';
                break;
            default:
                avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                author.textContent = 'Unknown';
        }

        // Set content
        if (message.type === 'code') {
            text.innerHTML = `<div class="code-block"><pre>${escapeHtml(message.content)}</pre></div>`;
        } else if (message.type === 'file') {
            text.innerHTML = `<div class="file-attachment">
                <span class="file-icon">📄</span>
                <span class="file-name">${message.fileName}</span>
            </div>`;
        } else {
            // Convert markdown-like content to HTML
            text.innerHTML = formatMessageContent(message.content);
        }

        // Set timestamp
        time.textContent = formatTimestamp(message.timestamp);

        // Add quick actions for assistant messages
        if (message.sender === 'assistant' && message.showActions !== false) {
            const quickActions = document.createElement('div');
            quickActions.className = 'quick-actions';
            quickActions.innerHTML = `
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
            `;
            content.appendChild(quickActions);
        }

        // Assemble message
        header.appendChild(author);
        header.appendChild(time);
        content.appendChild(header);
        content.appendChild(text);
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        messagesContainer.appendChild(messageElement);
    }

    function formatMessageContent(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function renderChatHistory() {
        messagesContainer.innerHTML = '';
        chatHistory.forEach(message => renderMessage(message));
    }

    function showTypingIndicator() {
        if (isTyping) return;
        
        isTyping = true;
        const typingElement = document.createElement('div');
        typingElement.className = 'message assistant typing-indicator';
        typingElement.id = 'typingIndicator';
        
        typingElement.innerHTML = `
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function handleQuickActionClick(e) {
        const target = e.target.closest('.quick-action-btn');
        if (target) {
            const action = target.dataset.action;
            // Notify extension so it can run native commands
            if (action === 'scaffold') {
                const requirements = prompt('Describe the app to scaffold');
                if (requirements && requirements.trim().length > 0) {
                    vscode.postMessage({ command: 'createApp', requirements });
                }
                return;
            }
            vscode.postMessage({ command: 'quickAction', action });

            // Also prefill input for user editing
            let actionText = '';
            switch(action) {
                case 'plan': actionText = 'Plan a project for me'; break;
                case 'debug': actionText = 'Debug this code'; break;
                case 'explain': actionText = 'Explain this code'; break;
                case 'scaffold': actionText = 'Scaffold a new application'; break;
                default: actionText = 'Help me with this';
            }
            messageInput.value = actionText + ': ';
            messageInput.focus();
            handleInputChange();
        }
    }

    function toggleVoiceMode() {
        voiceButton.classList.toggle('recording');
        vscode.postMessage({
            command: 'toggleVoice'
        });
    }

    function refreshChat() {
        if (confirm('Are you sure you want to refresh the chat?')) {
            clearChat();
            showNotification('Chat refreshed', 'success');
            vscode.postMessage({ command: 'refresh' });
        }
    }

    function openSettings() {
        // Request the extension host to open VS Code settings for this extension
        vscode.postMessage({ command: 'openSettings' });
    }

    function openHelp() {
        // For now, just show a notification
        showNotification('Help documentation coming soon!', 'info');
    }

    function clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            chatHistory = [];
            saveChatHistory();
            renderChatHistory();
            showNotification('Chat history cleared', 'success');
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function updateStatusIndicators() {
        // Update Ollama status
        vscode.postMessage({ command: 'getStatus' });
        
        // Update current mode
        currentMode.textContent = 'Chat Mode';
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function saveChatHistory() {
        // Keep only last 100 messages to prevent localStorage bloat
        if (chatHistory.length > 100) {
            chatHistory = chatHistory.slice(-100);
        }
        localStorage.setItem('vibecaas_chat_history', JSON.stringify(chatHistory));
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('vibecaas_settings');
        if (savedSettings) {
            try {
                currentSettings = JSON.parse(savedSettings);
            } catch (e) {
                console.error('Failed to load settings:', e);
                currentSettings = {};
            }
        }
    }

    function loadProfile() {
        const savedProfile = localStorage.getItem('vibecaas_profile');
        if (savedProfile) {
            try {
                userProfile = JSON.parse(savedProfile);
            } catch (e) {
                console.error('Failed to load profile:', e);
                userProfile = {};
            }
        }
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'addMessage':
                hideTypingIndicator();
                addMessage(message.sender, message.content, message.timestamp);
                break;
                
            case 'updateStatus':
                updateStatusFromExtension({ ollama: message.ollama, model: message.model, voice: message.voice });
                break;
                
            case 'clearChat':
                clearChat();
                break;
                
            case 'showError':
                showNotification(message.error, 'error');
                break;
                
            case 'showSuccess':
                showNotification(message.message, 'success');
                break;
        }
    });

    function updateStatusFromExtension(status) {
        // Update Ollama status
        if (status.ollama) {
            ollamaStatus.className = `status-indicator ${status.ollama}`;
            document.getElementById('ollamaStatusText').textContent = status.ollama === 'online' ? 'Ollama' : 'Offline';
        }
        
        // Update model status
        if (status.model) {
            modelStatus.className = `status-indicator ${status.model}`;
            document.getElementById('modelStatusText').textContent = status.model === 'online' ? 'Model' : 'No Model';
        }
        
        // Update voice status
        if (status.voice) {
            voiceStatus.className = `status-indicator ${status.voice}`;
            document.getElementById('voiceStatusText').textContent = status.voice === 'online' ? 'Voice' : 'Voice Off';
        }
    }

    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-primary);
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            transform: translateX(400px);
            transition: transform var(--transition-normal);
            z-index: 10000;
            max-width: 300px;
            font-weight: 500;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: var(--accent-success);
        }
        
        .notification.error {
            background: var(--accent-error);
        }
        
        .notification.info {
            background: var(--accent-primary);
        }
    `;
    document.head.appendChild(notificationStyles);

})();

