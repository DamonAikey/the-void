document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  // -----------------------------
  // Chat Room Functionality
  // -----------------------------
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const messages = document.getElementById('messages');
  
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    if (messageInput.value) {
      socket.emit('chat message', messageInput.value);
      messageInput.value = '';
    }
  });
  
  socket.on('chat message', msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    messages.appendChild(li);
  });
  
  // -----------------------------
  // Interactive Terminal Setup
  // -----------------------------
  const term = new Terminal();
  term.open(document.getElementById('terminal'));
  
  // Send user keystrokes to the server terminal
  term.onData(data => {
    socket.emit('terminal-input', data);
  });
  
  // Write server terminal output to the terminal display
  socket.on('terminal-output', data => {
    term.write(data);
  });

  // -----------------------------
  // File Management: List Files
  // -----------------------------
  function fetchFiles() {
    fetch('/files')
      .then(response => response.json())
      .then(files => {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        files.forEach(file => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = `/download/${file}`;
          link.textContent = file;
          li.appendChild(link);
          fileList.appendChild(li);
        });
      })
      .catch(error => console.error('Error fetching files:', error));
  }
  
  // Fetch file list on page load and after an upload
  fetchFiles();
  const uploadForm = document.getElementById('uploadForm');
  uploadForm.addEventListener('submit', e => {
    // Use a slight delay to allow the upload to complete
    setTimeout(fetchFiles, 1000);
  });
});
