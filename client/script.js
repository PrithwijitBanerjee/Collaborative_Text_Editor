// client/script.js

// Load Monaco Editor and Socket.IO
require.config({
    paths: {
        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor/min/vs',
        'socket.io': '/socket.io/socket.io.js' // Adjust the path as needed
    }
});


require(['vs/editor/editor.main', 'socket.io'], function (monaco, io) {
    // Authenticate user and obtain JWT token
    fetch('/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'user', password: 'password' }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Connect to Socket.IO with JWT token
                const socket = io({
                    extraHeaders: {
                        Authorization: `Bearer ${data.token}`
                    }
                });

                // Initialize Monaco Editor
                const editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '',
                    language: 'plaintext'
                });

                // Handle text updates
                editor.onDidChangeModelContent(() => {
                    socket.emit('textUpdate', editor.getValue());
                });

                // Handle receiving document content from server
                socket.on('documentContent', (content) => {
                    editor.setValue(content);
                });

                // Handle user presence indicators
                socket.on('userConnected', (userId) => {
                    console.log('User connected:', userId);
                    // Update UI to show user presence indicator
                });

                socket.on('userDisconnected', (userId) => {
                    console.log('User disconnected:', userId);
                    // Update UI to remove user presence indicator
                });
            } else {
                console.error('Failed to authenticate user');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});















