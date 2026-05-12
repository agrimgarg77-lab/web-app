# Web Communication App

A real-time web application for communication with chat, file sharing, and screen sharing capabilities built with Node.js, Express, Socket.io, and WebRTC.

## Features

- **Real-time Chat**: Instant messaging with typing indicators
- **File Sharing**: Share images and documents with preview functionality
- **Screen Sharing**: Share your screen with other users in the room
- **User Management**: See who's online in your room
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## Technology Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Real-time Communication**: WebRTC, Socket.io
- **File Handling**: Multer for file uploads
- **Icons**: Font Awesome

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd web-communication-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Joining a Room
1. Enter your username
2. Enter a room ID (create your own or join an existing one)
3. Click "Join Room"

### Chat Features
- Type messages and press Enter or click Send
- See when other users are typing
- Messages are color-coded (blue for your messages, gray for others)

### File Sharing
1. Click the "Share File" button
2. Select an image or document from your device
3. The file will be uploaded and shared with all users in the room
4. Images show previews, documents show download buttons

### Screen Sharing
1. Click "Share Screen" to start sharing your screen
2. Your browser will ask for permission to share your screen
3. Other users will be notified that you're sharing
4. Click "Stop Sharing" to end the screen share

## File Types Supported

**Images**: JPG, JPEG, PNG, GIF, WebP
**Documents**: PDF, DOC, DOCX, TXT

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Note: Screen sharing requires HTTPS in production environments.

## Deployment

### Local Development
The app runs on `http://localhost:3000` by default.

### Production Deployment

#### Option 1: Heroku
1. Create a `Procfile`:
```
web: node server.js
```

2. Deploy to Heroku:
```bash
heroku create
git push heroku main
```

#### Option 2: Vercel
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

#### Option 3: DigitalOcean/Other VPS
1. Install Node.js and npm
2. Clone the repository
3. Install dependencies
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name "web-communication-app"
```

### Environment Variables
- `PORT`: Server port (default: 3000)

## Security Considerations

- File uploads are stored in `public/uploads/` directory
- In production, consider implementing:
  - File type restrictions
  - File size limits
  - Virus scanning
  - User authentication
  - Room access controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Screen Sharing Not Working
- Ensure you're using HTTPS in production
- Check browser permissions for screen sharing
- Update to the latest browser version

### File Upload Issues
- Check `public/uploads/` directory permissions
- Verify file size limits
- Ensure Multer is properly configured

### Connection Issues
- Check that the server is running
- Verify port is not blocked by firewall
- Check browser console for errors

## Future Enhancements

- [ ] User authentication system
- [ ] Persistent chat history
- [ ] Voice and video calling
- [ ] End-to-end encryption
- [ ] File encryption
- [ ] Room moderation tools
- [ ] Mobile app version
- [ ] Emoji reactions
- [ ] Message threading

## Support

For issues and questions, please open an issue on the GitHub repository.
