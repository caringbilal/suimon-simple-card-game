import React, { useState, useEffect } from 'react';
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

const playerInfo = {
  name: "Player",
  avatar: PlayerProfile,
};

const opponentInfo = {
  name: "AI Opponent",
  avatar: AIPlayerProfile,
};

interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player: {
        id: 'player',
        hp: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp
        }))
      },
      opponent: {
        id: 'opponent',
        hp: 300,
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
    playerHealth: 300,
    playerMaxHealth: 300,
    opponentHealth: 300,
    opponentMaxHealth: 300
  });

  const [showInstructions, setShowInstructions] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  const addCombatLogEntry = (message: string, type: string = 'info') => {
    setCombatLog(prevLog => [
      ...prevLog,
      { timestamp: Date.now(), message, type }
    ]);
  };

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

          if (updatedPlayerCard.hp <= 0) {
            addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
            updatedBattlefield.player = [];
            const newPlayerHp = Math.max(0, prevState.players.player.hp - playerDamage);
            if (newPlayerHp <= 0) {
              return { ...prevState, gameStatus: 'finished', players: { ...prevState.players, player: { ...prevState.players.player, hp: newPlayerHp } } };
            }
          } else {
            updatedBattlefield.player = [updatedPlayerCard];
          }

          if (updatedOpponentCard.hp <= 0) {
            addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
            updatedBattlefield.opponent = [];
            const newOpponentHp = Math.max(0, prevState.players.opponent.hp - opponentDamage);
            if (newOpponentHp <= 0) {
              return { ...prevState, gameStatus: 'finished', players: { ...prevState.players, opponent: { ...prevState.players.opponent, hp: newOpponentHp } } };
            }
          } else {
            updatedBattlefield.opponent = [updatedOpponentCard];
          }

          return {
            ...prevState,
            battlefield: updatedBattlefield,
            players: {
              ...prevState.players,
              player: { ...prevState.players.player, hp: updatedPlayerCard.hp <= 0 ? Math.max(0, prevState.players.player.hp - playerDamage) : prevState.players.player.hp },
              opponent: { ...prevState.players.opponent, hp: updatedOpponentCard.hp <= 0 ? Math.max(0, prevState.players.opponent.hp - opponentDamage) : prevState.players.opponent.hp }
            }
          };
        }
        return prevState;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleCardPlay = (card: CardType) => {
    if (gameState.currentTurn !== 'player' || gameState.battlefield.player.length > 0) return;

    setGameState(prevState => {
      const updatedPlayerHand = prevState.players.player.hand.filter(c => c.id !== card.id);
      const updatedPlayerBattlefield = [card];

      const gameAI = new GameAI();
      const opponentHand = prevState.players.opponent.hand;
      const aiCard = gameAI.decideMove(opponentHand, updatedPlayerBattlefield);
      const updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);
      let updatedBattlefield = {
        player: updatedPlayerBattlefield,
        opponent: [aiCard]
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
          player: { ...prevState.players.player, hand: finalPlayerHand },
          opponent: { ...prevState.players.opponent, hand: finalOpponentHand }
        },
        battlefield: updatedBattlefield,
        currentTurn: 'player',
        gameStatus: 'playing'
      };
    });
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
                    <li>Each player starts with 300 HP and 4 cards</li>
                    <li>Players play one card at a time to the battlefield</li>
                    <li>Cards fight automatically until one is defeated:</li>
                    <li>- Damage dealt = Attacker's Attack - Defender's Defense (minimum 1)</li>
                    <li>- Cards battle every few seconds</li>
                    <li>- When a card's HP reaches 0, it's removed and its owner takes damage</li>
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
                    <li>Strategic card placement is key - balance Attack and Defense</li>
                    <li>Protect your HP with strong defenders</li>
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
              isVictory={gameState.players.opponent.hp <= 0}
              playerHealth={gameState.players.player.hp}
              opponentHealth={gameState.players.opponent.hp}
              onPlayAgain={() => {
                setGameState({
                  players: {
                    player: {
                      id: 'player',
                      hp: 300,
                      deck: [],
                      hand: getInitialHand(4)
                    },
                    opponent: {
                      id: 'opponent',
                      hp: 300,
                      deck: [],
                      hand: getInitialHand(4)
                    }
                  },
                  battlefield: {
                    player: [],
                    opponent: []
                  },
                  currentTurn: 'player',
                  gameStatus: 'waiting',
                  playerHealth: 300,
                  playerMaxHealth: 300,
                  opponentHealth: 300,
                  opponentMaxHealth: 300
                });
                setCombatLog([]);
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
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;