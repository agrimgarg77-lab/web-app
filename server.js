const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'public/uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
