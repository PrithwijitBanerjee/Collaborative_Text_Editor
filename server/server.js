// server/ server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('../client'));
app.use(bodyParser.json());
app.use('/socket.io', express.static(path.join(__dirname, '../node_modules/socket.io/client-dist')));

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Verify username and password
    if (username === 'user' && password === 'password') {
        const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Authentication middleware
app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        jwt.verify(token, 'secret_key', (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Unauthorized' });
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
});

// Store document content and user cursors
let documentContent = '';
let cursors = {};

// Socket.IO events
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send current document content and cursors to new user
    socket.emit('documentData', { content: documentContent, cursors });

    // Update cursors when a user moves their cursor
    socket.on('cursorMove', (cursor) => {
        cursors[socket.id] = cursor;
        io.emit('updateCursors', cursors);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete cursors[socket.id];
        io.emit('updateCursors', cursors);
    });

    // Handle text updates
    socket.on('textUpdate', (data) => {
        documentContent = data;
        io.emit('documentContent', documentContent);
    });

    // Handle text highlights
    socket.on('textHighlight', (highlight) => {
        io.emit('updateHighlight', highlight);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});













