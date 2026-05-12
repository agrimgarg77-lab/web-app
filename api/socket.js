// Socket.io serverless function for Vercel
import { Server } from 'socket.io';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket', 'polling']
    });

    res.socket.server.io = io;

    // Store connected users
    const users = {};

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user joining
      socket.on('join-room', (roomId, username) => {
        socket.join(roomId);
        users[socket.id] = { username, roomId };
        
        socket.to(roomId).emit('user-connected', {
          userId: socket.id,
          username: username
        });

        // Send current users to the new user
        const roomUsers = Object.values(users).filter(user => user.roomId === roomId);
        socket.emit('users-in-room', roomUsers);
      });

      // Handle chat messages
      socket.on('chat-message', (data) => {
        socket.to(data.roomId).emit('chat-message', {
          message: data.message,
          username: data.username,
          timestamp: data.timestamp
        });
      });

      // Handle voice messages
      socket.on('voice-message', (data) => {
        socket.to(data.roomId).emit('voice-message', {
          audio: data.audio,
          username: data.username,
          timestamp: data.timestamp
        });
      });

      // Handle file sharing
      socket.on('file-shared', (data) => {
        socket.to(data.roomId).emit('file-shared', {
          filename: data.filename,
          originalName: data.originalName,
          username: data.username,
          timestamp: data.timestamp
        });
      });

      // Handle screen sharing
      socket.on('start-screen-share', (data) => {
        socket.to(data.roomId).emit('screen-share-started', {
          userId: socket.id,
          username: data.username
        });
      });

      socket.on('stop-screen-share', (data) => {
        socket.to(data.roomId).emit('screen-share-stopped', {
          userId: socket.id
        });
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.to(data.roomId).emit('typing');
      });

      socket.on('stop-typing', (data) => {
        socket.to(data.roomId).emit('stop-typing');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const user = users[socket.id];
        if (user) {
          socket.to(user.roomId).emit('user-disconnected', {
            userId: socket.id,
            username: user.username
          });
          delete users[socket.id];
        }
      });
    });
  }

  res.end();
}
