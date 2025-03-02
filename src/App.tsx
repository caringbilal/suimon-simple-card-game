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
      <header className="App-header">
        <GameBoard gameState={gameState} />
      </header>
    </div>
  );
}

export default App;
