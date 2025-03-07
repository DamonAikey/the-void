// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const uploadDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const upload = multer({ dest: uploadDir });

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------
// File Management Endpoints
// -----------------------------

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    console.log(`Received file: ${req.file.originalname}`);
    res.send('File uploaded successfully!');
});

// List files endpoint
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to list files');
        }
        // Return JSON with file names
        res.json(files);
    });
});

// File download endpoint
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    res.download(filePath, err => {
        if (err) {
            res.status(500).send('Error downloading file');
        }
    });
});

// Optional: File delete endpoint
app.delete('/delete/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    fs.unlink(filePath, err => {
        if (err) {
            return res.status(500).send('Error deleting file');
        }
        res.send('File deleted successfully');
    });
});

// -----------------------------
// Socket.io Integration
// -----------------------------
io.on('connection', socket => {
    console.log('A user connected');

    // Chat message handling
    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });
    
    // Interactive Terminal Backend
    // Create a terminal process for each connected client
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    // When the terminal sends data, forward it to the client
    ptyProcess.on('data', function(data) {
        socket.emit('terminal-output', data);
    });

    // When the client sends data (keystrokes), write it to the terminal
    socket.on('terminal-input', data => {
        ptyProcess.write(data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        ptyProcess.kill();
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
