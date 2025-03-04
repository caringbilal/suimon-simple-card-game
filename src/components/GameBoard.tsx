import React, { useState, useEffect } from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';
import '../styles/combat.css';
import '../styles/player.css';
import { getInitialHand } from '../data/monsters';

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
  const [defendingCard, setDefendingCard] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<Array<{ timestamp: number; message: string; type: string }>>([]);
  const [defeatedCards, setDefeatedCards] = useState<{
    player: CardType[];
    opponent: CardType[];
  }>({ player: [], opponent: [] });
  const [killCount, setKillCount] = useState<{
    player: number;
    opponent: number;
  }>({ player: 0, opponent: 0 });

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
  useEffect(() => {
    const processCombat = async () => {
      if (gameState.gameStatus !== 'playing' || !gameState.battlefield.player.length || !gameState.battlefield.opponent.length) {
        // Always ensure opponent has exactly 4 cards total (hand + battlefield)
        const totalOpponentCards = gameState.players.opponent.hand.length + gameState.battlefield.opponent.length;
        if (totalOpponentCards < 4) {
          const newCards = getInitialHand(4 - totalOpponentCards).map(card => ({
            ...card,
            maxHp: card.maxHp || card.hp
          }));
          setGameState(prev => ({
            ...prev,
            players: {
              ...prev.players,
              opponent: {
                ...prev.players.opponent,
                hand: [...prev.players.opponent.hand, ...newCards]
              }
            },
            currentTurn: 'opponent',
            gameStatus: 'waiting'
          }));
        }
        return;
      }

      // Check if either player has zero energy before combat
      if (gameState.players.player.hp <= 0) {
        addCombatLogEntry('Game Over - Opponent Wins!', 'death');
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished',
          currentTurn: 'opponent',
          battlefield: { player: [], opponent: [] }
        }));
        return;
      }

      if (gameState.players.opponent.hp <= 0) {
        addCombatLogEntry('Game Over - Player Wins!', 'death');
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished',
          currentTurn: 'player',
          battlefield: { player: [], opponent: [] }
        }));
        return;
      }

      // Process combat for each pair of cards
      const playerCard = gameState.battlefield.player[0];
      const opponentCard = gameState.battlefield.opponent[0];
      
      if (playerCard && opponentCard) {
        const playerDamage = Math.max(0, playerCard.attack - opponentCard.defense);
        const opponentDamage = Math.max(0, opponentCard.attack - playerCard.defense);
        
        // Player attacks first
        if (playerDamage > 0) {
          setAttackingCard(playerCard.id);
          setDefendingCard(opponentCard.id);
          addCombatLogEntry(`${playerCard.name} attacks ${opponentCard.name} for ${playerDamage} damage!`, 'attack');
          
          const updatedOpponentCard = { 
            ...opponentCard, 
            hp: Math.max(0, opponentCard.hp - playerDamage),
            maxHp: opponentCard.maxHp // Remove the fallback to hp here
          };
          
          if (updatedOpponentCard.hp <= 0) {
            addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
            setDefeatedCards(prev => ({
              ...prev,
              opponent: [...prev.opponent, opponentCard]
            }));
            setKillCount(prev => ({
              ...prev,
              player: prev.player + 1
            }));
            setGameState(prev => {
              // Calculate total cards for opponent
              const totalOpponentCards = prev.players.opponent.hand.length;
              const newOpponentCards = getInitialHand(4 - totalOpponentCards).map(card => ({
                ...card,
                hp: card.maxHp, // Ensure new cards start with full HP
                maxHp: card.maxHp
              }));
              return {
                ...prev,
                players: {
                  ...prev.players,
                  opponent: {
                    ...prev.players.opponent,
                    hp: Math.max(0, prev.players.opponent.hp - playerDamage),
                    hand: [...prev.players.opponent.hand, ...newOpponentCards]
                  }
                },
                battlefield: {
                  ...prev.battlefield,
                  opponent: []
                },
                currentTurn: 'opponent',
                gameStatus: 'waiting'
              };
            });
            return;
          }
          
          setGameState(prev => ({
            ...prev,
            battlefield: {
              ...prev.battlefield,
              opponent: [updatedOpponentCard]
            },
            gameStatus: 'playing'
          }));
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          setAttackingCard(null);
          setDefendingCard(null);
        }
        
        // Opponent attacks second if still alive
        if (opponentCard.hp > 0) {
          setAttackingCard(opponentCard.id);
          setDefendingCard(playerCard.id);
          
          if (opponentDamage > 0) {
            addCombatLogEntry(`${opponentCard.name} attacks ${playerCard.name} for ${opponentDamage} damage!`, 'attack');
          } else {
            addCombatLogEntry(`${playerCard.name} blocks ${opponentCard.name}'s attack!`, 'defense');
          }
          
          const updatedPlayerCard = { 
            ...playerCard, 
            hp: Math.max(0, playerCard.hp - opponentDamage),
            maxHp: playerCard.maxHp // Remove the fallback to hp here
          };
          
          if (updatedPlayerCard.hp <= 0) {
            addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
            setDefeatedCards(prev => ({
              ...prev,
              player: [...prev.player, playerCard]
            }));
            setKillCount(prev => ({
              ...prev,
              opponent: prev.opponent + 1
            }));
            setGameState(prev => {
              // Calculate total cards for player
              const totalPlayerCards = prev.players.player.hand.length + prev.battlefield.player.length;
              const newPlayerCards = getInitialHand(4 - totalPlayerCards).map(card => ({
                ...card,
                maxHp: card.maxHp || card.hp
              }));
              return {
                ...prev,
                players: {
                  ...prev.players,
                  player: {
                    ...prev.players.player,
                    hp: Math.max(0, prev.players.player.hp - opponentDamage),
                    hand: [...prev.players.player.hand, ...newPlayerCards]
                  }
                },
                battlefield: {
                  ...prev.battlefield,
                  player: []
                },
                currentTurn: 'player',
                gameStatus: 'waiting'
              };
            });
            return;
          }
          
          setGameState(prev => ({
            ...prev,
            battlefield: {
              ...prev.battlefield,
              player: [updatedPlayerCard]
            },
            currentTurn: 'player',
            gameStatus: 'waiting'
          }));
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          setAttackingCard(null);
          setDefendingCard(null);
        }
        
        // If both cards survived, end combat and switch turns
        if (playerCard.hp > 0 && opponentCard.hp > 0) {
          setGameState(prev => ({
            ...prev,
            currentTurn: 'player',
            gameStatus: 'waiting'
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };
  
    processCombat();
  }, [gameState.battlefield.player, gameState.battlefield.opponent, gameState.gameStatus]);

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
      {/* Kill Counter Display */}
      <div className="kill-counter">
        <div className="kill-stat">
          <span className="kill-label">Player Kills:</span>
          <span className="kill-value">{killCount.player}</span>
        </div>
        <div className="kill-stat">
          <span className="kill-label">Opponent Kills:</span>
          <span className="kill-value">{killCount.opponent}</span>
        </div>
      </div>

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
              {gameState.battlefield.opponent.reduce((total, card) => total + card.hp, 0) + 
               gameState.players.opponent.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div 
                  className="hp-fill" 
                  style={{ 
                    width: `${(gameState.players.opponent.hp / gameState.opponentMaxHealth) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
                <span>{gameState.players.opponent.hp} Energy </span>
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
              {gameState.battlefield.player.reduce((total, card) => total + card.hp, 0) + 
               gameState.players.player.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div 
                  className="hp-fill" 
                  style={{ 
                    width: `${(gameState.players.player.hp / gameState.playerMaxHealth) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
                <span>{gameState.players.player.hp} Energy </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opponent Area */}
      <div className={`player-area opponent ${gameState.currentTurn === 'opponent' ? 'active-turn' : ''}`}>
        <div className="player-profile opponent-profile">
          <img 
            src={opponentInfo.avatar} 
            alt="Opponent" 
            className="profile-picture"
          />
          <span className="player-name">
            {opponentInfo.name}
            <span className={`turn-indicator ${gameState.currentTurn === 'opponent' ? 'active' : 'waiting'}`}>
              {gameState.currentTurn === 'opponent' ? 'Opponent Turn' : 'Waiting...'}
            </span>
          </span>
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
              isDefending={defendingCard === card.id}
              onAnimationEnd={() => {
                if (attackingCard === card.id) setAttackingCard(null);
                if (defendingCard === card.id) setDefendingCard(null);
              }}
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
              isDefending={defendingCard === card.id}
              onAnimationEnd={() => {
                if (attackingCard === card.id) setAttackingCard(null);
                if (defendingCard === card.id) setDefendingCard(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Player Area */}
      <div className={`player-area current-player ${gameState.currentTurn === 'player' ? 'active-turn' : ''}`}>
        <div className="player-profile">
          <img 
            src={playerInfo.avatar} 
            alt="Player" 
            className="profile-picture"
          />
          <span className="player-name">
            {playerInfo.name}
            <span className={`turn-indicator ${gameState.currentTurn === 'player' ? 'active' : 'waiting'}`}>
              {gameState.currentTurn === 'player' ? 'Player Turn' : 'Please Wait...'}
            </span>
          </span>
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