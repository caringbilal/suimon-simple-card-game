import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';
import Dialog from './components/Dialog';
import { GameState, CardType } from './types/game';
import { getInitialHand } from './data/monsters';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameAI } from './utils/gameAI';
import AIPlayerProfile from './assets/ui/AIPlayer_Profile.jpg';
import PlayerProfile from './assets/ui/Player_Profile.jpg';

// Player and opponent info constants
const playerInfo = {
  name: "Player",
  avatar: PlayerProfile,
};

const opponentInfo = {
  name: "AI Opponent",
  avatar: AIPlayerProfile,
};

// Interface for combat log entries
interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: string;
}

function App() {
  // Initial game state
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player: {
        id: 'player',
        hp: 300,
        energy: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp
        }))
      },
      opponent: {
        id: 'opponent',
        hp: 300,
        energy: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp
        }))
      }
    },
    battlefield: {
      player: [],
      opponent: []
    },
    currentTurn: 'player',
    gameStatus: 'waiting',
    playerMaxHealth: 300,
    opponentMaxHealth: 300
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [killCount, setKillCount] = useState({ player: 0, opponent: 0 });
  const [roundCounter, setRoundCounter] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);

  const MAX_ROUNDS = 20; // Maximum game duration
  const MAX_ENERGY_DRAIN = 10; // Cap on energy drain per round

  // Memoized function to add combat log entries
  const addCombatLogEntry = useCallback((message: string, type: string = 'info') => {
    setCombatLog(prevLog => [
      ...prevLog,
      { timestamp: Date.now(), message, type }
    ]);
  }, []);

  // AI play handler with explicit return type
  const handleAIPlay = (currentState: GameState): GameState => {
    const gameAI = new GameAI();
    const opponentHand = currentState.players.opponent.hand;
    const playerBattlefield = currentState.battlefield.player;

    if (opponentHand.length > 0) {
      const aiCard = gameAI.decideMove(opponentHand, playerBattlefield);
      if (aiCard) {
        const updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);
        const updatedOpponentBattlefield = [aiCard];

        const opponentTotal = updatedOpponentBattlefield.length + updatedOpponentHand.length;
        const opponentCardsToDraw = Math.max(0, 4 - opponentTotal);
        const newOpponentCards = getInitialHand(opponentCardsToDraw);
        const finalOpponentHand = [...updatedOpponentHand, ...newOpponentCards];

        return {
          ...currentState,
          players: {
            ...currentState.players,
            opponent: { ...currentState.players.opponent, hand: finalOpponentHand }
          },
          battlefield: {
            ...currentState.battlefield,
            opponent: updatedOpponentBattlefield
          },
          currentTurn: 'player', // Switch to player after AI plays
          gameStatus: 'playing'
        };
      }
    }
    // If no card is played, switch to player's turn
    return { ...currentState, currentTurn: 'player' };
  };

  // Combat logic in useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prevState => {
        if (
          prevState.battlefield.player.length > 0 &&
          prevState.battlefield.opponent.length > 0 &&
          prevState.gameStatus === 'playing'
        ) {
          const playerCard = prevState.battlefield.player[0];
          const opponentCard = prevState.battlefield.opponent[0];

          const playerDamage = Math.max(1, playerCard.attack - opponentCard.defense);
          const opponentDamage = Math.max(1, opponentCard.attack - playerCard.defense);

          addCombatLogEntry(`${playerCard.name} deals ${playerDamage} damage to ${opponentCard.name}`, 'attack');
          addCombatLogEntry(`${opponentCard.name} deals ${opponentDamage} damage to ${playerCard.name}`, 'attack');

          const updatedPlayerCard = { ...playerCard, hp: playerCard.hp - opponentDamage };
          const updatedOpponentCard = { ...opponentCard, hp: opponentCard.hp - playerDamage };
          let updatedBattlefield = { ...prevState.battlefield };
          let playerHP = prevState.players.player.hp;
          let opponentHP = prevState.players.opponent.hp;
          let playerEnergy = prevState.players.player.energy;
          let opponentEnergy = prevState.players.opponent.energy;

          // Drain energy based on damage difference
          const damageDifference = opponentDamage - playerDamage;
          if (damageDifference > 0) {
            const energyDrain = Math.min(damageDifference, MAX_ENERGY_DRAIN);
            playerEnergy = Math.max(0, playerEnergy - energyDrain);
            addCombatLogEntry(`Player loses ${energyDrain} energy due to damage difference`, 'energy');
          } else if (damageDifference < 0) {
            const energyDrain = Math.min(-damageDifference, MAX_ENERGY_DRAIN);
            opponentEnergy = Math.max(0, opponentEnergy - energyDrain);
            addCombatLogEntry(`Opponent loses ${energyDrain} energy due to damage difference`, 'energy');
          }

          // Handle card defeat and HP drain
          if (updatedPlayerCard.hp <= 0) {
            addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
            updatedBattlefield.player = [];
            playerHP = Math.max(0, playerHP - updatedOpponentCard.hp);
            addCombatLogEntry(`Player loses ${updatedOpponentCard.hp} HP due to card defeat`, 'hp');
            setKillCount(prev => ({ ...prev, opponent: prev.opponent + 1 }));
          } else {
            updatedBattlefield.player = [updatedPlayerCard];
          }

          if (updatedOpponentCard.hp <= 0) {
            addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
            updatedBattlefield.opponent = [];
            opponentHP = Math.max(0, opponentHP - updatedPlayerCard.hp);
            addCombatLogEntry(`Opponent loses ${updatedPlayerCard.hp} HP due to card defeat`, 'hp');
            setKillCount(prev => ({ ...prev, player: prev.player + 1 }));
          } else {
            updatedBattlefield.opponent = [updatedOpponentCard];
          }

          setRoundCounter(prev => prev + 1);
          setTotalRounds(prev => prev + 1);

          // Fatigue: drain energy after 5 rounds
          if (roundCounter >= 5) {
            playerEnergy = Math.max(0, playerEnergy - 5);
            opponentEnergy = Math.max(0, opponentEnergy - 5);
            addCombatLogEntry(`Both players lose 5 energy due to fatigue`, 'energy');
            setRoundCounter(0);
          }

          // Determine game status
          const gameStatus: GameState['gameStatus'] = playerHP <= 0 || opponentHP <= 0 ? 'finished' : 'playing';
          if (totalRounds >= MAX_ROUNDS) {
            addCombatLogEntry(`Game ends due to maximum rounds reached!`, 'info');
            return {
              ...prevState,
              battlefield: updatedBattlefield,
              players: {
                ...prevState.players,
                player: { ...prevState.players.player, hp: playerHP, energy: playerEnergy },
                opponent: { ...prevState.players.opponent, hp: opponentHP, energy: opponentEnergy }
              },
              gameStatus: 'finished',
              currentTurn: prevState.currentTurn
            };
          }

          const baseNewState: GameState = {
            ...prevState,
            battlefield: updatedBattlefield,
            players: {
              ...prevState.players,
              player: { ...prevState.players.player, hp: playerHP, energy: playerEnergy },
              opponent: { ...prevState.players.opponent, hp: opponentHP, energy: opponentEnergy }
            },
            gameStatus,
            currentTurn: updatedBattlefield.player.length === 0 ? 'player' : prevState.currentTurn // Force player turn if their battlefield is empty
          };

          if (updatedBattlefield.opponent.length === 0 && prevState.players.opponent.hand.length > 0) {
            return handleAIPlay(baseNewState);
          }
          return baseNewState;
        } else if (
          prevState.battlefield.opponent.length === 0 &&
          prevState.players.opponent.hand.length > 0 &&
          prevState.gameStatus === 'playing'
        ) {
          return handleAIPlay(prevState);
        }
        return prevState;
      });
    }, 500); // 500ms for testing, revert to 2000ms for normal gameplay

    return () => clearInterval(interval);
  }, [roundCounter, totalRounds, addCombatLogEntry]);

  // Handle player card play
  const handleCardPlay = (card: CardType) => {
    if (gameState.currentTurn !== 'player' || gameState.battlefield.player.length > 0) return;

    setGameState(prevState => {
      const updatedPlayerHand = prevState.players.player.hand.filter(c => c.id !== card.id);
      const updatedPlayerBattlefield = [card];

      const gameAI = new GameAI();
      const opponentHand = prevState.players.opponent.hand;
      let updatedOpponentHand = opponentHand;
      let updatedOpponentBattlefield = prevState.battlefield.opponent;

      if (updatedOpponentBattlefield.length === 0 && opponentHand.length > 0) {
        const aiCard = gameAI.decideMove(opponentHand, updatedPlayerBattlefield);
        updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);
        updatedOpponentBattlefield = [aiCard];
      }

      const updatedBattlefield = {
        player: updatedPlayerBattlefield,
        opponent: updatedOpponentBattlefield
      };

      const playerTotal = updatedBattlefield.player.length + updatedPlayerHand.length;
      const opponentTotal = updatedBattlefield.opponent.length + updatedOpponentHand.length;
      const playerCardsToDraw = Math.max(0, 4 - playerTotal);
      const opponentCardsToDraw = Math.max(0, 4 - opponentTotal);

      const newPlayerCards = getInitialHand(playerCardsToDraw);
      const newOpponentCards = getInitialHand(opponentCardsToDraw);

      const finalPlayerHand = [...updatedPlayerHand, ...newPlayerCards];
      const finalOpponentHand = [...updatedOpponentHand, ...newOpponentCards];

      return {
        ...prevState,
        players: {
          ...prevState.players,
          player: { ...prevState.players.player, hand: finalPlayerHand },
          opponent: { ...prevState.players.opponent, hand: finalOpponentHand }
        },
        battlefield: updatedBattlefield,
        currentTurn: updatedBattlefield.opponent.length > 0 ? 'opponent' : 'player',
        gameStatus: 'playing'
      };
    });
    setRoundCounter(0);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="background-rectangle" />
        <div className="game-container">
          <button
            className="instructions-button"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
          </button>

          {showInstructions && (
            <div className="instructions-dialog">
              <div className="instructions-content">
                <h2>How to Play Suimon Card Battle</h2>
                <div className="instruction-section">
                  <h3>Game Overview</h3>
                  <p>Suimon Card Battle is a strategic card game where you battle against an AI opponent using unique monster cards with Attack, Defense, and HP stats.</p>
                </div>
                <div className="instruction-section">
                  <h3>Card Combat System</h3>
                  <ul>
                    <li>Each player starts with 300 HP, 300 Energy, and 4 cards</li>
                    <li>Players play one card at a time to the battlefield</li>
                    <li>Cards fight automatically until one is defeated:</li>
                    <li>- Damage dealt = Math.max(1, Attacker's Attack - Defender's Defense)</li>
                    <li>- Energy drains based on damage difference</li>
                    <li>- HP drains when a card is defeated</li>
                    <li>- Fatigue drains 5 energy after 5 rounds</li>
                  </ul>
                </div>
                <div className="instruction-section">
                  <h3>Card Management</h3>
                  <ul>
                    <li>Players maintain 4 cards total (hand + battlefield)</li>
                    <li>New cards are drawn automatically when needed</li>
                    <li>Each card shows its current HP percentage and stats</li>
                  </ul>
                </div>
                <div className="instruction-section">
                  <h3>Winning the Game</h3>
                  <ul>
                    <li>Reduce your opponent's HP to 0 to win</li>
                    <li>After 20 rounds, the player with more HP wins</li>
                    <li>Strategic card placement is key - balance Attack and Defense</li>
                  </ul>
                </div>
                <button
                  className="close-instructions"
                  onClick={() => setShowInstructions(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {gameState.gameStatus === 'finished' ? (
            <GameOver
              isVictory={
                gameState.players.opponent.hp <= 0 ||
                (totalRounds >= MAX_ROUNDS && gameState.players.player.hp > gameState.players.opponent.hp)
              }
              playerHP={gameState.players.player.hp}
              opponentHP={gameState.players.opponent.hp}
              onPlayAgain={() => {
                setGameState({
                  players: {
                    player: {
                      id: 'player',
                      hp: 300,
                      energy: 300,
                      deck: [],
                      hand: getInitialHand(4).map(card => ({
                        ...card,
                        maxHp: card.maxHp || card.hp
                      }))
                    },
                    opponent: {
                      id: 'opponent',
                      hp: 300,
                      energy: 300,
                      deck: [],
                      hand: getInitialHand(4).map(card => ({
                        ...card,
                        maxHp: card.maxHp || card.hp
                      }))
                    }
                  },
                  battlefield: {
                    player: [],
                    opponent: []
                  },
                  currentTurn: 'player',
                  gameStatus: 'waiting',
                  playerMaxHealth: 300,
                  opponentMaxHealth: 300
                });
                setCombatLog([]);
                setKillCount({ player: 0, opponent: 0 });
                setRoundCounter(0);
                setTotalRounds(0);
              }}
            />
          ) : (
            <GameBoard
              gameState={gameState}
              onCardPlay={handleCardPlay}
              setGameState={setGameState}
              playerInfo={playerInfo}
              opponentInfo={opponentInfo}
              combatLog={combatLog}
              addCombatLogEntry={addCombatLogEntry}
              killCount={killCount}
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;

// game.js remains unchanged as it’s not integrated into the React app
// game.ts remains unchanged as it matches the current structure

// GameOver.tsx remains unchanged as it’s functioning correctly