import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import { GameState } from './types/game';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    currentTurn: '',
    gameStatus: 'waiting'
  });

  return (
    <div className="App">
      <GameBoard gameState={gameState} />
    </div>
  );
}

export default App;
