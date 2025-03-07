const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for testing; restrict in production
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

const gameStates = {};

function generateUniqueRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);
  console.log('Current game states on connection:', JSON.stringify(gameStates, null, 2));

  socket.on('disconnect', (reason) => {
    console.log(`Player ${socket.id} disconnected. Reason: ${reason}`);
    for (const roomId in gameStates) {
      const room = gameStates[roomId];
      if (room.player1 === socket.id || room.player2 === socket.id) {
        console.log(`Cleaning up room ${roomId} due to player ${socket.id} disconnection`);
        io.to(roomId).emit('playerDisconnected', { reason });
        delete gameStates[roomId];
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
    socket.emit('error', 'An unexpected error occurred. Please try again.');
  });

  socket.on('createRoom', () => {
    try {
      const roomId = generateUniqueRoomId();
      socket.join(roomId);
      gameStates[roomId] = { player1: socket.id, player2: null, gameState: null };
      console.log(`Room ${roomId} created by player ${socket.id}`);
      socket.emit('roomCreated', roomId);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room. Please try again.');
    }
  });

  socket.on('joinRoom', (roomId) => {
    console.log(`Player ${socket.id} attempting to join room: ${roomId}`);

    try {
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }

      if (!gameStates[roomId]) {
        throw new Error('Room does not exist');
      }

      const room = gameStates[roomId];

      if (room.player1 === socket.id) {
        throw new Error('Cannot join your own room');
      }

      if (room.player2) {
        throw new Error('Room is full');
      }

      socket.join(roomId);
      room.player2 = socket.id;
      console.log(`Player 2 (${socket.id}) successfully joined room ${roomId}`);

      // Notify the joining player of success
      socket.emit('joinSuccess', roomId);

      // Broadcast to all players in the room to start the game
      io.to(roomId).emit('startGame', roomId);
      console.log(`Game started in room ${roomId} with players: ${room.player1}, ${room.player2}`);

    } catch (error) {
      console.error(`Error joining room: ${error.message}`);
      socket.emit('error', error.message);
    }
  });

  socket.on('updateGameState', (roomId, newGameState) => {
    try {
      if (!gameStates[roomId]) {
        throw new Error('Room not found');
      }

      gameStates[roomId].gameState = newGameState;
      io.to(roomId).emit('gameStateUpdate', newGameState);
      console.log(`Game state updated for room ${roomId}`);

    } catch (error) {
      console.error(`Error updating game state: ${error.message}`);
      socket.emit('error', 'Failed to update game state');
    }
  });
});

// Ensure the server listens on all network interfaces
server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000 at 0.0.0.0');
});

server.on('error', (error) => {
  console.error('Server error:', error);
});