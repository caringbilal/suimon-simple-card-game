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
import { useDrop } from 'react-dnd';

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;  // Add this
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCardPlay, setGameState }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: 'CARD',
    drop: (item: CardType) => {
      onCardPlay(item);
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

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
        <div 
          ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>}
          className={`player-field ${isOver ? 'field-highlight' : ''}`}
        >
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