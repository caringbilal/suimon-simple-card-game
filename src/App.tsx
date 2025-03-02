import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import { GameState, CardType } from './types/game';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player: {
        id: 'player',
        hp: 1000,
        deck: [],
        hand: []
      },
      opponent: {
        id: 'opponent',
        hp: 1000,
        deck: [],
        hand: []
      }
    },
    currentTurn: 'player',
    gameStatus: 'waiting'
  });

  const handleCardPlay = (card: CardType) => {
    console.log('Card played:', card);
  };

  return (
    <div className="App">
      <GameBoard 
        gameState={gameState} 
        onCardPlay={handleCardPlay}
        setGameState={setGameState}
      />
    </div>
  );
}

export default App;
