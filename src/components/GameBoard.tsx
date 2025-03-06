import React, { useState, useEffect } from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';
import '../styles/combat.css';
import '../styles/player.css';
import GameEndDialog from './GameEndDialog';
import { useDrop } from 'react-dnd';

// Monster images (ensure these match your asset paths)
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

interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: string;
}

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playerInfo: { name: string; avatar: string };
  opponentInfo: { name: string; avatar: string };
  combatLog: CombatLogEntry[];
  addCombatLogEntry: (message: string, type: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardPlay,
  setGameState,
  playerInfo,
  opponentInfo,
  combatLog,
  addCombatLogEntry
}) => {
  const [attackingCard, setAttackingCard] = useState<string | null>(null);
  const [defendingCard, setDefendingCard] = useState<string | null>(null);
  const [killCount, setKillCount] = useState<{ player: number; opponent: number }>({ player: 0, opponent: 0 });

  // Trigger attack/defense animations during combat
  useEffect(() => {
    if (gameState.battlefield.player.length > 0 && gameState.battlefield.opponent.length > 0) {
      const playerCard = gameState.battlefield.player[0];
      const opponentCard = gameState.battlefield.opponent[0];

      setAttackingCard(playerCard.id);
      setDefendingCard(opponentCard.id);

      setTimeout(() => {
        setAttackingCard(opponentCard.id);
        setDefendingCard(playerCard.id);
      }, 1000);
    } else {
      setAttackingCard(null);
      setDefendingCard(null);
    }
  }, [gameState.battlefield]);

  // Update kill count when cards are defeated
  useEffect(() => {
    const playerCard = gameState.battlefield.player[0];
    const opponentCard = gameState.battlefield.opponent[0];

    if (playerCard && playerCard.hp <= 0) {
      setKillCount(prev => ({ ...prev, opponent: prev.opponent + 1 }));
    }
    if (opponentCard && opponentCard.hp <= 0) {
      setKillCount(prev => ({ ...prev, player: prev.player + 1 }));
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

  const handleRestart = () => {
    setGameState({
      gameStatus: 'waiting',
      currentTurn: 'player',
      battlefield: { player: [], opponent: [] },
      players: {
        player: { id: 'player', hand: gameState.players.player.hand, hp: 300, deck: [] },
        opponent: { id: 'opponent', hand: gameState.players.opponent.hand, hp: 300, deck: [] }
      },
      playerHealth: 300,
      playerMaxHealth: 300,
      opponentHealth: 300,
      opponentMaxHealth: 300
    });
    setKillCount({ player: 0, opponent: 0 });
  };

  return (
    <div className="game-board">
      {gameState.gameStatus === 'finished' && (
        <GameEndDialog
          winner={gameState.players.opponent.hp <= 0 ? 'player' : 'opponent'}
          onRestart={handleRestart}
        />
      )}

      {/* Kill Counter */}
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

      {/* Health and Combat Stats */}
      <div className="health-summary-boxes">
        <div className="health-summary opponent-summary">
          <img src={opponentInfo.avatar} alt="Opponent" className="profile-picture" />
          <div className="summary-content">
            <div className="summary-title">OPPONENT CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.battlefield.opponent.reduce((total, card) => total + card.hp, 0) +
               gameState.players.opponent.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(gameState.players.opponent.hp / gameState.opponentMaxHealth) * 100}%` }}
                />
                <span>{gameState.players.opponent.hp} Energy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="health-summary player-summary">
          <img src={playerInfo.avatar} alt="Player" className="profile-picture" />
          <div className="summary-content">
            <div className="summary-title">PLAYER CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.battlefield.player.reduce((total, card) => total + card.hp, 0) +
               gameState.players.player.hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(gameState.players.player.hp / gameState.playerMaxHealth) * 100}%` }}
                />
                <span>{gameState.players.player.hp} Energy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="combat-stats-display">
          <div className="combat-stats-title">Combat Statistics</div>
          <div className="total-cards-info">
            <div className="player-cards-count">
              Player Total Cards: {gameState.players.player.hand.length + gameState.battlefield.player.length}
            </div>
            <div className="opponent-cards-count">
              Opponent Total Cards: {gameState.players.opponent.hand.length + gameState.battlefield.opponent.length}
            </div>
          </div>
          <div className="combat-stats-content">
            {gameState.battlefield.player.map(card => (
              <div key={card.id}>
                {card.name}: {card.hp}/{card.maxHp} HP, ATK: {card.attack}, DEF: {card.defense}
              </div>
            ))}
            {gameState.battlefield.opponent.map(card => (
              <div key={card.id}>
                {card.name}: {card.hp}/{card.maxHp} HP, ATK: {card.attack}, DEF: {card.defense}
              </div>
            ))}
            {combatLog.slice(-5).map((entry, index) => (
              <div key={index} className={`combat-log-entry ${entry.type}`}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opponent Area */}
      <div className={`player-area opponent ${gameState.currentTurn === 'opponent' ? 'active-turn' : ''}`}>
        <div className="player-profile opponent-profile">
          <img src={opponentInfo.avatar} alt="Opponent" className="profile-picture" />
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
        <div ref={dropRef as unknown as React.RefObject<HTMLDivElement>} className={`player-field ${isOver ? 'field-highlight' : ''}`}>
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
          <img src={playerInfo.avatar} alt="Player" className="profile-picture" />
          <span className="player-name">
            {playerInfo.name}
            <span className={`turn-indicator ${gameState.currentTurn === 'player' && gameState.battlefield.player.length === 0 ? 'active' : 'waiting'}`}>
              {gameState.currentTurn === 'player' && gameState.battlefield.player.length === 0 ? 'Your Turn' : 'Please Wait...'}
            </span>
          </span>
        </div>
        <div className="player-hand">
          {gameState.players.player.hand.map((card: CardType) => (
            <Card key={card.id} card={card} onClick={() => onCardPlay(card)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;