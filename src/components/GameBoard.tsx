import React from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';

// Import all monster images
import sui from '../assets/monsters/sui.png';
import grum from '../assets/monsters/grum.png';
import stomp from '../assets/monsters/stomp.png';
import blaze from '../assets/monsters/blaze.png';
import brocco from '../assets/monsters/brocco.png';
import yeti from '../assets/monsters/yeti.png';
import nubb from '../assets/monsters/nubb.png';
import nom from '../assets/monsters/nom.png';
import cyclo from '../assets/monsters/cyclo.png';
import glint from '../assets/monsters/glint.png';
import fluff from '../assets/monsters/fluff.png';
import captainboo from '../assets/monsters/captainboo.png';
import momo from '../assets/monsters/momo.png';
import slippy from '../assets/monsters/slippy.png';
import whirl from '../assets/monsters/whirl.png';
import twispy from '../assets/monsters/twispy.png';
import pico from '../assets/monsters/pico.png';
import tuga from '../assets/monsters/tuga.png';
import kai from '../assets/monsters/kai.png';
import ruk from '../assets/monsters/ruk.png';
import pyro from '../assets/monsters/pyro.png';
import grow from '../assets/monsters/grow.png';
import luna from '../assets/monsters/luna.png';
import floar from '../assets/monsters/floar.png';
import ecron from '../assets/monsters/ecron.png';

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;  // Add this
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCardPlay, setGameState }) => {
  // Define fullDeck before useEffect
  const fullDeck: CardType[] = [
    { id: '1', name: 'SUI', attack: 150, defense: 100, hp: 200, imageUrl: sui },
    { id: '2', name: 'GRUM', attack: 120, defense: 180, hp: 250, imageUrl: grum },
    { id: '3', name: 'STOMP', attack: 180, defense: 80, hp: 150, imageUrl: stomp },
    { id: '4', name: 'BLAZE', attack: 200, defense: 150, hp: 300, imageUrl: blaze },
    { id: '5', name: 'BROCCO', attack: 140, defense: 160, hp: 220, imageUrl: brocco },
    { id: '6', name: 'YETI', attack: 170, defense: 170, hp: 280, imageUrl: yeti },
    { id: '7', name: 'NUBB', attack: 130, defense: 140, hp: 190, imageUrl: nubb },
    { id: '8', name: 'NOM', attack: 160, defense: 130, hp: 210, imageUrl: nom },
    { id: '9', name: 'CYCLO', attack: 190, defense: 120, hp: 240, imageUrl: cyclo },
    { id: '10', name: 'GLINT', attack: 140, defense: 190, hp: 260, imageUrl: glint },
    { id: '11', name: 'FLUFF', attack: 150, defense: 100, hp: 200, imageUrl: fluff },
    { id: '12', name: 'CAPTAINBOO', attack: 120, defense: 180, hp: 250, imageUrl: captainboo },
    { id: '13', name: 'MOMO', attack: 180, defense: 80, hp: 150, imageUrl: momo },
    { id: '14', name: 'SLIPPY', attack: 200, defense: 150, hp: 300, imageUrl: slippy },
    { id: '15', name: 'WHIRL', attack: 140, defense: 160, hp: 220, imageUrl: whirl },
    { id: '16', name: 'TWISPY', attack: 170, defense: 170, hp: 280, imageUrl: twispy },
    { id: '17', name: 'PICO', attack: 130, defense: 140, hp: 190, imageUrl: pico },
    { id: '18', name: 'TUGA', attack: 160, defense: 130, hp: 210, imageUrl: tuga },
    { id: '19', name: 'KAI', attack: 190, defense: 120, hp: 240, imageUrl: kai },
    { id: '20', name: 'RUK', attack: 140, defense: 190, hp: 260, imageUrl: ruk },
    { id: '21', name: 'PYRO', attack: 150, defense: 100, hp: 200, imageUrl: pyro },
    { id: '22', name: 'GROW', attack: 170, defense: 170, hp: 280, imageUrl: grow },
    { id: '23', name: 'LUNA', attack: 180, defense: 80, hp: 150, imageUrl: luna },
    { id: '24', name: 'FLOAR', attack: 200, defense: 150, hp: 300, imageUrl: floar },
    { id: '25', name: 'ECRON', attack: 140, defense: 190, hp: 260, imageUrl: ecron }
  ];

  React.useEffect(() => {
    if (gameState.players.player.hand.length === 0) {
      const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
      const playerHand = shuffled.slice(0, 4);
      const opponentHand = shuffled.slice(4, 8);
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
        players: {
          ...prev.players,
          player: { ...prev.players.player, hand: playerHand },
          opponent: { ...prev.players.opponent, hand: opponentHand }
        }
      }));
    }
  }, [gameState.players.player.hand.length, setGameState]);

  return (
    <div className="game-board">
      <h2>SUIMON Card Game</h2>
      
      {/* Game Status */}
      <div className="game-status">
        Game Status: {gameState.gameStatus || "Waiting..."}
      </div>
      
      {/* Opponent Area */}
      <div className="player-area opponent">
        <div className="player-info">
          <div className="player-name">Opponent</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: '100%' }}><span>1000 HP</span></div>
          </div>
        </div>
        <div className="player-hand opponent-hand">
          {gameState.players.opponent.hand.map((card: CardType) => (
            <div key={card.id} className="card">
              <img src={cardBack} alt="Card Back" className="card-back-image" />
            </div>
          ))}
        </div>
      </div>

      {/* Battlefield */}
      <div className="battlefield">
        <div className="opponent-field">
          {/* Opponent's played cards */}
        </div>
        <div className="player-field">
          {/* Player's played cards */}
        </div>
      </div>

      {/* Player Area */}
      <div className="player-area current-player">
        <div className="player-hand">
          {gameState.players.player.hand.map((card: CardType) => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => onCardPlay(card)} 
            />
          ))}
        </div>
        <div className="player-info">
          <div className="player-name">Player</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: '100%' }}>1000 HP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;