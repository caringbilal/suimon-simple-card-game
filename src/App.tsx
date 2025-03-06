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
  const [killCount, setKillCount] = useState({ player: 0, opponent: 0 });
  const [roundCounter, setRoundCounter] = useState(0); // Track rounds for fatigue

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

          // Calculate damage with minimum of 1
          const playerDamage = Math.max(1, playerCard.attack - opponentCard.defense);
          const opponentDamage = Math.max(1, opponentCard.attack - playerCard.defense);

          addCombatLogEntry(`${playerCard.name} deals ${playerDamage} damage to ${opponentCard.name}`, 'attack');
          addCombatLogEntry(`${opponentCard.name} deals ${opponentDamage} damage to ${playerCard.name}`, 'attack');

          const updatedPlayerCard = { ...playerCard, hp: playerCard.hp - opponentDamage };
          const updatedOpponentCard = { ...opponentCard, hp: opponentCard.hp - playerDamage };
          let updatedBattlefield = { ...prevState.battlefield };
          let playerHP = prevState.players.player.hp;
          let opponentHP = prevState.players.opponent.hp;

          // Energy drain based on damage difference
          const damageDifference = opponentDamage - playerDamage;
          if (damageDifference > 0) {
            playerHP = Math.max(0, playerHP - damageDifference);
            addCombatLogEntry(`Player loses ${damageDifference} energy due to damage difference`, 'energy');
          } else if (damageDifference < 0) {
            opponentHP = Math.max(0, opponentHP + damageDifference); // + because difference is negative
            addCombatLogEntry(`Opponent loses ${-damageDifference} energy due to damage difference`, 'energy');
          }

          // Update battlefield
          if (updatedPlayerCard.hp <= 0) {
            addCombatLogEntry(`${playerCard.name} has been defeated!`, 'death');
            updatedBattlefield.player = [];
            playerHP = Math.max(0, playerHP - updatedOpponentCard.hp);
            addCombatLogEntry(`Player loses ${updatedOpponentCard.hp} energy due to card defeat`, 'energy');
            setKillCount(prev => ({ ...prev, opponent: prev.opponent + 1 }));
          } else {
            updatedBattlefield.player = [updatedPlayerCard];
          }

          if (updatedOpponentCard.hp <= 0) {
            addCombatLogEntry(`${opponentCard.name} has been defeated!`, 'death');
            updatedBattlefield.opponent = [];
            opponentHP = Math.max(0, opponentHP - updatedPlayerCard.hp);
            addCombatLogEntry(`Opponent loses ${updatedPlayerCard.hp} energy due to card defeat`, 'energy');
            setKillCount(prev => ({ ...prev, player: prev.player + 1 }));
          } else {
            updatedBattlefield.opponent = [updatedOpponentCard];
          }

          // Fatigue mechanism: after 5 rounds, both lose 5 energy
          setRoundCounter(prev => prev + 1);
          if (roundCounter >= 5) {
            playerHP = Math.max(0, playerHP - 5);
            opponentHP = Math.max(0, opponentHP - 5);
            addCombatLogEntry(`Both players lose 5 energy due to fatigue`, 'energy');
            setRoundCounter(0); // Reset round counter after fatigue
          }

          const gameStatus = playerHP <= 0 || opponentHP <= 0 ? 'finished' : 'playing';
          const newTurn = updatedBattlefield.player.length === 0 || updatedBattlefield.opponent.length === 0 ? 'player' : prevState.currentTurn;

          return {
            ...prevState,
            battlefield: updatedBattlefield,
            players: {
              ...prevState.players,
              player: { ...prevState.players.player, hp: playerHP },
              opponent: { ...prevState.players.opponent, hp: opponentHP }
            },
            currentTurn: newTurn,
            gameStatus,
            playerHealth: playerHP,
            opponentHealth: opponentHP
          };
        }
        return prevState;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [roundCounter]);

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
          player: { ...prevState.players.player, hand: finalPlayerHand },
          opponent: { ...prevState.players.opponent, hand: finalOpponentHand }
        },
        battlefield: updatedBattlefield,
        currentTurn: 'player',
        gameStatus: 'playing'
      };
    });
    setRoundCounter(0); // Reset round counter when a new card is played
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
                    <li>- Damage dealt = Math.max(1, Attacker's Attack - Defender's Defense)</li>
                    <li>- Energy drains based on damage difference and card defeats</li>
                    <li>- Fatigue applies after 5 rounds of battle</li>
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
                setKillCount({ player: 0, opponent: 0 });
                setRoundCounter(0); // Reset round counter
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