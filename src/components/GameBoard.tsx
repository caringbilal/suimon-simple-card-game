import React, { useState, useEffect } from 'react';
import { GameState, CardType } from '../types/game';
import Card from './Card';
import cardBack from '../assets/ui/card-back.png';
import '../styles/combat.css';
import '../styles/player.css';
import GameEndDialog from './GameEndDialog';
import { useDrop } from 'react-dnd';

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
  killCount: { player: number; opponent: number };
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardPlay,
  setGameState,
  playerInfo,
  opponentInfo,
  combatLog,
  addCombatLogEntry,
  killCount
}) => {
  const [attackingCard, setAttackingCard] = useState<string | null>(null);
  const [defendingCard, setDefendingCard] = useState<string | null>(null);

  // Combat logic: Handle the fight between player and opponent cards
  const handleCombat = () => {
    const playerCard = gameState.battlefield.player[0];
    const opponentCard = gameState.battlefield.opponent[0];

    if (!playerCard || !opponentCard) return;

    // Calculate damage (minimum 1 damage)
    const playerDamage = Math.max(1, playerCard.attack - opponentCard.defense);
    const opponentDamage = Math.max(1, opponentCard.attack - playerCard.defense);

    // Update card HP
    playerCard.hp -= opponentDamage;
    opponentCard.hp -= playerDamage;

    // Proportional energy loss (e.g., 5 energy per damage point)
    const energyLossFactor = 5;
    const playerEnergyLoss = Math.min(opponentDamage * energyLossFactor, gameState.players.player.energy);
    const opponentEnergyLoss = Math.min(playerDamage * energyLossFactor, gameState.players.opponent.energy);

    // Update game state
    setGameState((prevState) => {
      let updatedPlayerHP = prevState.players.player.hp;
      let updatedOpponentHP = prevState.players.opponent.hp;

      if (playerCard.hp <= 0) {
        updatedPlayerHP = Math.max(0, updatedPlayerHP - 50); // Player loses 50 HP when their card is defeated
        addCombatLogEntry(`Player loses 50 HP due to card defeat`, 'hp');
      }
      if (opponentCard.hp <= 0) {
        updatedOpponentHP = Math.max(0, updatedOpponentHP - 50); // Opponent loses 50 HP when their card is defeated
        addCombatLogEntry(`Opponent loses 50 HP due to card defeat`, 'hp');
      }

      return {
        ...prevState,
        players: {
          ...prevState.players,
          player: {
            ...prevState.players.player,
            energy: prevState.players.player.energy - playerEnergyLoss,
            hp: updatedPlayerHP,
          },
          opponent: {
            ...prevState.players.opponent,
            energy: prevState.players.opponent.energy - opponentEnergyLoss,
            hp: updatedOpponentHP,
          },
        },
        battlefield: {
          player: playerCard.hp > 0 ? [playerCard] : [],
          opponent: opponentCard.hp > 0 ? [opponentCard] : [],
        },
      };
    });

    // Log energy changes
    addCombatLogEntry(`Player loses ${playerEnergyLoss} energy`, 'energy');
    addCombatLogEntry(`Opponent loses ${opponentEnergyLoss} energy`, 'energy');
  };

  // Fight interval set to 500ms for testing
  useEffect(() => {
    const fightInterval = setInterval(() => {
      if (gameState.battlefield.player.length > 0 && gameState.battlefield.opponent.length > 0) {
        handleCombat();
      }
    }, 500); // 0.5 seconds for testing (change to 2000 for normal gameplay)

    return () => clearInterval(fightInterval);
  }, [gameState]);

  // Animation logic for attacking and defending cards
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
      gameStatus: "waiting",
      currentTurn: "player",
      battlefield: { player: [], opponent: [] },
      players: {
        player: {
          id: "player",
          hand: gameState.players.player.hand, // Or reset to initial hand if desired
          hp: 300,
          deck: [],
          energy: 300
        },
        opponent: {
          id: "opponent",
          hand: gameState.players.opponent.hand, // Or reset to initial hand if desired
          hp: 300,
          deck: [],
          energy: 300
        }
      },
      playerMaxHealth: 300,
      opponentMaxHealth: 300
    });
  };

  return (
    <div className="game-board">
      {gameState.gameStatus === 'finished' && (
        <GameEndDialog
          winner={gameState.players.opponent.hp <= 0 ? 'player' : 'opponent'}
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
            {combatLog.slice(-5).map((entry, index) => (
              <div key={index} className={`combat-log-entry ${entry.type}`}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>

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