import React from 'react';
import { GameState } from '../types/game';
import Card from './Card';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  // Test card data
  const testCard = {
    id: '1',
    name: 'Test Monster',
    attack: 100,
    defense: 100,
    hp: 100,
    imageUrl: ''
  };

  return (
    <div className="game-board">
      <h2>SUIMON Card Game</h2>
      <div className="game-status">
        Game Status: {gameState.gameStatus}
      </div>
      <div className="player-hand">
        <Card card={testCard} onClick={() => console.log('Card clicked')} />
      </div>
    </div>
  );
};

export default GameBoard;