import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameBoard from '@components/GameBoard';
import GameOver from '@components/GameOver';
import { GameState, CardType } from './types/game';
import { getInitialHand } from '@data/monsters';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { io, Socket } from 'socket.io-client';
import PlayerProfile from './assets/ui/Player_Profile.jpg';
import OpponentProfile from './assets/ui/AIPlayer_Profile.jpg';

// Define the server URL for AWS deployment
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://34.209.16.106:3002'; // AWS EC2 instance URL
const socket: Socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 60000,
  autoConnect: false,
  forceNew: true
});

// Player info constants
const player1Info = { name: 'Player 1', avatar: PlayerProfile };
const player2Info = { name: 'Player 2', avatar: OpponentProfile };

function App() {
  // Game constants
  const MAX_ENERGY = 700;

  // State variables
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2' | null>(null);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  // Memoized function to add combat log entries
  const addCombatLogEntry = useCallback((message: string, type: string = 'info') => {
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatLog: [
          ...prev.combatLog,
          { timestamp: Date.now(), message, type },
        ],
      };
    });
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    socket.connect();
    socket.io.on("reconnect_attempt", () => {
      setDialogMessage("Attempting to reconnect...");
    });
    
    socket.io.on("reconnect", () => {
      setDialogMessage("Reconnected to server!");
      setTimeout(() => setDialogMessage(null), 3000);
    });
    
    socket.io.on("reconnect_failed", () => {
      setDialogMessage("Failed to reconnect. Please refresh the page.");
    });
  }, []);

  // Handle Socket.IO events
  useEffect(() => {
    // Initialize socket connection
    initializeSocket();
    socket.on('connect', () => {
      console.log('Connected to server at', SERVER_URL);
    });

    socket.on('roomCreated', (id: string) => {
      console.log('Room created event received:', id);
      setDialogMessage('Room created successfully. Waiting for opponent...');
      setRoomId(id);
      setPlayerRole('player1');
    });

    socket.on('joinSuccess', (id: string) => {
      console.log('Join success event received:', id);
      setDialogMessage('Successfully joined the room. Game will start soon...');
    });

    socket.on('startGame', (id: string) => {
      console.log('Start game event received:', id);
      setDialogMessage('Game starting...');
      setRoomId(id);
      if (!playerRole) {
        console.log('Setting player role to player2');
        setPlayerRole('player2');
      }
      const initialState: GameState = {
        players: {
          player: { id: 'player1', energy: MAX_ENERGY, deck: [], hand: getInitialHand() },
          opponent: { id: 'player2', energy: MAX_ENERGY, deck: [], hand: getInitialHand() },
        },
        battlefield: { player: [], opponent: [] },
        currentTurn: 'player',
        gameStatus: 'waiting',
        playerMaxHealth: MAX_ENERGY,
        opponentMaxHealth: MAX_ENERGY,
        combatLog: [],
        killCount: { player: 0, opponent: 0 },
      };
      console.log('Setting initial game state:', initialState);
      setGameState(initialState);
      if (playerRole === 'player1') {
        console.log('Player1 emitting initial game state');
        socket.emit('updateGameState', id, initialState);
      }
    });

    socket.on('gameStateUpdate', (newState: GameState) => {
      console.log('Game state update received:', newState);
      setGameState(newState);
      setDialogMessage(null);
    });

    socket.on('error', (msg: string) => {
      console.log('Error received:', msg);
      setDialogMessage(`Failed to connect: ${msg}. Please try again.`);
      if (msg.includes('Room does not exist') || msg.includes('Room is full')) {
        setRoomId(null);
        setPlayerRole(null);
        setGameState(null);
      }
    });

    socket.on('playerDisconnected', () => {
      console.log('Player disconnected');
      setDialogMessage('Opponent disconnected. Game ended.');
      setRoomId(null);
      setPlayerRole(null);
      setGameState(null);
    });

    socket.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      setDialogMessage(`Connection failed: ${error.message}. Please try again or check network.`);
      socket.disconnect();
      setRoomId(null);
      setPlayerRole(null);
      setGameState(null);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('roomCreated');
      socket.off('joinSuccess');
      socket.off('startGame');
      socket.off('gameStateUpdate');
      socket.off('error');
      socket.off('playerDisconnected');
      socket.off('connect_error');
      socket.offAny();
    };
  }, [playerRole, initializeSocket]);

  // Handle player card play
  const handleCardPlay = (card: CardType) => {
    if (!gameState || !roomId || !playerRole) return;

    const isPlayerTurn =
      playerRole === 'player1'
        ? gameState.currentTurn === 'player'
        : gameState.currentTurn === 'opponent';
    if (!isPlayerTurn) return;

    const playerKey = playerRole === 'player1' ? 'player' : 'opponent';
    const opponentKey = playerKey === 'player' ? 'opponent' : 'player';
    const updatedHand = gameState.players[playerKey].hand.filter((c) => c.id !== card.id);
    const updatedBattlefield = { ...gameState.battlefield, [playerKey]: [card] };
    const totalCards = updatedHand.length + updatedBattlefield[playerKey].length;
    const cardsToDraw = Math.max(0, 4 - totalCards);
    const newCards = getInitialHand(cardsToDraw).map(card => ({ ...card, hp: card.maxHp }));
    const finalHand = [...updatedHand, ...newCards];

    const newState: GameState = {
      ...gameState,
      players: {
        ...gameState.players,
        [playerKey]: { ...gameState.players[playerKey], hand: finalHand },
      },
      battlefield: updatedBattlefield,
      currentTurn: opponentKey,
      gameStatus: 'playing',
    };

    setGameState(newState);
    socket.emit('updateGameState', roomId, newState);
  };

  // Handle card defeat logic
  const handleCardDefeated = (defeatedPlayerKey: 'player' | 'opponent') => {
    if (!gameState || !roomId) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        killCount: {
          ...prev.killCount,
          [defeatedPlayerKey]: prev.killCount[defeatedPlayerKey] + 1
        },
        players: {
          ...prev.players,
          [defeatedPlayerKey]: {
            ...prev.players[defeatedPlayerKey],
            energy: prev.players[defeatedPlayerKey].energy - 50
          }
        }
      };
    });
  };

  // Calculate victory condition based on player role
  const opponentEnergy = gameState?.players?.opponent?.energy;
  const playerEnergy = gameState?.players?.player?.energy;
  const isVictory =
    opponentEnergy !== undefined && playerEnergy !== undefined
      ? (playerRole === 'player1' && opponentEnergy <= 0 && playerEnergy > 0) ||
        (playerRole === 'player2' && playerEnergy <= 0 && opponentEnergy > 0)
      : false;

  // Dialog component for feedback
  const Dialog = ({ message }: { message: string }) => (
    <div style={{ 
      position: 'fixed', 
      top: '10%', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      background: '#333',
      color: '#fff', 
      padding: '20px', 
      border: '2px solid #666',
      borderRadius: '8px', 
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)', 
      zIndex: 1000,
      minWidth: '300px',
      textAlign: 'center'
    }}>
      <p style={{ fontSize: '16px', margin: '0 0 15px 0' }}>{message || 'Loading...'}</p>
      <button 
        onClick={() => setDialogMessage(null)}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  );

  const handleJoinGame = () => {
    console.log('Join Game button clicked');
    console.log('Socket connected:', socket.connected);

    if (!joinRoomInput.trim()) {
      setDialogMessage('Please enter a valid Room ID');
      return;
    }

    if (!socket.connected) {
      console.log('Attempting to reconnect...');
      socket.connect();
      setDialogMessage('Attempting to connect to server...');
      return;
    }

    setDialogMessage('Joining game room...');
    socket.emit('joinRoom', joinRoomInput.trim());
    console.log('Emitted joinRoom event with ID:', joinRoomInput.trim());

    const joinTimeout = setTimeout(() => {
      setDialogMessage('Room join request timed out. Please try again or check network.');
      socket.disconnect();
    }, 15000);

    const handleJoinSuccess = () => {
      clearTimeout(joinTimeout);
      setDialogMessage('Successfully joined the room. Game will start soon...');
    };

    const handleError = (msg: string) => {
      clearTimeout(joinTimeout);
      setDialogMessage(`Failed to connect: ${msg}. Please try again or check network.`);
      socket.disconnect();
    };

    socket.once('joinSuccess', handleJoinSuccess);
    socket.once('error', handleError);

    return () => {
      socket.off('joinSuccess', handleJoinSuccess);
      socket.off('error', handleError);
      clearTimeout(joinTimeout);
    };
  };

  // Room creation/joining UI
  if (!roomId) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="app">
          <div className="background-rectangle" />
          <div className="game-container">
            <h2>Suimon Card Battle</h2>
            <button
              onClick={() => {
                console.log('Create Game button clicked');
                console.log('Socket connected:', socket.connected);
                if (!socket.connected) {
                  console.log('Attempting to reconnect...');
                  socket.connect();
                }
                setDialogMessage('Creating game room... Socket status: ' + (socket.connected ? 'Connected' : 'Disconnected'));
                socket.emit('createRoom');
                console.log('Emitted createRoom event');
              }}
            >
              Create Game
            </button>
            <input
              type="text"
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value)}
              placeholder="Enter Room ID"
            />
            <button
              onClick={handleJoinGame}
              className="join-game-button"
            >
              Join Game
            </button>
            {dialogMessage && <Dialog message={dialogMessage} />}
          </div>
        </div>
      </DndProvider>
    );
  }

  // Main game UI with game state and player info
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="background-rectangle" />
        <div className="game-container">
          {gameState?.gameStatus === 'finished' ? (
            <GameOver
              isVictory={isVictory}
              isTie={false}
              playerEnergy={playerEnergy ?? 0}
              opponentEnergy={opponentEnergy ?? 0}
              onPlayAgain={() => {
                setRoomId(null);
                setPlayerRole(null);
                setGameState(null);
              }}
            />
          ) : (
            <>
              <div className="game-info-panel">
                <p><strong>Room ID:</strong> {roomId} <button onClick={() => navigator.clipboard.writeText(roomId || '')}>Copy</button></p>
                <p><strong>Your Role:</strong> {playerRole}</p>
                <p><strong>Player 1 Joined:</strong> {(playerRole === 'player1' && roomId) || (gameState?.players.player) ? 'Yes' : 'No'}</p>
                <p><strong>Player 2 Joined:</strong> {gameState?.players.opponent ? 'Yes' : 'No'}</p>
                <p><strong>Current Game State:</strong> {gameState?.gameStatus || 'Not started'}</p>
              </div>

              {gameState && playerRole && (
                <GameBoard
                  gameState={gameState}
                  onCardPlay={handleCardPlay}
                  setGameState={setGameState}
                  playerInfo={playerRole === 'player1' ? player1Info : player2Info}
                  opponentInfo={playerRole === 'player1' ? player2Info : player1Info}
                  combatLog={gameState.combatLog}
                  addCombatLogEntry={addCombatLogEntry}
                  killCount={gameState.killCount}
                  playerRole={playerRole}
                  roomId={roomId}
                  socket={socket}
                  onCardDefeated={handleCardDefeated}
                />
              )}
            </>
          )}
          {dialogMessage && <Dialog message={dialogMessage} />}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;