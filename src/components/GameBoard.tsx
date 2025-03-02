import React from 'react';
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
import { useDrop } from 'react-dnd';

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

interface HealthBarProps {
  current: number;
  max: number;
  isOpponent?: boolean;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, isOpponent }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className={`health-bar-container ${isOpponent ? 'opponent' : 'player'}`}>
      <div className="health-bar-label">{isOpponent ? 'Opponent' : 'Player'}</div>
      <div className="hp-bar">
        <div 
          className="hp-fill"
          style={{ width: `${percentage}%` }}
        >
          {current}/{max} HP
        </div>
      </div>
    </div>
  );
};

interface CombatLogEntry {
  type: 'damage' | 'defense';
  message: string;
  timestamp: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCardPlay, setGameState }) => {
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);
  
  const renderHealthBars = () => (
    <div className="health-bars-container">
      <HealthBar 
        current={gameState.opponentHealth} 
        max={gameState.opponentMaxHealth} 
        isOpponent 
      />
      <HealthBar 
        current={gameState.playerHealth} 
        max={gameState.playerMaxHealth} 
      />
    </div>
  );
  const [attackingCard, setAttackingCard] = React.useState<string | null>(null);
  const [showTurnIndicator, setShowTurnIndicator] = React.useState(false);

  // Show turn indicator when turn changes
  React.useEffect(() => {
    setShowTurnIndicator(true);
    const timer = setTimeout(() => setShowTurnIndicator(false), 2000);
    return () => clearTimeout(timer);
  }, [gameState.currentTurn]);

  // Function to add combat log entries
  const addCombatLogEntry = (type: 'damage' | 'defense', message: string) => {
    setCombatLog(prev => [...prev, { type, message, timestamp: Date.now() }].slice(-5));
  };

  // Function to handle combat animations
  const handleCombatAnimation = (attackerId: string) => {
    setAttackingCard(attackerId);
    setTimeout(() => setAttackingCard(null), 500);
  };

  // Update combat log when battlefield changes
  React.useEffect(() => {
    if (gameState.battlefield.player.length > 0 && gameState.battlefield.opponent.length > 0) {
      const playerCard = gameState.battlefield.player[0];
      const opponentCard = gameState.battlefield.opponent[0];
      
      const playerDamage = Math.max(0, playerCard.attack - opponentCard.defense);
      const opponentDamage = Math.max(0, opponentCard.attack - playerCard.defense);
      
      // Add damage indicators
      addCombatLogEntry('damage', `${playerCard.name} deals ${playerDamage} damage to ${opponentCard.name}`);
      addCombatLogEntry('damage', `${opponentCard.name} deals ${opponentDamage} damage to ${playerCard.name}`);
      
      // Add defense indicators
      if (opponentCard.defense > 0) {
        addCombatLogEntry('defense', `${opponentCard.name} blocks ${Math.min(playerCard.attack, opponentCard.defense)} damage`);
      }
      if (playerCard.defense > 0) {
        addCombatLogEntry('defense', `${playerCard.name} blocks ${Math.min(opponentCard.attack, playerCard.defense)} damage`);
      }
      
      handleCombatAnimation(playerCard.id);
      setTimeout(() => handleCombatAnimation(opponentCard.id), 500);

      // Create damage number elements
      const battlefield = document.querySelector('.battlefield');
      if (battlefield) {
        const playerDamageEl = document.createElement('div');
        playerDamageEl.className = 'damage-number player-damage';
        playerDamageEl.textContent = `-${playerDamage}`;
        battlefield.appendChild(playerDamageEl);

        const opponentDamageEl = document.createElement('div');
        opponentDamageEl.className = 'damage-number opponent-damage';
        opponentDamageEl.textContent = `-${opponentDamage}`;
        battlefield.appendChild(opponentDamageEl);

        setTimeout(() => {
          battlefield.removeChild(playerDamageEl);
          battlefield.removeChild(opponentDamageEl);
        }, 1000);
      }
    }
  }, [gameState.battlefield]);
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
    // Initialize hands only if both player and opponent hands are empty
    if (gameState.players.player.hand.length === 0 && gameState.players.opponent.hand.length === 0) {
      const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
      const playerHand = shuffled.slice(0, 4);
      const opponentHand = shuffled.slice(4, 8);
      
      setGameState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          player: { ...prev.players.player, hand: playerHand },
          opponent: { ...prev.players.opponent, hand: opponentHand }
        },
        gameStatus: 'playing'
      }));
    }
  }, [gameState.players.player.hand.length, gameState.players.opponent.hand.length, fullDeck, setGameState]); // Add dependencies

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
        {showTurnIndicator && (
          <div className={`turn-indicator ${gameState.currentTurn}`}>
            {gameState.currentTurn.toUpperCase()}'s Turn
          </div>
        )}
      </div>
      
      {/* Opponent Area */}
      <div className="player-area opponent">
        <div className="player-info">
          <div className="player-name">Opponent</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${(gameState.players.opponent.hp / 1000) * 100}%` }}>
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
        {renderHealthBars()}
        <div 
          ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>}
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
            <div className="hp-fill" style={{ width: `${(gameState.players.player.hp / 1000) * 100}%` }}>
            <span>{gameState.players.player.hp} HP</span>
          </div>
          </div>
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