const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Configure multer for file uploads (memory storage for Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store connected users
const users = {};

// Socket.io connection handling
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

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      userId: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      userId: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      userId: socket.id
    });
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

  // Handle screen sharing start/stop
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

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // For Vercel, we'll return the file as base64 data
  // In production, you'd use a cloud storage service
  const base64File = req.file.buffer.toString('base64');
  const dataUrl = `data:${req.file.mimetype};base64,${base64File}`;
  
  res.json({
    filename: req.file.originalname,
    originalName: req.file.originalname,
    size: req.file.size,
    dataUrl: dataUrl,
    mimetype: req.file.mimetype
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = (req, res) => {
  app(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}
