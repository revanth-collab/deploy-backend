const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000', 
        methods: ['GET', 'POST']
    }
});

// Store online users per room
let onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, username }) => {
        socket.join(roomId);

        // Initialize room if it doesn't exist
        if (!onlineUsers[roomId]) {
            onlineUsers[roomId] = {};
        }
        onlineUsers[roomId][socket.id] = username;

        // Emit online users
        io.to(roomId).emit('onlineUsers', Object.values(onlineUsers[roomId]));

        socket.on('chatMessage', (msg) => {
            io.to(roomId).emit('message', { ...msg, username });
        });

        socket.on('disconnect', () => {
            delete onlineUsers[roomId][socket.id];
            io.to(roomId).emit('onlineUsers', Object.values(onlineUsers[roomId]));
        });
    });

    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        if (onlineUsers[roomId]) {
            delete onlineUsers[roomId][socket.id];
            io.to(roomId).emit('onlineUsers', Object.values(onlineUsers[roomId]));
        }
    });
});

app.use(cors());
server.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
