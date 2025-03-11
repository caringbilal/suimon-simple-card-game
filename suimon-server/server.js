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
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

const gameStates = {};

function generateUniqueRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);
  console.log('Current game states on connection:', JSON.stringify(gameStates, null, 2));

  // Send initial connection success event
  socket.emit('connected', { id: socket.id });

  // Handle player disconnection
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

  // Handle socket errors
  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
    socket.emit('error', 'An unexpected error occurred. Please try again.');
  });

  // Create a new game room
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

  // Join an existing game room
  socket.on('joinRoom', async (roomId) => {
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

      // Join the room
      await socket.join(roomId);
      room.player2 = socket.id;
      console.log(`Player 2 (${socket.id}) successfully joined room ${roomId}`);

      // Notify the joining player of success
      socket.emit('joinSuccess', roomId);

      // Wait briefly to ensure both clients are ready, then start the game
      setTimeout(() => {
        io.to(roomId).emit('startGame', roomId);
        console.log(`Game started in room ${roomId} with players: ${room.player1}, ${room.player2}`);
      }, 1000);

    } catch (error) {
      console.error(`Error joining room: ${error.message}`);
      socket.emit('error', error.message);
    }
  });

  // Handle game state updates from Player 1
  socket.on('updateGameState', (roomId, newGameState) => {
    try {
      if (!gameStates[roomId]) {
        throw new Error('Room not found');
      }

      // Update the server-side game state and broadcast to all players in the room
      gameStates[roomId].gameState = newGameState;
      io.to(roomId).emit('gameStateUpdate', newGameState);
      console.log(`Game state updated for room ${roomId}`);

    } catch (error) {
      console.error(`Error updating game state: ${error.message}`);
      socket.emit('error', 'Failed to update game state');
    }
  });

  // Heartbeat mechanism to maintain connection health
  const heartbeat = setInterval(() => {
    socket.emit('ping');
  }, 25000);

  socket.on('pong', () => {
    console.log(`Received pong from ${socket.id}`);
  });

  // Clean up heartbeat on disconnect
  socket.on('disconnect', () => {
    clearInterval(heartbeat);
  });
});

// Define a different port to avoid conflicts with other servers
const PORT = process.env.PORT || 3001;

// Start the server on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at 0.0.0.0`);
});

// Log server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});