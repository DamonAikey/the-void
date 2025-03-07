// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(`Received file: ${req.file.originalname}`);
  res.send('File uploaded successfully!');
});

// Set up Socket.io for real-time chat
io.on('connection', socket => {
  console.log('A user connected');

  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
