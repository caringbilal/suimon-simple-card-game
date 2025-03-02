import React from 'react';
import { GameState } from '../types/game';
import Card from './Card';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  // Test cards data
  const testCards = [
    {
      id: '1',
      name: 'Fire Dragon',
      attack: 150,
      defense: 100,
      hp: 200,
      imageUrl: ''
    },
    {
      id: '2',
      name: 'Ice Golem',
      attack: 120,
      defense: 180,
      hp: 250,
      imageUrl: ''
    },
    {
      id: '3',
      name: 'Thunder Bird',
      attack: 180,
      defense: 80,
      hp: 150,
      imageUrl: ''
    },
    {
      id: '4',
      name: 'Earth Giant',
      attack: 200,
      defense: 150,
      hp: 300,
      imageUrl: ''
    }
  ];

  return (
    <div className="game-board">
      <h2>SUIMON Card Game</h2>
      <div className="game-status">
        Game Status: {gameState.gameStatus}
      </div>
      <div className="player-hand">
        {testCards.map(card => (
          <Card 
            key={card.id} 
            card={card} 
            onClick={() => console.log(`Card ${card.name} clicked`)} 
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;