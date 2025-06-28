// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173" })); 
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // your frontend origin (Vite)
    methods: ['GET', 'POST']
  }
});

// In-memory session store
const sessions = {};

// Helper: get current game state (stub, can be expanded)
function getGameState(sessionId) {
  const session = sessions[sessionId];
  return session?.gameState || {};
}

// Helper: update game state
function updateGameState(sessionId, gameState) {
  if (sessions[sessionId]) {
    sessions[sessionId].gameState = { ...sessions[sessionId].gameState, ...gameState };
  }
}

io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`);

  // Join game session
  socket.on('joinSession', ({ sessionId, playerName }) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = { players: [], assignedColors: [], gameState: {} };
    }

    // Check if player with same name already exists (rejoin)
    let existingPlayer = sessions[sessionId].players.find(p => p.name === playerName);
    if (existingPlayer) {
      existingPlayer.id = socket.id; // Update socket ID
      console.log(`🔄 ${playerName} rejoined session ${sessionId}`);
    } else {
      // Prevent more than 2 players
      if (sessions[sessionId].players.length >= 2) {
        socket.emit('sessionFull');
        return;
      }

      // Assign color
      let color;
      if (sessions[sessionId].players.length === 0) {
        color = Math.random() < 0.5 ? 'white' : 'black';
        sessions[sessionId].assignedColors = [color];
      } else {
        color = sessions[sessionId].assignedColors[0] === 'white' ? 'black' : 'white';
        sessions[sessionId].assignedColors.push(color);
      }

      sessions[sessionId].players.push({ id: socket.id, name: playerName, color });
      console.log(`👤 ${playerName} joined session ${sessionId}`);
    }

    socket.join(sessionId);

    // Log for debugging
    console.log('Current sessions:', Object.keys(sessions));
    console.log('Sessions state:', JSON.stringify(sessions, null, 2));

    // Send current game state to the joining player
    const currentGameState = getGameState(sessionId);
    if (currentGameState.board || currentGameState.moveHistory) {
      console.log(`📤 Sending game state to ${playerName}:`, currentGameState);
      socket.emit('gameState', currentGameState);
    }

    io.to(sessionId).emit('playerJoined', {
      players: sessions[sessionId].players.map(p => ({ id: p.id, name: p.name, color: p.color }))
    });
  });

  // Handle move
  socket.on('move', ({ sessionId, move, gameState: clientGameState }) => {
    // Update the server's game state with the move and client state
    updateGameState(sessionId, {
      board: clientGameState.board,
      moveHistory: clientGameState.moveHistory,
      currentTurn: clientGameState.currentTurn,
      gameOver: clientGameState.gameOver,
      winner: clientGameState.winner,
      drawReason: clientGameState.drawReason
    });
    
    // Send move to the other player
    socket.to(sessionId).emit('opponentMove', move);
  });

  // Handle game state update (for non-move updates like checkmate detection)
  socket.on('updateGameState', ({ sessionId, gameState }) => {
    updateGameState(sessionId, gameState);
  });

  // Handle game state request
  socket.on('requestGameState', ({ sessionId }) => {
    const currentGameState = getGameState(sessionId);
    if (currentGameState.board || currentGameState.moveHistory) {
      console.log(`📤 Sending requested game state for session ${sessionId}:`, currentGameState);
      socket.emit('gameState', currentGameState);
    }
  });

  // Handle explicit leave game
  socket.on('leaveGame', ({ sessionId, playerId }) => {
    console.log(`🚪 Player ${playerId} explicitly left session ${sessionId}`);
    if (sessions[sessionId]) {
      // Find the leaving player
      const leavingPlayer = sessions[sessionId].players.find(p => p.id === socket.id);
      if (leavingPlayer) {
        console.log(`🚪 ${leavingPlayer.name} (${leavingPlayer.color}) left session ${sessionId}`);
        
        // Remove the leaving player
        sessions[sessionId].players = sessions[sessionId].players.filter(p => p.id !== socket.id);
        
        // Find the remaining player
        const remainingPlayer = sessions[sessionId].players[0];
        
        // Notify the remaining player that they won
        if (remainingPlayer) {
          console.log(`🏆 ${remainingPlayer.name} wins by opponent leaving`);
          io.to(remainingPlayer.id).emit('playerExplicitlyLeft', { 
            playerId: leavingPlayer.id,
            winner: remainingPlayer.name,
            reason: 'Opponent left the game'
          });
        }
        
        // Clean up session if no players remain
        if (sessions[sessionId].players.length === 0) {
          console.log(`🗑️ Cleaning up empty session: ${sessionId}`);
          delete sessions[sessionId];
        }
      }
    }
  });

  // Handle disconnect - just log, don't remove player
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    // Don't remove player from session - they can reconnect anytime
    // Just log the disconnect for debugging
    for (const sessionId in sessions) {
      if (!sessions[sessionId].players) continue;
      const player = sessions[sessionId].players.find(p => p.id === socket.id);
      if (player) {
        console.log(`📱 ${player.name} (playerId: ${player.playerId}) disconnected but kept in session ${sessionId}`);
        
        // Set a timeout to treat as left if they don't reconnect within 30 seconds
        setTimeout(() => {
          const session = sessions[sessionId];
          if (session && session.players) {
            const stillDisconnected = session.players.find(p => p.id === socket.id);
            if (stillDisconnected) {
              console.log(`⏰ ${stillDisconnected.name} didn't reconnect within 30s, treating as left`);
              
              // Remove the disconnected player
              session.players = session.players.filter(p => p.id !== socket.id);
              
              // Find the remaining player
              const remainingPlayer = session.players[0];
              
              // Notify the remaining player that they won
              if (remainingPlayer) {
                console.log(`🏆 ${remainingPlayer.name} wins by opponent timeout`);
                io.to(remainingPlayer.id).emit('playerExplicitlyLeft', { 
                  playerId: stillDisconnected.id,
                  winner: remainingPlayer.name,
                  reason: 'Opponent disconnected and did not reconnect'
                });
              }
              
              // Clean up session if no players remain
              if (session.players.length === 0) {
                console.log(`🗑️ Cleaning up empty session: ${sessionId}`);
                delete sessions[sessionId];
              }
            }
          }
        }, 30000); // 30 seconds timeout
        
        // Optionally notify other players that this player is temporarily disconnected
        socket.to(sessionId).emit('playerTemporarilyDisconnected', { playerId: player.playerId });
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('♟️ Chess Socket.IO Server is running!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Chess server running on http://localhost:${PORT}`);
});
