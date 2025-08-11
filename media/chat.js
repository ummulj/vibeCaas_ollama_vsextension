// VibeCaas Chat JavaScript
(function() {
    'use strict';

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
    
    // Modal elements
    const settingsModal = document.getElementById('settingsModal');
    const profileModal = document.getElementById('profileModal');
    const helpModal = document.getElementById('helpModal');
    
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
        
        // Modal triggers
        document.getElementById('settingsBtn').addEventListener('click', () => openModal(settingsModal));
        document.getElementById('profileBtn').addEventListener('click', () => openModal(profileModal));
        document.getElementById('helpBtn').addEventListener('click', () => openModal(helpModal));
        
        // Modal close buttons
        document.getElementById('settingsClose').addEventListener('click', () => closeModal(settingsModal));
        document.getElementById('profileClose').addEventListener('click', () => closeModal(profileModal));
        document.getElementById('helpClose').addEventListener('click', () => closeModal(helpModal));
        document.getElementById('helpCloseBtn').addEventListener('click', () => closeModal(helpModal));
        
        // Settings actions
        document.getElementById('settingsSave').addEventListener('click', saveSettings);
        document.getElementById('settingsReset').addEventListener('click', resetSettings);
        
        // Profile actions
        document.getElementById('profileSave').addEventListener('click', saveProfile);
        document.getElementById('profileExport').addEventListener('click', exportProfile);
        
        // Action chips
        document.addEventListener('click', handleActionChipClick);
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal(e.target);
            }
        });

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
                        openModal(settingsModal);
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

        const text = document.createElement('div');
        text.className = 'message-text';
        
        const time = document.createElement('div');
        time.className = 'message-time';

        // Set avatar text
        switch(message.sender) {
            case 'user':
                avatar.textContent = 'U';
                break;
            case 'assistant':
                avatar.textContent = 'AI';
                break;
            case 'agent':
                avatar.textContent = '🤖';
                break;
            default:
                avatar.textContent = '?';
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
            text.textContent = message.content;
        }

        // Set timestamp
        time.textContent = formatTimestamp(message.timestamp);

        // Add action chips for assistant messages
        if (message.sender === 'assistant' && message.showActions !== false) {
            const actionChips = document.createElement('div');
            actionChips.className = 'action-chips';
            actionChips.innerHTML = `
                <div class="action-chip" data-action="plan">📋 Generate Plan</div>
                <div class="action-chip" data-action="debug">🐛 Debug Code</div>
                <div class="action-chip" data-action="explain">💡 Explain Code</div>
                <div class="action-chip" data-action="scaffold">🏗️ Scaffold App</div>
            `;
            content.appendChild(actionChips);
        }

        // Assemble message
        content.appendChild(text);
        content.appendChild(time);
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        messagesContainer.appendChild(messageElement);
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
            <div class="message-avatar">AI</div>
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

    function handleActionChipClick(e) {
        if (e.target.classList.contains('action-chip')) {
            const action = e.target.dataset.action;
            const actionText = e.target.textContent;
            
            // Prefill input with action
            messageInput.value = `${actionText}: `;
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

    function openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Load current values
        if (modal === settingsModal) {
            loadSettingsIntoForm();
        } else if (modal === profileModal) {
            loadProfileIntoForm();
        }
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function loadSettingsIntoForm() {
        document.getElementById('ollamaUrl').value = currentSettings.ollamaUrl || 'http://localhost:11434';
        document.getElementById('defaultModel').value = currentSettings.defaultModel || 'mistral:latest';
        document.getElementById('maxContextBytes').value = currentSettings.maxContextBytes || 8192;
        document.getElementById('enableVoice').checked = currentSettings.enableVoice || false;
        document.getElementById('voskModelPath').value = currentSettings.voskModelPath || '';
        document.getElementById('enableDebug').checked = currentSettings.enableDebug || false;
        document.getElementById('mode').value = currentSettings.mode || 'chat';
        document.getElementById('maxFiles').value = currentSettings.scaffold?.maxFiles || 10;
        document.getElementById('maxTotalBytes').value = currentSettings.scaffold?.maxTotalBytes || 1048576;
        document.getElementById('allowOverwrite').checked = currentSettings.scaffold?.allowOverwrite || false;
    }

    function loadProfileIntoForm() {
        document.getElementById('developerName').value = userProfile.name || '';
        document.getElementById('preferredLanguage').value = userProfile.preferredLanguage || 'typescript';
        document.getElementById('framework').value = userProfile.framework || 'react';
        document.getElementById('theme').value = userProfile.theme || 'dark';
        document.getElementById('fontSize').value = userProfile.fontSize || 'medium';
        
        // Update stats
        document.getElementById('totalMessages').textContent = userProfile.stats?.totalMessages || 0;
        document.getElementById('totalTokens').textContent = userProfile.stats?.totalTokens || 0;
        document.getElementById('projectsCreated').textContent = userProfile.stats?.projectsCreated || 0;
    }

    function saveSettings() {
        currentSettings = {
            ollamaUrl: document.getElementById('ollamaUrl').value,
            defaultModel: document.getElementById('defaultModel').value,
            maxContextBytes: parseInt(document.getElementById('maxContextBytes').value),
            enableVoice: document.getElementById('enableVoice').checked,
            voskModelPath: document.getElementById('voskModelPath').value,
            enableDebug: document.getElementById('enableDebug').checked,
            mode: document.getElementById('mode').value,
            scaffold: {
                maxFiles: parseInt(document.getElementById('maxFiles').value),
                maxTotalBytes: parseInt(document.getElementById('maxTotalBytes').value),
                allowOverwrite: document.getElementById('allowOverwrite').checked
            }
        };

        localStorage.setItem('vibecaas_settings', JSON.stringify(currentSettings));
        
        // Send to extension
        vscode.postMessage({
            command: 'updateSettings',
            settings: currentSettings
        });

        closeModal(settingsModal);
        showNotification('Settings saved successfully!');
    }

    function saveProfile() {
        userProfile = {
            name: document.getElementById('developerName').value,
            preferredLanguage: document.getElementById('preferredLanguage').value,
            framework: document.getElementById('framework').value,
            theme: document.getElementById('theme').value,
            fontSize: document.getElementById('fontSize').value,
            stats: userProfile.stats || {
                totalMessages: 0,
                totalTokens: 0,
                projectsCreated: 0
            }
        };

        localStorage.setItem('vibecaas_profile', JSON.stringify(userProfile));
        closeModal(profileModal);
        showNotification('Profile saved successfully!');
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            currentSettings = {};
            localStorage.removeItem('vibecaas_settings');
            loadSettingsIntoForm();
            showNotification('Settings reset to defaults');
        }
    }

    function exportProfile() {
        const dataStr = JSON.stringify(userProfile, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'vibecaas-profile.json';
        link.click();
    }

    function clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            chatHistory = [];
            saveChatHistory();
            renderChatHistory();
            showNotification('Chat history cleared');
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
        currentMode.textContent = `Mode: ${currentSettings.mode || 'Chat'}`;
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
                updateStatusFromExtension(message.status);
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
            ollamaStatus.className = `status-dot ${status.ollama}`;
            document.getElementById('ollamaStatusText').textContent = `Ollama: ${status.ollama}`;
        }
        
        // Update model status
        if (status.model) {
            modelStatus.className = `status-dot ${status.model}`;
            document.getElementById('modelStatusText').textContent = `Model: ${status.model}`;
        }
        
        // Update voice status
        if (status.voice) {
            voiceStatus.className = `status-dot ${status.voice}`;
            document.getElementById('voiceStatusText').textContent = `Voice: ${status.voice}`;
        }
    }

    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 10000;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: var(--green);
        }
        
        .notification.error {
            background: var(--red);
        }
        
        .notification.info {
            background: var(--blue);
        }
    `;
    document.head.appendChild(notificationStyles);

})();

