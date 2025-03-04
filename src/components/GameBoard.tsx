import React, { useState } from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';
import '../styles/combat.css';
import '../styles/player.css';

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
import { useDrop, ConnectDropTarget } from 'react-dnd';

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playerInfo: { name: string; avatar: string };
  opponentInfo: { name: string; avatar: string };
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCardPlay, setGameState, playerInfo, opponentInfo }) => {
  const [attackingCard, setAttackingCard] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<Array<{ timestamp: number; message: string; type: string }>>([]);

  // Add combat log entry function
  const addCombatLogEntry = (message: string, type: string = 'info') => {
    setCombatLog(prevLog => [
      ...prevLog,
      {
        timestamp: Date.now(),
        message,
        type
      }
    ]);
  };

  // Update combat log when cards attack
  React.useEffect(() => {
    if (gameState.battlefield.player.length > 0 && gameState.battlefield.opponent.length > 0) {
      const playerCard = gameState.battlefield.player[0];
      const opponentCard = gameState.battlefield.opponent[0];
      
      // Calculate damage
      const playerDamage = Math.max(0, playerCard.attack - opponentCard.defense);
      const opponentDamage = Math.max(0, opponentCard.attack - playerCard.defense);

      // Log attacks
      if (playerDamage > 0) {
        addCombatLogEntry(
          `${playerCard.name} attacks ${opponentCard.name} for ${playerDamage} damage!`,
          'attack'
        );
      } else {
        addCombatLogEntry(
          `${opponentCard.name} blocks ${playerCard.name}'s attack!`,
          'defense'
        );
      }

      if (opponentDamage > 0) {
        addCombatLogEntry(
          `${opponentCard.name} attacks ${playerCard.name} for ${opponentDamage} damage!`,
          'attack'
        );
      } else {
        addCombatLogEntry(
          `${playerCard.name} blocks ${opponentCard.name}'s attack!`,
          'defense'
        );
      }

      // Check for defeated cards
      if (playerCard.hp <= 0) {
        addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
      }
      if (opponentCard.hp <= 0) {
        addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
      }
    }
  }, [gameState.battlefield]);

  const [{ isOver }, dropRef] = useDrop<CardType, void, { isOver: boolean }>({
    accept: 'CARD',
    drop: (item) => {
      onCardPlay(item);
      return undefined;
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div className="game-board">
      {/* Health Summary Boxes */}
      <div className="health-summary-boxes">
        <div className="health-summary opponent-summary">
          <img 
            src={opponentInfo.avatar} 
            alt="Opponent" 
            className="profile-picture"
          />
          <div className="summary-content">
            <div className="summary-title">OPPONENT CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.players.opponent.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
              <div className="hp-fill" style={{ width: `${(gameState.players.opponent.hp / gameState.opponentMaxHealth) * 100}%` }}>
                <span>{gameState.players.opponent.hp} HP</span>
              </div>
          </div>
            </div>
          </div>
          
        </div>

        <div className="health-summary player-summary">
          <img 
            src={playerInfo.avatar} 
            alt="Player" 
            className="profile-picture"
          />
          <div className="summary-content">
            <div className="summary-title">PLAYER CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.players.player.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
              <div className="hp-fill" style={{ width: `${(gameState.players.player.hp / gameState.playerMaxHealth) * 100}%` }}>
                <span>{gameState.players.player.hp} HP</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opponent Area */}
      <div className="player-area opponent">
        <div className="player-profile opponent-profile">
          <span className="player-name">{opponentInfo.name}</span>
        </div>
        <div className="player-info">
          <div className="player-name">Opponent</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${(gameState.players.opponent.hp / gameState.opponentMaxHealth) * 100}%` }}>
            <span>{gameState.players.opponent.hp} HP</span>
          </div>
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
          {gameState.battlefield.opponent.map((card: CardType) => (
            <Card 
              key={card.id} 
              card={card} 
              isAttacking={attackingCard === card.id}
              onAnimationEnd={() => setAttackingCard(null)}
            />
          ))}
        </div>
        <div 
          ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
          className={`player-field ${isOver ? 'field-highlight' : ''}`}
        >
          {gameState.battlefield.player.map((card: CardType) => (
            <Card 
              key={card.id} 
              card={card} 
              isAttacking={attackingCard === card.id}
              onAnimationEnd={() => setAttackingCard(null)}
            />
          ))}
        </div>
      </div>

      {/* Player Area */}
      <div className="player-area current-player">
        <div className="player-profile">
          <span className="player-name">{playerInfo.name}</span>
        </div>
        <div className="player-info">
          <div className="player-name">Player</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${(gameState.players.player.hp / gameState.playerMaxHealth) * 100}%` }}>
              <span>{gameState.players.player.hp} HP</span>
            </div>
          </div>
        </div>
        {/* Add this section to render player's hand */}
        <div className="player-hand">
          {gameState.players.player.hand.map((card: CardType) => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => onCardPlay(card)}
            />
          ))}
        </div>
      </div>

      {/* Combat Log */}
      <div className="combat-log">
        {combatLog.map((entry, index) => (
          <div key={entry.timestamp} className={`combat-log-entry ${entry.type}`}>
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;