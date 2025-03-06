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
        energy: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp
        }))
      },
      opponent: {
        id: 'opponent',
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
  const [combatRoundsPerCard, setCombatRoundsPerCard] = useState({ player: 0, opponent: 0 });

  // Game constants
  const MAX_ROUNDS = 50;
  const MAX_ENERGY_DRAIN = 3; // Reduced from 10 to slow energy drain
  const ENERGY_LOSS_PER_CARD_DEFEAT = 5; // Fixed energy loss on card defeat

  // Memoized function to add combat log entries
  const addCombatLogEntry = useCallback((message: string, type: string = 'info') => {
    setCombatLog(prevLog => [
      ...prevLog,
      { timestamp: Date.now(), message, type }
    ]);
  }, []);

  // AI play handler
  const handleAIPlay = (currentState: GameState): GameState => {
    const opponentHand = currentState.players.opponent.hand;
    if (opponentHand.length > 0) {
      const aiCard = opponentHand[0]; // Simplified AI: plays the first card
      const updatedHand = opponentHand.slice(1);
      const updatedBattlefield = { ...currentState.battlefield, opponent: [aiCard] };

      return {
        ...currentState,
        players: {
          ...currentState.players,
          opponent: { ...currentState.players.opponent, hand: updatedHand },
        },
        battlefield: updatedBattlefield,
        currentTurn: 'player',
      };
    }
    return { ...currentState, currentTurn: 'player' };
  };

  // Combat logic in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    setGameState((prevState: GameState): GameState => {
      // Stop updates if game is not playing
      if (prevState.gameStatus !== 'playing') return prevState;

      let updatedBattlefield = { ...prevState.battlefield };
      let playerEnergy = prevState.players.player.energy;
      let opponentEnergy = prevState.players.opponent.energy;
      let combatOccurred = false;

      if (
        updatedBattlefield.player.length > 0 &&
        updatedBattlefield.opponent.length > 0
      ) {
        const playerCard = updatedBattlefield.player[0];
        const opponentCard = updatedBattlefield.opponent[0];

        const playerDamage = Math.max(1, playerCard.attack - opponentCard.defense);
        const opponentDamage = Math.max(1, opponentCard.attack - playerCard.defense);

        addCombatLogEntry(`${playerCard.name} deals ${playerDamage} damage to ${opponentCard.name}`, 'attack');
        addCombatLogEntry(`${opponentCard.name} deals ${opponentDamage} damage to ${playerCard.name}`, 'attack');

        const updatedPlayerCard = { ...playerCard, hp: playerCard.hp - opponentDamage };
        const updatedOpponentCard = { ...opponentCard, hp: opponentCard.hp - playerDamage };

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

        // Increment combat rounds for each card
        setCombatRoundsPerCard(prev => ({
          player: prev.player + 1,
          opponent: prev.opponent + 1
        }));

        // Handle card defeat with fixed energy loss
        if (updatedPlayerCard.hp <= 0) {
          addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
          updatedBattlefield.player = [];
          playerEnergy = Math.max(0, playerEnergy - ENERGY_LOSS_PER_CARD_DEFEAT);
          addCombatLogEntry(`Player loses ${ENERGY_LOSS_PER_CARD_DEFEAT} energy due to card defeat`, 'energy');
          setKillCount(prev => ({ ...prev, opponent: prev.opponent + 1 }));
          setCombatRoundsPerCard(prev => ({ ...prev, player: 0 }));
        } else {
          updatedBattlefield.player = [updatedPlayerCard];
        }

        if (updatedOpponentCard.hp <= 0) {
          addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
          updatedBattlefield.opponent = [];
          opponentEnergy = Math.max(0, opponentEnergy - ENERGY_LOSS_PER_CARD_DEFEAT);
          addCombatLogEntry(`Opponent loses ${ENERGY_LOSS_PER_CARD_DEFEAT} energy due to card defeat`, 'energy');
          setKillCount(prev => ({ ...prev, player: prev.player + 1 }));
          setCombatRoundsPerCard(prev => ({ ...prev, opponent: 0 }));
        } else {
          updatedBattlefield.opponent = [updatedOpponentCard];
        }

        // Increment rounds when combat occurs
        if (playerDamage > 0 || opponentDamage > 0) {
          combatOccurred = true;
          setRoundCounter(prev => prev + 1);
          setTotalRounds(prev => prev + 1);
        }

        // Fatigue: drain energy every 10 rounds
        if (roundCounter >= 10) {
          playerEnergy = Math.max(0, playerEnergy - 3);
          opponentEnergy = Math.max(0, opponentEnergy - 3);
          addCombatLogEntry(`Both players lose 3 energy due to fatigue`, 'energy');
          setRoundCounter(0);
        }
      }

      // Determine game status based solely on energy or max rounds
      const gameStatus: 'waiting' | 'playing' | 'finished' = 
        playerEnergy <= 0 || opponentEnergy <= 0 || totalRounds >= MAX_ROUNDS ? 'finished' : 'playing';

      const newState: GameState = {
        ...prevState,
        battlefield: updatedBattlefield,
        players: {
          ...prevState.players,
          player: { ...prevState.players.player, energy: playerEnergy },
          opponent: { ...prevState.players.opponent, energy: opponentEnergy },
        },
        gameStatus,
        currentTurn: prevState.currentTurn,
        playerMaxHealth: prevState.playerMaxHealth,
        opponentMaxHealth: prevState.opponentMaxHealth,
      };

      // Turn switching logic
      if (updatedBattlefield.player.length === 0) {
        newState.currentTurn = 'player';
      } else if (updatedBattlefield.opponent.length === 0 && prevState.players.opponent.hand.length > 0) {
        return handleAIPlay(newState);
      } else if (prevState.currentTurn === 'opponent' && updatedBattlefield.opponent.length === 0) {
        newState.currentTurn = 'player';
      }

      // Debug energy updates after each tick
      console.log(`Combat Tick: Player Energy=${playerEnergy}, Opponent Energy=${opponentEnergy}, Total Rounds=${totalRounds}`);

      return newState;
    });
  }, 500); // Combat tick every 500ms

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

  // Calculate victory and tie conditions
  const isVictory = gameState.players.opponent.energy <= 0 || 
                   (totalRounds >= MAX_ROUNDS && gameState.players.player.energy > gameState.players.opponent.energy);
  const isTie = totalRounds >= MAX_ROUNDS && gameState.players.player.energy === gameState.players.opponent.energy;

  // Debug game end conditions
  if (gameState.gameStatus === 'finished') {
    console.log(`Game ended. isVictory: ${isVictory}, isTie: ${isTie}, playerEnergy: ${gameState.players.player.energy}, opponentEnergy: ${gameState.players.opponent.energy}, totalRounds: ${totalRounds}`);
  }

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
                    <li>Each player starts with 300 Energy and 4 cards</li>
                    <li>Players play one card at a time to the battlefield</li>
                    <li>Cards fight automatically until one is defeated:</li>
                    <li>- Damage dealt = Math.max(1, Attacker's Attack - Defender's Defense)</li>
                    <li>- Energy drains based on damage difference (max 3 per tick)</li>
                    <li>- Energy drains 5 when a card is defeated</li>
                    <li>- Fatigue drains 3 energy every 10 combat rounds</li>
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
                    <li>Reduce your opponent's energy to 0 to win</li>
                    <li>After 50 combat rounds, the player with more energy wins, or it’s a tie if equal</li>
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
              isVictory={isVictory}
              isTie={isTie}
              playerEnergy={gameState.players.player.energy}
              opponentEnergy={gameState.players.opponent.energy}
              onPlayAgain={() => {
                setGameState({
                  players: {
                    player: {
                      id: 'player',
                      energy: 300,
                      deck: [],
                      hand: getInitialHand(4).map(card => ({
                        ...card,
                        maxHp: card.maxHp || card.hp
                      }))
                    },
                    opponent: {
                      id: 'opponent',
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
                setCombatRoundsPerCard({ player: 0, opponent: 0 });
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