import React from 'react';
import { GameState } from '../types/game';
import Card from './Card';

// Import all monster images
const monsterImages = {
  sui: require('../assets/monsters/sui.png'),
  grum: require('../assets/monsters/grum.png'),
  stomp: require('../assets/monsters/stomp.png'),
  blaze: require('../assets/monsters/blaze.png'),
  brocco: require('../assets/monsters/brocco.png'),
  yeti: require('../assets/monsters/yeti.png'),
  nubb: require('../assets/monsters/nubb.png'),
  nom: require('../assets/monsters/nom.png'),
  cyclo: require('../assets/monsters/cyclo.png'),
  glint: require('../assets/monsters/glint.png'),
  fluff: require('../assets/monsters/fluff.png'),
  captainboo: require('../assets/monsters/captainboo.png'),
  momo: require('../assets/monsters/momo.png'),
  slippy: require('../assets/monsters/slippy.png'),
  whirl: require('../assets/monsters/whirl.png'),
  twispy: require('../assets/monsters/twispy.png'),
  pico: require('../assets/monsters/pico.png'),
  tuga: require('../assets/monsters/tuga.png'),
  kai: require('../assets/monsters/kai.png'),
  ruk: require('../assets/monsters/ruk.png'),
  pyro: require('../assets/monsters/pyro.png'),
  grow: require('../assets/monsters/grow.png'),
  luna: require('../assets/monsters/luna.png'),
  floar: require('../assets/monsters/floar.png'),
  ecron: require('../assets/monsters/ecron.png'),
};

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  // Test cards data with all monsters
  const testCards = [
    {
      id: '1',
      name: 'SUI',
      attack: 150,
      defense: 100,
      hp: 200,
      imageUrl: monsterImages.sui
    },
    {
      id: '2',
      name: 'GRUM',
      attack: 120,
      defense: 180,
      hp: 250,
      imageUrl: monsterImages.grum
    },
    {
      id: '3',
      name: 'STOMP',
      attack: 180,
      defense: 80,
      hp: 150,
      imageUrl: monsterImages.stomp
    },
    {
      id: '4',
      name: 'BLAZE',
      attack: 200,
      defense: 150,
      hp: 300,
      imageUrl: monsterImages.blaze
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