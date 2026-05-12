class WebCommunicationApp {
    constructor() {
        this.socket = null;
        this.username = '';
        this.roomId = '';
        this.localStream = null;
        this.remoteStreams = new Map();
        this.screenShareStream = null;
        this.peerConnections = {};
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Room functionality
        document.getElementById('joinBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('generateRoomBtn').addEventListener('click', () => this.generateRoomId());

        // Chat functionality
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());

        // New features
        document.getElementById('emojiBtn').addEventListener('click', () => this.toggleEmojiPicker());
        document.getElementById('voiceRecordBtn').addEventListener('mousedown', () => this.startVoiceRecording());
        document.getElementById('voiceRecordBtn').addEventListener('mouseup', () => this.stopVoiceRecording());
        document.getElementById('voiceRecordBtn').addEventListener('mouseleave', () => this.stopVoiceRecording());
        document.getElementById('clearChatBtn').addEventListener('click', () => this.clearChat());
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());

        // File sharing
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Screen sharing
        document.getElementById('shareScreenBtn').addEventListener('click', () => this.startScreenShare());
        document.getElementById('stopScreenShareBtn').addEventListener('click', () => this.stopScreenShare());

        // Invite functionality
        document.getElementById('inviteBtn').addEventListener('click', () => this.showInviteModal());
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyRoomLink());
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyRoomCode());

        // Modals
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeInviteModal').addEventListener('click', () => this.closeInviteModal());
        document.getElementById('fileModal').addEventListener('click', (e) => {
            if (e.target.id === 'fileModal') this.closeModal();
        });
        document.getElementById('inviteModal').addEventListener('click', (e) => {
            if (e.target.id === 'inviteModal') this.closeInviteModal();
        });

        // Typing indicator
        let typingTimer;
        document.getElementById('messageInput').addEventListener('input', () => {
            this.socket.emit('typing');
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                this.socket.emit('stop-typing');
            }, 1000);
        });

        // Initialize emoji picker
        this.initializeEmojiPicker();
        
        // Initialize stats
        this.stats = {
            messages: 0,
            files: 0,
            screenShares: 0
        };
        
        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            this.enableDarkMode();
        }
    }

    generateRoomId() {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        document.getElementById('roomId').value = roomId;
        this.showNotification('Room ID generated: ' + roomId, 'success');
    }

    createRoom() {
        const usernameInput = document.getElementById('username');
        const roomIdInput = document.getElementById('roomId');

        if (!usernameInput.value.trim()) {
            this.showNotification('Please enter your name', 'error');
            return;
        }

        // Generate room ID if not provided
        if (!roomIdInput.value.trim()) {
            this.generateRoomId();
        }

        this.username = usernameInput.value.trim();
        this.roomId = roomIdInput.value.trim();

        // Initialize socket connection with Vercel compatibility
        const socketOptions = {
            transports: ['websocket', 'polling'],
            upgrade: false,
            rememberUpgrade: false,
            timeout: 5000
        };

        // Special handling for Vercel
        if (window.location.hostname.includes('vercel.app')) {
            socketOptions.forceNew = true;
            socketOptions.path = '/socket.io';
        }

        this.socket = io(socketOptions);
        this.setupSocketListeners();

        // Join room
        this.socket.emit('join-room', this.roomId, this.username);

        // Update UI
        document.getElementById('joinSection').classList.add('hidden');
        document.getElementById('chatRoom').classList.remove('hidden');
        document.getElementById('currentRoom').textContent = this.roomId;

        this.addSystemMessage(`Welcome to room ${this.roomId}!`);
        this.addSystemMessage(`You created this room. Share the room ID or link to invite others.`);
    }

    joinRoom() {
        const usernameInput = document.getElementById('username');
        const roomIdInput = document.getElementById('roomId');

        if (!usernameInput.value.trim() || !roomIdInput.value.trim()) {
            this.showNotification('Please enter both username and room ID', 'error');
            return;
        }

        this.username = usernameInput.value.trim();
        this.roomId = roomIdInput.value.trim();

        // Initialize socket connection with Vercel compatibility
        const socketOptions = {
            transports: ['websocket', 'polling'],
            upgrade: false,
            rememberUpgrade: false,
            timeout: 5000
        };

        // Special handling for Vercel
        if (window.location.hostname.includes('vercel.app')) {
            socketOptions.forceNew = true;
            socketOptions.path = '/socket.io';
        }

        this.socket = io(socketOptions);
        this.setupSocketListeners();

        // Join room
        this.socket.emit('join-room', this.roomId, this.username);

        // Update UI
        document.getElementById('joinSection').classList.add('hidden');
        document.getElementById('chatRoom').classList.remove('hidden');
        document.getElementById('currentRoom').textContent = this.roomId;

        this.addSystemMessage(`Welcome to room ${this.roomId}!`);
    }

    setupSocketListeners() {
        this.socket.on('users-in-room', (users) => {
            this.updateUsersList(users);
            document.getElementById('userCountNumber').textContent = users.length;
        });

        this.socket.on('user-connected', (data) => {
            this.addSystemMessage(`${data.username} joined the room`);
            this.showNotification(`${data.username} joined the room`, 'info');
        });

        this.socket.on('user-disconnected', (data) => {
            this.addSystemMessage(`${data.username} left the room`);
            this.showNotification(`${data.username} left the room`, 'info');
            
            // Clean up peer connection
            if (this.peerConnections[data.userId]) {
                this.peerConnections[data.userId].close();
                delete this.peerConnections[data.userId];
            }
        });

        this.socket.on('chat-message', (data) => {
            this.addMessage(data.message, data.username, data.timestamp);
        });

        this.socket.on('file-shared', (data) => {
            this.addFileMessage(data.filename, data.originalName, data.username, data.timestamp);
        });

        this.socket.on('screen-share-started', (data) => {
            this.addSystemMessage(`${data.username} started sharing their screen`);
            this.showNotification(`${data.username} is sharing their screen`, 'info');
        });

        this.socket.on('screen-share-stopped', (data) => {
            this.addSystemMessage('Screen sharing stopped');
            this.showNotification('Screen sharing stopped', 'info');
        });

        // WebRTC signaling
        this.socket.on('offer', async (data) => {
            await this.handleOffer(data.offer, data.userId);
        });

        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data.answer, data.userId);
        });

        this.socket.on('ice-candidate', async (data) => {
            await this.handleIceCandidate(data.candidate, data.userId);
        });

        this.socket.on('typing', () => {
            document.querySelector('.typing-indicator').style.display = 'block';
        });

        this.socket.on('stop-typing', () => {
            document.querySelector('.typing-indicator').style.display = 'none';
        });
    }

    async initializePeerConnection(userId) {
        const pc = new RTCPeerConnection(this.configuration);

        // Add local stream if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    roomId: this.roomId
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            this.remoteStreams.set(userId, event.streams[0]);
            this.updateVideoGrid();
        };

        this.peerConnections[userId] = pc;
        return pc;
    }

    async handleOffer(offer, userId) {
        const pc = await this.initializePeerConnection(userId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit('answer', {
            answer: answer,
            roomId: this.roomId
        });
    }

    async handleAnswer(answer, userId) {
        const pc = this.peerConnections[userId];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async handleIceCandidate(candidate, userId) {
        const pc = this.peerConnections[userId];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (message) {
            const timestamp = new Date().toLocaleTimeString();
            this.addMessage(message, this.username, timestamp, true);
            
            this.socket.emit('chat-message', {
                message: message,
                username: this.username,
                timestamp: timestamp,
                roomId: this.roomId
            });

            messageInput.value = '';
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // For Vercel, we'll handle file upload differently
            if (window.location.hostname.includes('vercel.app')) {
                // Convert file to base64 for Vercel
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64Data = e.target.result;
                    const timestamp = new Date().toLocaleTimeString();
                    
                    // Create a data URL for the file
                    const dataUrl = base64Data;
                    
                    // Add file message with data URL
                    this.addFileMessage(dataUrl, file.name, this.username, timestamp, true);
                    
                    // Notify others about the file
                    this.socket.emit('file-shared', {
                        filename: dataUrl,
                        originalName: file.name,
                        username: this.username,
                        timestamp: timestamp,
                        roomId: this.roomId
                    });

                    this.showNotification('File shared successfully', 'success');
                };
                reader.readAsDataURL(file);
            } else {
                // Original upload method for non-Vercel environments
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    const timestamp = new Date().toLocaleTimeString();
                    this.addFileMessage(result.filename, result.originalName, this.username, timestamp, true);
                    
                    this.socket.emit('file-shared', {
                        filename: result.filename,
                        originalName: result.originalName,
                        username: this.username,
                        timestamp: timestamp,
                        roomId: this.roomId
                    });

                    this.showNotification('File shared successfully', 'success');
                } else {
                    this.showNotification('Failed to upload file', 'error');
                }
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.showNotification('Failed to upload file', 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    async startScreenShare() {
        try {
            this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            const videoElement = document.getElementById('screenShareVideo');
            videoElement.srcObject = this.screenShareStream;

            // Show screen share area
            document.getElementById('screenShareArea').classList.remove('hidden');
            document.getElementById('shareScreenBtn').classList.add('hidden');
            document.getElementById('stopScreenShareBtn').classList.remove('hidden');

            // Notify others
            this.socket.emit('start-screen-share', {
                roomId: this.roomId,
                username: this.username
            });

            // Handle screen share end
            this.screenShareStream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };

        } catch (error) {
            console.error('Screen share error:', error);
            this.showNotification('Failed to start screen sharing', 'error');
        }
    }

    stopScreenShare() {
        if (this.screenShareStream) {
            this.screenShareStream.getTracks().forEach(track => track.stop());
            this.screenShareStream = null;
        }

        // Hide screen share area
        document.getElementById('screenShareArea').classList.add('hidden');
        document.getElementById('shareScreenBtn').classList.remove('hidden');
        document.getElementById('stopScreenShareBtn').classList.add('hidden');

        // Notify others
        this.socket.emit('stop-screen-share', {
            roomId: this.roomId
        });
    }

    addMessage(message, username, timestamp, isOwn = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 message-bubble ${isOwn ? 'text-right' : 'text-left'}`;
        
        messageDiv.innerHTML = `
            <div class="inline-block max-w-xs lg:max-w-md">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2 shadow-md">
                    <div class="flex items-center space-x-2 mb-1">
                        <div class="user-avatar text-xs">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div class="font-semibold text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}">${username}</div>
                    </div>
                    <div class="text-sm">${this.escapeHtml(message)}</div>
                    <div class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} mt-2 flex justify-between items-center">
                        <span>${timestamp}</span>
                        ${isOwn ? '<i class="fas fa-check-double text-xs"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.updateStats('messages');
    }

    addFileMessage(filename, originalName, username, timestamp, isOwn = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        const fileDiv = document.createElement('div');
        fileDiv.className = `mb-3 ${isOwn ? 'text-right' : 'text-left'}`;
        
        // Check if filename is a data URL (Vercel) or just a filename (local)
        const isDataUrl = filename.startsWith('data:');
        const fileExtension = originalName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        
        fileDiv.innerHTML = `
            <div class="inline-block max-w-xs lg:max-w-md">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2">
                    <div class="font-semibold text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}">${username}</div>
                    <div class="mt-2">
                        ${isImage ? 
                            `<img src="${isDataUrl ? filename : '/uploads/' + filename}" alt="${originalName}" class="file-preview cursor-pointer max-w-full h-32 object-cover rounded" onclick="app.showFilePreview('${isDataUrl ? filename : '/uploads/' + filename}', '${originalName}')">` :
                            `<div class="flex items-center space-x-2">
                                <i class="fas fa-file text-2xl ${isOwn ? 'text-blue-200' : 'text-gray-400'}"></i>
                                <div>
                                    <div class="text-sm font-medium">${originalName}</div>
                                    <button onclick="app.downloadFile('${isDataUrl ? filename : '/uploads/' + filename}', '${originalName}')" class="text-xs ${isOwn ? 'text-blue-200' : 'text-blue-600'} hover:underline">
                                        Download
                                    </button>
                                </div>
                            </div>`
                        }
                    </div>
                    <div class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} mt-2">${timestamp}</div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(fileDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.updateStats('files');
    }

    addSystemMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const systemDiv = document.createElement('div');
        systemDiv.className = 'mb-3 text-center';
        systemDiv.innerHTML = `
            <div class="inline-block bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm">
                <i class="fas fa-info-circle mr-1"></i>${message}
            </div>
        `;
        messagesContainer.appendChild(systemDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition';
            userDiv.innerHTML = `
                <div class="user-avatar text-sm">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="online-indicator"></span>
                        <span class="text-sm font-medium">${user.username}</span>
                        ${user.username === this.username ? '<span class="text-xs text-gray-500">(You)</span>' : ''}
                    </div>
                    <div class="text-xs text-gray-500">Online now</div>
                </div>
            `;
            usersList.appendChild(userDiv);
        });
    }

    showFilePreview(filePath, filename) {
        const modal = document.getElementById('fileModal');
        const modalContent = document.getElementById('modalContent');
        
        const fileExtension = filename.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        
        if (isImage) {
            modalContent.innerHTML = `
                <img src="${filePath}" alt="${filename}" class="max-w-full max-h-96 mx-auto rounded">
                <div class="mt-4 text-center">
                    <button onclick="app.downloadFile('${filePath}', '${filename}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i>Download
                    </button>
                </div>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-file text-6xl text-gray-400 mb-4"></i>
                    <p class="text-lg font-semibold mb-4">${filename}</p>
                    <button onclick="app.downloadFile('${filePath}', '${filename}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i>Download
                    </button>
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }

    downloadFile(filePath, filename) {
        // Handle data URLs (Vercel) vs regular file paths (local)
        if (filePath.startsWith('data:')) {
            // For data URLs, create a blob and download
            fetch(filePath)
                .then(res => res.blob())
                .then(blob => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                })
                .catch(err => {
                    console.error('Download error:', err);
                    this.showNotification('Failed to download file', 'error');
                });
        } else {
            // For regular file paths (local development)
            const link = document.createElement('a');
            link.href = filePath;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    closeModal() {
        document.getElementById('fileModal').classList.add('hidden');
    }

    closeInviteModal() {
        document.getElementById('inviteModal').classList.add('hidden');
    }

    showInviteModal() {
        const modal = document.getElementById('inviteModal');
        const roomLink = document.getElementById('roomLink');
        const roomCode = document.getElementById('roomCode');
        
        // Generate room link
        const currentUrl = window.location.origin + window.location.pathname;
        roomLink.value = `${currentUrl}?room=${this.roomId}`;
        roomCode.value = this.roomId;
        
        modal.classList.remove('hidden');
    }

    copyRoomLink() {
        const roomLink = document.getElementById('roomLink');
        roomLink.select();
        document.execCommand('copy');
        this.showNotification('Room link copied to clipboard!', 'success');
    }

    copyRoomCode() {
        const roomCode = document.getElementById('roomCode');
        roomCode.select();
        document.execCommand('copy');
        this.showNotification('Room code copied to clipboard!', 'success');
    }

    // New feature methods
    initializeEmojiPicker() {
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏'];
        
        const picker = document.getElementById('emojiPicker');
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.onclick = () => this.insertEmoji(emoji);
            picker.appendChild(btn);
        });
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        picker.style.display = picker.style.display === 'grid' ? 'none' : 'grid';
    }

    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
        this.toggleEmojiPicker();
    }

    startVoiceRecording() {
        if (!this.mediaRecorder) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.mediaRecorder = new MediaRecorder(stream);
                    this.audioChunks = [];
                    
                    this.mediaRecorder.ondataavailable = event => {
                        this.audioChunks.push(event.data);
                    };
                    
                    this.mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                        this.sendVoiceMessage(audioBlob);
                        this.audioChunks = [];
                    };
                    
                    this.mediaRecorder.start();
                    document.getElementById('voiceRecordBtn').classList.add('voice-recording');
                    document.getElementById('voiceWave').style.display = 'block';
                })
                .catch(err => {
                    console.error('Error accessing microphone:', err);
                    this.showNotification('Microphone access denied', 'error');
                });
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.mediaRecorder = null;
            document.getElementById('voiceRecordBtn').classList.remove('voice-recording');
            document.getElementById('voiceWave').style.display = 'none';
        }
    }

    sendVoiceMessage(audioBlob) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Audio = reader.result;
            const timestamp = new Date().toLocaleTimeString();
            
            this.addVoiceMessage(base64Audio, this.username, timestamp, true);
            
            this.socket.emit('voice-message', {
                audio: base64Audio,
                username: this.username,
                timestamp: timestamp,
                roomId: this.roomId
            });
        };
        reader.readAsDataURL(audioBlob);
    }

    addVoiceMessage(audio, username, timestamp, isOwn = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 ${isOwn ? 'text-right' : 'text-left'}`;
        
        messageDiv.innerHTML = `
            <div class="inline-block max-w-xs lg:max-w-md">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2">
                    <div class="font-semibold text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}">${username}</div>
                    <div class="flex items-center space-x-2 mt-2">
                        <audio controls class="w-32 h-8">
                            <source src="${audio}" type="audio/wav">
                        </audio>
                        <i class="fas fa-microphone ${isOwn ? 'text-blue-200' : 'text-gray-500'}"></i>
                    </div>
                    <div class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} mt-2">${timestamp}</div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.updateStats('messages');
    }

    clearChat() {
        if (confirm('Are you sure you want to clear all messages?')) {
            document.getElementById('messagesContainer').innerHTML = '';
            this.addSystemMessage('Chat cleared');
            this.showNotification('Chat cleared', 'success');
        }
    }

    toggleDarkMode() {
        const body = document.body;
        const darkModeToggle = document.getElementById('darkModeToggle');
        const icon = darkModeToggle.querySelector('i');
        
        if (body.classList.contains('dark')) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    enableDarkMode() {
        document.body.classList.add('dark');
        const icon = document.querySelector('#darkModeToggle i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'true');
    }

    disableDarkMode() {
        document.body.classList.remove('dark');
        const icon = document.querySelector('#darkModeToggle i');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'false');
    }

    updateStats(type) {
        this.stats[type === 'messages' ? 'messages' : type === 'files' ? 'files' : 'screenShares']++;
        document.getElementById('messageCount').textContent = this.stats.messages;
        document.getElementById('fileCount').textContent = this.stats.files;
        document.getElementById('screenShareCount').textContent = this.stats.screenShares;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 glass-morphism ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                } mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-join room if URL parameter is provided
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl) {
        document.getElementById('roomId').value = roomFromUrl;
        // Focus on username field for better UX
        document.getElementById('username').focus();
    }
});

// Initialize the app with Vercel compatibility
const app = new WebCommunicationApp();

// Vercel-specific socket.io configuration
if (window.location.hostname.includes('vercel.app')) {
    // Override socket connection for Vercel
    app.socket = io({
        transports: ['websocket', 'polling'],
        upgrade: false,
        rememberUpgrade: false,
        timeout: 5000,
        forceNew: true
    });
}
