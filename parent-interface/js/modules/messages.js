/**
 * Claudyne Parent Interface - Messages Module
 * Communication familiale en temps réel avec WebSocket
 */

export class MessagesModule {
    constructor(options = {}) {
        this.options = {
            websocketUrl: 'wss://api.claudyne.com/parent/messages',
            autoReconnect: true,
            messageLimit: 100,
            typingTimeout: 3000,
            ...options
        };

        this.websocket = null;
        this.isConnected = false;
        this.conversations = new Map();
        this.activeConversation = null;
        this.typingIndicators = new Map();
        this.unreadCounts = new Map();
    }

    async initialize() {
        console.log('[Messages] Initializing messages module...');

        await this.setupWebSocket();
        await this.loadConversations();
        this.setupEventListeners();
        this.startHeartbeat();

        console.log('[Messages] Messages module ready');
    }

    async setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.options.websocketUrl);

            this.websocket.onopen = () => {
                console.log('[Messages] WebSocket connected');
                this.isConnected = true;
                this.authenticate();
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleIncomingMessage(data);
            };

            this.websocket.onclose = () => {
                console.log('[Messages] WebSocket disconnected');
                this.isConnected = false;
                if (this.options.autoReconnect) {
                    setTimeout(() => this.setupWebSocket(), 5000);
                }
            };

            this.websocket.onerror = (error) => {
                console.error('[Messages] WebSocket error:', error);
            };

        } catch (error) {
            console.error('[Messages] Failed to setup WebSocket:', error);
        }
    }

    authenticate() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const authMessage = {
                type: 'auth',
                token: localStorage.getItem('parentToken'),
                userId: this.getUserId()
            };
            this.websocket.send(JSON.stringify(authMessage));
        }
    }

    handleIncomingMessage(data) {
        switch (data.type) {
            case 'message':
                this.receiveMessage(data.payload);
                break;
            case 'typing':
                this.handleTypingIndicator(data.payload);
                break;
            case 'read_receipt':
                this.handleReadReceipt(data.payload);
                break;
            case 'user_online':
                this.updateUserStatus(data.payload.userId, 'online');
                break;
            case 'user_offline':
                this.updateUserStatus(data.payload.userId, 'offline');
                break;
            case 'conversation_created':
                this.addConversation(data.payload);
                break;
        }
    }

    async render() {
        return `
            <div class="messages-container">
                <div class="messages-header">
                    <h2 class="messages-title">Messages Familiale</h2>
                    <p class="messages-description">Communication en temps réel avec vos enfants</p>
                </div>

                <div class="messages-layout">
                    <div class="conversations-sidebar">
                        ${this.renderConversationsList()}
                    </div>
                    <div class="chat-main">
                        ${this.renderChatArea()}
                    </div>
                </div>
            </div>
        `;
    }

    renderConversationsList() {
        const conversations = Array.from(this.conversations.values());

        return `
            <div class="conversations-card">
                <div class="conversations-header">
                    <i class="fas fa-users"></i>
                    <h3>Conversations</h3>
                    <button class="btn btn-small btn-primary" onclick="messagesModule.createConversation()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="conversations-list">
                    ${conversations.map(conv => this.renderConversationItem(conv)).join('')}
                </div>
            </div>
        `;
    }

    renderConversationItem(conversation) {
        const isActive = conversation.id === this.activeConversation?.id;
        const unreadCount = this.unreadCounts.get(conversation.id) || 0;
        const lastMessage = conversation.lastMessage;

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}"
                 onclick="messagesModule.selectConversation('${conversation.id}')">
                <div class="conversation-avatar">
                    <div class="avatar-group">
                        ${conversation.participants.slice(0, 2).map(p => `
                            <div class="avatar ${p.status === 'online' ? 'online' : ''}"
                                 style="background-image: url('${p.avatar || '/images/default-avatar.png'}')">
                                ${!p.avatar ? p.name.charAt(0) : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${conversation.name}</span>
                        <span class="conversation-time">${this.formatTime(lastMessage?.timestamp)}</span>
                    </div>
                    <div class="conversation-preview">
                        <span class="last-message">${lastMessage?.text || 'Aucun message'}</span>
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderChatArea() {
        if (!this.activeConversation) {
            return `
                <div class="chat-empty">
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>Sélectionnez une conversation</h3>
                        <p>Choisissez une conversation pour commencer à discuter</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="chat-area">
                <div class="chat-header">
                    <div class="chat-info">
                        <h3>${this.activeConversation.name}</h3>
                        <span class="chat-status">${this.getConversationStatus()}</span>
                    </div>
                    <div class="chat-actions">
                        <button class="btn btn-small btn-secondary" onclick="messagesModule.startVideoCall()">
                            <i class="fas fa-video"></i> Appel vidéo
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="messagesModule.startVoiceCall()">
                            <i class="fas fa-phone"></i> Appel
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="messagesModule.toggleChatInfo()">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>

                <div class="messages-container" id="messages-container">
                    ${this.renderMessages()}
                </div>

                <div class="typing-indicators" id="typing-indicators">
                    ${this.renderTypingIndicators()}
                </div>

                <div class="message-input-area">
                    ${this.renderMessageInput()}
                </div>
            </div>
        `;
    }

    renderMessages() {
        if (!this.activeConversation?.messages) return '';

        return this.activeConversation.messages.map(message => `
            <div class="message ${message.sender === this.getUserId() ? 'sent' : 'received'}"
                 data-message-id="${message.id}">
                <div class="message-avatar">
                    <img src="${this.getUserAvatar(message.sender)}" alt="${this.getUserName(message.sender)}">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${this.getUserName(message.sender)}</span>
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    </div>
                    <div class="message-body">
                        ${this.renderMessageContent(message)}
                    </div>
                    <div class="message-status">
                        ${this.renderMessageStatus(message)}
                    </div>
                </div>
                <div class="message-actions">
                    <button class="message-action" onclick="messagesModule.reactToMessage('${message.id}', '👍')">
                        <i class="far fa-thumbs-up"></i>
                    </button>
                    <button class="message-action" onclick="messagesModule.replyToMessage('${message.id}')">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderMessageContent(message) {
        switch (message.type) {
            case 'text':
                return `<div class="message-text">${this.formatMessageText(message.text)}</div>`;
            case 'image':
                return `
                    <div class="message-image">
                        <img src="${message.url}" alt="Image" onclick="messagesModule.openImage('${message.url}')">
                    </div>
                `;
            case 'file':
                return `
                    <div class="message-file">
                        <i class="fas fa-file"></i>
                        <span>${message.filename}</span>
                        <button onclick="messagesModule.downloadFile('${message.url}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                `;
            case 'voice':
                return `
                    <div class="message-voice">
                        <button class="play-voice" onclick="messagesModule.playVoice('${message.url}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="voice-duration">${message.duration}</div>
                    </div>
                `;
            default:
                return `<div class="message-text">${message.text || 'Message non supporté'}</div>`;
        }
    }

    renderMessageStatus(message) {
        if (message.sender !== this.getUserId()) return '';

        const status = message.status || 'sent';
        const icons = {
            sending: 'fas fa-clock',
            sent: 'fas fa-check',
            delivered: 'fas fa-check-double',
            read: 'fas fa-check-double text-blue'
        };

        return `<i class="${icons[status] || icons.sent}"></i>`;
    }

    renderTypingIndicators() {
        const indicators = Array.from(this.typingIndicators.entries())
            .filter(([userId, data]) => data.conversationId === this.activeConversation?.id)
            .map(([userId, data]) => `
                <div class="typing-indicator">
                    <span>${this.getUserName(userId)} est en train d'écrire</span>
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `);

        return indicators.join('');
    }

    renderMessageInput() {
        return `
            <div class="message-input-container">
                <div class="input-attachments">
                    <button class="attachment-btn" onclick="messagesModule.attachFile()" title="Joindre un fichier">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <button class="attachment-btn" onclick="messagesModule.attachImage()" title="Joindre une image">
                        <i class="fas fa-image"></i>
                    </button>
                    <button class="attachment-btn" onclick="messagesModule.recordVoice()" title="Message vocal">
                        <i class="fas fa-microphone"></i>
                    </button>
                </div>

                <div class="input-field-container">
                    <textarea id="message-input"
                              placeholder="Tapez votre message..."
                              onkeypress="messagesModule.handleInputKeyPress(event)"
                              oninput="messagesModule.handleTyping()"
                              rows="1"></textarea>
                    <button class="emoji-btn" onclick="messagesModule.toggleEmojiPicker()">
                        <i class="far fa-smile"></i>
                    </button>
                </div>

                <button class="send-btn" onclick="messagesModule.sendMessage()" id="send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>

            <input type="file" id="file-input" multiple style="display: none"
                   onchange="messagesModule.handleFileSelect(event)">
            <input type="file" id="image-input" accept="image/*" multiple style="display: none"
                   onchange="messagesModule.handleImageSelect(event)">
        `;
    }

    // Message handling
    async sendMessage(text = null, type = 'text', attachments = null) {
        if (!this.activeConversation) return;

        const messageText = text || document.getElementById('message-input')?.value?.trim();
        if (!messageText && !attachments) return;

        const message = {
            id: this.generateMessageId(),
            conversationId: this.activeConversation.id,
            sender: this.getUserId(),
            type: type,
            text: messageText,
            timestamp: new Date().toISOString(),
            status: 'sending',
            attachments: attachments
        };

        // Add to local conversation
        this.addMessageToConversation(message);

        // Clear input
        const input = document.getElementById('message-input');
        if (input) input.value = '';

        // Send via WebSocket
        if (this.isConnected) {
            this.websocket.send(JSON.stringify({
                type: 'send_message',
                payload: message
            }));
        } else {
            // Queue for later if offline
            this.queueMessage(message);
        }

        // Update UI
        this.refreshMessages();
        this.scrollToBottom();
    }

    receiveMessage(message) {
        this.addMessageToConversation(message);

        // Mark as read if conversation is active
        if (message.conversationId === this.activeConversation?.id) {
            this.markAsRead(message.id);
        } else {
            // Increment unread count
            const current = this.unreadCounts.get(message.conversationId) || 0;
            this.unreadCounts.set(message.conversationId, current + 1);
        }

        // Show notification if not active
        if (document.hidden) {
            this.showNotification(message);
        }

        this.refreshConversations();
        if (message.conversationId === this.activeConversation?.id) {
            this.refreshMessages();
            this.scrollToBottom();
        }
    }

    addMessageToConversation(message) {
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            if (!conversation.messages) conversation.messages = [];
            conversation.messages.push(message);
            conversation.lastMessage = message;

            // Keep only recent messages
            if (conversation.messages.length > this.options.messageLimit) {
                conversation.messages = conversation.messages.slice(-this.options.messageLimit);
            }
        }
    }

    // Conversation management
    async selectConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        this.activeConversation = conversation;

        // Mark messages as read
        this.markConversationAsRead(conversationId);

        // Load messages if not loaded
        if (!conversation.messages || conversation.messages.length === 0) {
            await this.loadConversationMessages(conversationId);
        }

        this.refreshChatArea();
    }

    async createConversation() {
        // Show create conversation modal
        const modal = this.createConversationModal();
        document.body.appendChild(modal);
    }

    createConversationModal() {
        const modal = document.createElement('div');
        modal.className = 'conversation-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nouvelle conversation</h3>
                        <button class="modal-close" onclick="this.closest('.conversation-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nom de la conversation</label>
                            <input type="text" id="conversation-name" class="form-input"
                                   placeholder="ex: Devoirs Richy">
                        </div>
                        <div class="form-group">
                            <label>Participants</label>
                            <div class="participants-list">
                                <div class="participant-item">
                                    <input type="checkbox" id="participant-richy" value="richy">
                                    <label for="participant-richy">Richy</label>
                                </div>
                                <div class="participant-item">
                                    <input type="checkbox" id="participant-blandine" value="blandine">
                                    <label for="participant-blandine">Blandine</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.conversation-modal').remove()">
                            Annuler
                        </button>
                        <button class="btn btn-primary" onclick="messagesModule.submitCreateConversation()">
                            Créer
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    async submitCreateConversation() {
        const name = document.getElementById('conversation-name')?.value;
        const participants = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (!name || participants.length === 0) return;

        const conversation = {
            id: this.generateConversationId(),
            name: name,
            participants: [this.getUserId(), ...participants],
            created: new Date().toISOString(),
            messages: []
        };

        // Send to server
        if (this.isConnected) {
            this.websocket.send(JSON.stringify({
                type: 'create_conversation',
                payload: conversation
            }));
        }

        // Add locally
        this.conversations.set(conversation.id, conversation);
        this.refreshConversations();

        // Close modal
        document.querySelector('.conversation-modal')?.remove();
    }

    // Input handling
    handleInputKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    handleTyping() {
        if (!this.activeConversation || !this.isConnected) return;

        // Send typing indicator
        this.websocket.send(JSON.stringify({
            type: 'typing',
            payload: {
                conversationId: this.activeConversation.id,
                userId: this.getUserId()
            }
        }));

        // Auto-resize textarea
        const textarea = document.getElementById('message-input');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    handleTypingIndicator(data) {
        if (data.userId === this.getUserId()) return;

        this.typingIndicators.set(data.userId, {
            conversationId: data.conversationId,
            timestamp: Date.now()
        });

        // Auto-remove after timeout
        setTimeout(() => {
            this.typingIndicators.delete(data.userId);
            this.refreshTypingIndicators();
        }, this.options.typingTimeout);

        this.refreshTypingIndicators();
    }

    // File handling
    attachFile() {
        document.getElementById('file-input')?.click();
    }

    attachImage() {
        document.getElementById('image-input')?.click();
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.uploadFile(file));
    }

    handleImageSelect(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.uploadImage(file));
    }

    async uploadFile(file) {
        // Implementation depends on backend
        console.log('[Messages] Uploading file:', file.name);
    }

    async uploadImage(file) {
        // Implementation depends on backend
        console.log('[Messages] Uploading image:', file.name);
    }

    // Voice recording
    async recordVoice() {
        console.log('[Messages] Starting voice recording...');
        // Implementation for voice recording
    }

    // Data loading
    async loadConversations() {
        try {
            const response = await fetch('/api/parent/conversations', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const conversations = await response.json();
                conversations.forEach(conv => this.conversations.set(conv.id, conv));
            } else {
                this.loadMockConversations();
            }

        } catch (error) {
            console.error('[Messages] Failed to load conversations:', error);
            this.loadMockConversations();
        }
    }

    loadMockConversations() {
        const mockConversations = [
            {
                id: 'conv1',
                name: 'Famille Samuel',
                participants: [
                    { id: 'parent', name: 'Papa', avatar: null, status: 'online' },
                    { id: 'richy', name: 'Richy', avatar: null, status: 'online' },
                    { id: 'blandine', name: 'Blandine', avatar: null, status: 'offline' }
                ],
                lastMessage: {
                    text: 'Papa, j\'ai fini mes devoirs!',
                    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                    sender: 'richy'
                },
                messages: []
            }
        ];

        mockConversations.forEach(conv => this.conversations.set(conv.id, conv));
        this.unreadCounts.set('conv1', 2);
    }

    // Utility methods
    getUserId() {
        return localStorage.getItem('parentUserId') || 'parent';
    }

    getUserName(userId) {
        const users = {
            parent: 'Papa',
            richy: 'Richy',
            blandine: 'Blandine'
        };
        return users[userId] || userId;
    }

    getUserAvatar(userId) {
        return `/images/avatars/${userId}.jpg`;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('parentToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    }

    formatMessageText(text) {
        // Simple text formatting (URLs, mentions, etc.)
        return text
            .replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank">$&</a>')
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // UI refresh methods
    refreshConversations() {
        if (window.app && window.app.currentModule === 'messages') {
            const sidebar = document.querySelector('.conversations-sidebar');
            if (sidebar) {
                sidebar.innerHTML = this.renderConversationsList();
            }
        }
    }

    refreshChatArea() {
        if (window.app && window.app.currentModule === 'messages') {
            const chatMain = document.querySelector('.chat-main');
            if (chatMain) {
                chatMain.innerHTML = this.renderChatArea();
            }
        }
    }

    refreshMessages() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.innerHTML = this.renderMessages();
        }
    }

    refreshTypingIndicators() {
        const container = document.getElementById('typing-indicators');
        if (container) {
            container.innerHTML = this.renderTypingIndicators();
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Public API
    async refresh() {
        await this.loadConversations();
        this.refreshConversations();
        if (this.activeConversation) {
            this.refreshChatArea();
        }
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.messagesModule = null; // Sera initialisé par main.js
}

export default Messages;