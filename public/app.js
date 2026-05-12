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
        // Join room functionality
        document.getElementById('joinBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());

        // File sharing
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Screen sharing
        document.getElementById('shareScreenBtn').addEventListener('click', () => this.startScreenShare());
        document.getElementById('stopScreenShareBtn').addEventListener('click', () => this.stopScreenShare());

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('fileModal').addEventListener('click', (e) => {
            if (e.target.id === 'fileModal') this.closeModal();
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

        // Initialize socket connection
        this.socket = io();
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

        const formData = new FormData();
        formData.append('file', file);

        try {
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
        messageDiv.className = `mb-3 ${isOwn ? 'text-right' : 'text-left'}`;
        
        messageDiv.innerHTML = `
            <div class="inline-block max-w-xs lg:max-w-md">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2">
                    <div class="font-semibold text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}">${username}</div>
                    <div class="text-sm">${this.escapeHtml(message)}</div>
                    <div class="text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} mt-1">${timestamp}</div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addFileMessage(filename, originalName, username, timestamp, isOwn = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        const fileDiv = document.createElement('div');
        fileDiv.className = `mb-3 ${isOwn ? 'text-right' : 'text-left'}`;
        
        const fileExtension = originalName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        
        fileDiv.innerHTML = `
            <div class="inline-block max-w-xs lg:max-w-md">
                <div class="${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2">
                    <div class="font-semibold text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}">${username}</div>
                    <div class="mt-2">
                        ${isImage ? 
                            `<img src="/uploads/${filename}" alt="${originalName}" class="file-preview cursor-pointer" onclick="app.showFilePreview('/uploads/${filename}', '${originalName}')">` :
                            `<div class="flex items-center space-x-2">
                                <i class="fas fa-file text-2xl ${isOwn ? 'text-blue-200' : 'text-gray-400'}"></i>
                                <div>
                                    <div class="text-sm font-medium">${originalName}</div>
                                    <button onclick="app.downloadFile('/uploads/${filename}', '${originalName}')" class="text-xs ${isOwn ? 'text-blue-200' : 'text-blue-600'} hover:underline">
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
            userDiv.className = 'flex items-center space-x-2 p-2 rounded hover:bg-gray-50';
            userDiv.innerHTML = `
                <span class="online-indicator"></span>
                <span class="text-sm font-medium">${user.username}</span>
                ${user.username === this.username ? '<span class="text-xs text-gray-500">(You)</span>' : ''}
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
        const link = document.createElement('a');
        link.href = filePath;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    closeModal() {
        document.getElementById('fileModal').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
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
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new WebCommunicationApp();
