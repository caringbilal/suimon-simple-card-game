import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';
import '../styles/combat.css';
import '../styles/player.css';
import GameEndDialog from './GameEndDialog';
import { useDrop } from 'react-dnd';
import { Socket } from 'socket.io-client';

interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: string;
}

interface GameBoardProps {
  gameState: GameState;
  onCardPlay: (card: CardType) => void;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  playerInfo: { name: string; avatar: string };
  opponentInfo: { name: string; avatar: string };
  combatLog: CombatLogEntry[];
  addCombatLogEntry: (message: string, type: string) => void;
  killCount: { player: number; opponent: number };
  playerRole: 'player1' | 'player2';
  roomId: string | null;
  socket: Socket;
  onCardDefeated: (defeatedPlayerKey: 'player' | 'opponent') => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardPlay,
  setGameState,
  playerInfo,
  opponentInfo,
  combatLog,
  addCombatLogEntry,
  killCount,
  playerRole,
  roomId,
  socket,
  onCardDefeated,
}) => {
  const [attackingCard, setAttackingCard] = useState<string | null>(null);
  const [defendingCard, setDefendingCard] = useState<string | null>(null);

  // Determine player and opponent keys based on the player's role
  const playerKey = playerRole === 'player1' ? 'player' : 'opponent';
  const opponentKey = playerRole === 'player1' ? 'opponent' : 'player';

  // Handle combat between cards on the battlefield with sequential damage
  const handleCombat = () => {
    const currentPlayerKey = gameState.currentTurn;
    const opponentPlayerKey = currentPlayerKey === 'player' ? 'opponent' : 'player';

    const currentPlayerCard = gameState.battlefield[currentPlayerKey][0];
    const opponentCard = gameState.battlefield[opponentPlayerKey][0];

    if (!currentPlayerCard || !opponentCard) return;

    // Calculate damage
    const currentPlayerDamage = Math.max(1, currentPlayerCard.attack - opponentCard.defense);
    const opponentDamage = Math.max(1, opponentCard.attack - currentPlayerCard.defense);

    // Step 1: Apply damage to the opponent first
    opponentCard.hp -= currentPlayerDamage;
    const energyLossFactor = 5; // Adjust based on your game's balance
    const opponentEnergyLoss = Math.min(currentPlayerDamage * energyLossFactor, gameState.players[opponentPlayerKey].energy);
    const newOpponentEnergy = gameState.players[opponentPlayerKey].energy - opponentEnergyLoss;

    if (newOpponentEnergy <= 0) {
      // Opponent loses, game ends
      const updatedState: GameState = {
        ...gameState,
        players: {
          ...gameState.players,
          [opponentPlayerKey]: {
            ...gameState.players[opponentPlayerKey],
            energy: newOpponentEnergy,
          },
        },
        battlefield: {
          ...gameState.battlefield,
          [opponentPlayerKey]: opponentCard.hp > 0 ? [opponentCard] : [],
        },
        gameStatus: 'finished',
      };
      setGameState(updatedState);
      socket.emit('updateGameState', roomId, updatedState);
      return;
    }

    // Step 2: If opponent survives, apply damage to the current player
    currentPlayerCard.hp -= opponentDamage;
    const currentPlayerEnergyLoss = Math.min(opponentDamage * energyLossFactor, gameState.players[currentPlayerKey].energy);
    const newCurrentPlayerEnergy = gameState.players[currentPlayerKey].energy - currentPlayerEnergyLoss;

    if (newCurrentPlayerEnergy <= 0) {
      // Current player loses, game ends
      const updatedState: GameState = {
        ...gameState,
        players: {
          ...gameState.players,
          [currentPlayerKey]: {
            ...gameState.players[currentPlayerKey],
            energy: newCurrentPlayerEnergy,
          },
          [opponentPlayerKey]: {
            ...gameState.players[opponentPlayerKey],
            energy: newOpponentEnergy,
          },
        },
        battlefield: {
          ...gameState.battlefield,
          [currentPlayerKey]: currentPlayerCard.hp > 0 ? [currentPlayerCard] : [],
          [opponentPlayerKey]: opponentCard.hp > 0 ? [opponentCard] : [],
        },
        gameStatus: 'finished',
      };
      setGameState(updatedState);
      socket.emit('updateGameState', roomId, updatedState);
      return;
    }

    // Step 3: If neither loses, update battlefield and switch turn
    let updatedBattlefield = { ...gameState.battlefield };
    if (currentPlayerCard.hp <= 0) {
      updatedBattlefield[currentPlayerKey] = [];
      onCardDefeated(currentPlayerKey);
      addCombatLogEntry(`${currentPlayerCard.name} has been defeated!`, 'death');
    }
    if (opponentCard.hp <= 0) {
      updatedBattlefield[opponentPlayerKey] = [];
      onCardDefeated(opponentPlayerKey);
      addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
    }

    const updatedState: GameState = {
      ...gameState,
      players: {
        ...gameState.players,
        [currentPlayerKey]: {
          ...gameState.players[currentPlayerKey],
          energy: newCurrentPlayerEnergy,
        },
        [opponentPlayerKey]: {
          ...gameState.players[opponentPlayerKey],
          energy: newOpponentEnergy,
        },
      },
      battlefield: updatedBattlefield,
      currentTurn: opponentPlayerKey, // Switch turn
      gameStatus: 'playing',
    };

    addCombatLogEntry(`Player loses ${currentPlayerEnergyLoss} energy`, 'energy');
    addCombatLogEntry(`Opponent loses ${opponentEnergyLoss} energy`, 'energy');

    setGameState(updatedState);
    socket.emit('updateGameState', roomId, updatedState);
  };

  // Automatically trigger combat every 500ms if both players have cards on the battlefield
  useEffect(() => {
    const fightInterval = setInterval(() => {
      if (gameState.battlefield[playerKey].length > 0 && gameState.battlefield[opponentKey].length > 0) {
        handleCombat();
      }
    }, 500);

    return () => clearInterval(fightInterval);
  }, [gameState, playerRole]);

  // Handle combat animations
  useEffect(() => {
    if (gameState.battlefield[playerKey].length > 0 && gameState.battlefield[opponentKey].length > 0) {
      const playerCard = gameState.battlefield[playerKey][0];
      const opponentCard = gameState.battlefield[opponentKey][0];

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
  }, [gameState.battlefield, playerRole]);

  // Handle card drops onto the battlefield
  const [{ isOver }, dropRef] = useDrop<CardType, void, { isOver: boolean }>({
    accept: 'CARD',
    drop: (item) => {
      const isPlayerTurn = playerRole === 'player1' ? gameState.currentTurn === 'player' : gameState.currentTurn === 'opponent';
      if (isPlayerTurn) onCardPlay(item);
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Restart the game with a fresh state
  const handleRestart = () => {
    const newState: GameState = {
      gameStatus: 'waiting',
      currentTurn: 'player',
      battlefield: { player: [], opponent: [] },
      players: {
        player: {
          id: 'player1',
          hand: gameState.players.player.hand,
          deck: [],
          energy: 700,
        },
        opponent: {
          id: 'player2',
          hand: gameState.players.opponent.hand,
          deck: [],
          energy: 700,
        },
      },
      playerMaxHealth: 700,
      opponentMaxHealth: 700,
    };
    setGameState(newState);
    if (roomId) {
      socket.emit('updateGameState', roomId, newState);
    }
  };

  return (
    <div className="game-board">
      {gameState.gameStatus === 'finished' && (
        <GameEndDialog
          winner={gameState.players[playerKey].energy <= 0 ? opponentKey : playerKey}
          onRestart={handleRestart}
        />
      )}

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

      <div className="health-summary-boxes">
        <div className="health-summary opponent-summary">
          <img src={opponentInfo.avatar} alt="Opponent" className="profile-picture" />
          <div className="summary-content">
            <div className="summary-title">OPPONENT CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.battlefield[opponentKey].reduce((total, card) => total + card.hp, 0) +
                gameState.players[opponentKey].hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(gameState.players[opponentKey].energy / gameState.opponentMaxHealth) * 100}%` }}
                />
                <span>{gameState.players[opponentKey].energy} Energy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="health-summary player-summary">
          <img src={playerInfo.avatar} alt="Player" className="profile-picture" />
          <div className="summary-content">
            <div className="summary-title">PLAYER CARDS TOTAL HP</div>
            <div className="summary-value">
              {gameState.battlefield[playerKey].reduce((total, card) => total + card.hp, 0) +
                gameState.players[playerKey].hand.reduce((total, card) => total + card.hp, 0)}
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(gameState.players[playerKey].energy / gameState.playerMaxHealth) * 100}%` }}
                />
                <span>{gameState.players[playerKey].energy} Energy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="combat-stats-display">
          <div className="combat-stats-title">Combat Statistics</div>
          <div className="total-cards-info">
            <div className="player-cards-count">
              Player Total Cards: {gameState.players[playerKey].hand.length + gameState.battlefield[playerKey].length}
            </div>
            <div className="opponent-cards-count">
              Opponent Total Cards: {gameState.players[opponentKey].hand.length + gameState.battlefield[opponentKey].length}
            </div>
          </div>
          <div className="combat-stats-content">
            {combatLog.slice(-5).map((entry, index) => (
              <div key={index} className={`combat-log-entry ${entry.type}`}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`player-area opponent ${gameState.currentTurn === opponentKey ? 'active-turn' : ''}`}>
        <div className="player-profile opponent-profile">
          <img src={opponentInfo.avatar} alt="Opponent" className="profile-picture" />
          <span className="player-name">
            {opponentInfo.name}
            <span className={`turn-indicator ${gameState.currentTurn === opponentKey ? 'active' : 'waiting'}`}>
              {gameState.currentTurn === opponentKey ? 'Opponent Turn' : 'Waiting...'}
            </span>
          </span>
        </div>
        <div className="player-hand opponent-hand">
          {gameState.players[opponentKey].hand.map((card: CardType) => (
            <div key={card.id} className="card">
              <img src={cardBack} alt="Card Back" className="card-back-image" />
            </div>
          ))}
        </div>
      </div>

      <div className="battlefield">
        <div className="opponent-field">
          {gameState.battlefield[opponentKey].map((card: CardType) => (
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
          {gameState.battlefield[playerKey].map((card: CardType) => (
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

      <div className={`player-area current-player ${gameState.currentTurn === playerKey ? 'active-turn' : ''}`}>
        <div className="player-profile">
          <img src={playerInfo.avatar} alt="Player" className="profile-picture" />
          <span className="player-name">
            {playerInfo.name}
            <span className={`turn-indicator ${gameState.currentTurn === playerKey ? 'active' : 'waiting'}`}>
              {gameState.currentTurn === playerKey ? 'Your Turn' : 'Please Wait...'}
            </span>
          </span>
        </div>
        <div className="player-hand">
          {gameState.players[playerKey].hand.map((card: CardType) => (
            <Card key={card.id} card={card} onClick={() => onCardPlay(card)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;