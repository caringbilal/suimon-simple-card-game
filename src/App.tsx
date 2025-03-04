import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
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

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player: {
        id: 'player',
        hp: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp // Ensure maxHp is set
        }))
      },
      opponent: {
        id: 'opponent',
        hp: 300,
        deck: [],
        hand: getInitialHand(4).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp // Ensure maxHp is set
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

  const handleCombat = (attackingCard: CardType, defendingCard: CardType) => {
    const damage = Math.max(0, attackingCard.attack - defendingCard.defense);
    const updatedCard = {
      ...defendingCard,
      hp: Math.max(0, defendingCard.hp - damage)
    };

    let newPlayerHP = gameState.players.player.hp;
    let newOpponentHP = gameState.players.opponent.hp;

    // Update player HP based on damage and show visual feedback
    setGameState(prev => {
      const playerCard = prev.battlefield.player[0];
      const opponentCard = prev.battlefield.opponent[0];
      newPlayerHP = Math.max(0, prev.players.player.hp - 
        (playerCard && defendingCard.id === playerCard.id ? damage : 0));
      newOpponentHP = Math.max(0, prev.players.opponent.hp - 
        (opponentCard && defendingCard.id === opponentCard.id ? damage : 0));

      // Add visual feedback for HP changes
      const playerHPBar = document.querySelector('.player-area .hp-fill') as HTMLElement;
      const opponentHPBar = document.querySelector('.opponent-area .hp-fill') as HTMLElement;

      if (playerHPBar && newPlayerHP < prev.players.player.hp) {
        playerHPBar.classList.add('damage');
        setTimeout(() => playerHPBar.classList.remove('damage'), 500);
      }

      if (opponentHPBar && newOpponentHP < prev.players.opponent.hp) {
        opponentHPBar.classList.add('damage');
        setTimeout(() => opponentHPBar.classList.remove('damage'), 500);
      }

      // Immediately check for game over conditions
      if (newPlayerHP <= 0) {
        setTimeout(() => alert('Game Over - Opponent Wins!'), 100);
        return {
          ...prev,
          players: {
            ...prev.players,
            player: {
              ...prev.players.player,
              hp: 0
            }
          },
          gameStatus: 'finished',
          currentTurn: 'opponent',
          battlefield: { player: [], opponent: [] }
        };
      }

      if (newOpponentHP <= 0) {
        setTimeout(() => alert('Congratulations - You Win!'), 100);
        return {
          ...prev,
          players: {
            ...prev.players,
            opponent: {
              ...prev.players.opponent,
              hp: 0
            }
          },
          gameStatus: 'finished',
          currentTurn: 'player',
          battlefield: { player: [], opponent: [] }
        };
      }

      return {
        ...prev,
        players: {
          ...prev.players,
          player: {
            ...prev.players.player,
            hp: newPlayerHP
          },
          opponent: {
            ...prev.players.opponent,
            hp: newOpponentHP
          }
        }
      };
    });

    return updatedCard;
  };

  const handleCardPlay = (card: CardType) => {
    if (gameState.currentTurn !== 'player') return;

    // Check for game over conditions first
    if (gameState.players.player.hp <= 0 || gameState.players.opponent.hp <= 0) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        currentTurn: prev.players.player.hp <= 0 ? 'opponent' : 'player',
        battlefield: { player: [], opponent: [] }
      }));
      return;
    }

    setGameState(prevState => {
      // Remove the card from player's hand
      const updatedPlayerHand = prevState.players.player.hand.filter(c => c.id !== card.id);
      
      // Add the card to the battlefield
      let updatedBattlefield = {
        ...prevState.battlefield,
        player: [...prevState.battlefield.player, card]
      };

      // Calculate if player needs new cards to maintain 4 cards total
      const totalPlayerCards = updatedPlayerHand.length + updatedBattlefield.player.length;
      const newPlayerCards = totalPlayerCards < 4 ? 
        getInitialHand(4 - totalPlayerCards).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp
        })) : [];

      // Update game state after player's move
      const afterPlayerMove: GameState = {
        ...prevState,
        players: {
          ...prevState.players,
          player: {
            ...prevState.players.player,
            hand: [...updatedPlayerHand, ...newPlayerCards]
          }
        },
        battlefield: updatedBattlefield,
        currentTurn: 'opponent',
        gameStatus: 'playing'
      };

      // AI opponent's turn
      const gameAI = new GameAI();
      const opponentHand = afterPlayerMove.players.opponent.hand;
      const playerField = updatedBattlefield.player;
      
      if (opponentHand.length > 0) {
        const aiCard = gameAI.decideMove(opponentHand, playerField);
        // Ensure maxHp is set for the AI card
        aiCard.maxHp = aiCard.maxHp || aiCard.hp;
        const updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);

        // Add AI card to battlefield
        updatedBattlefield = {
          ...updatedBattlefield,
          opponent: [...updatedBattlefield.opponent, { ...aiCard }]
        };

        // Always ensure opponent has exactly 4 cards total (hand + battlefield)
        const totalOpponentCards = updatedOpponentHand.length + updatedBattlefield.opponent.length;
        const newOpponentCards = totalOpponentCards < 4 ? getInitialHand(4 - totalOpponentCards).map(card => ({
          ...card,
          maxHp: card.maxHp || card.hp // Ensure maxHp is set for new cards
        })) : [];

        return {
          ...afterPlayerMove,
          players: {
            ...afterPlayerMove.players,
            opponent: {
              ...afterPlayerMove.players.opponent,
              hand: [...updatedOpponentHand, ...newOpponentCards]
            }
          },
          battlefield: updatedBattlefield,
          currentTurn: 'player'
        };
      }

      return afterPlayerMove;
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
                    <li>Players take turns playing one card to the battlefield</li>
                    <li>When both players have cards on the battlefield, they automatically battle:</li>
                    <li>- Damage dealt = Attacker's Attack - Defender's Defense</li>
                    <li>- Cards battle simultaneously, damaging each other</li>
                    <li>- When a card's HP reaches 0, it's removed and its owner takes direct damage</li>
                  </ul>
                </div>
                <div className="instruction-section">
                  <h3>Card Management</h3>
                  <ul>
                    <li>Players always maintain 4 cards total (hand + battlefield combined)</li>
                    <li>New cards are automatically drawn when needed</li>
                    <li>Each card shows its current HP percentage and stats</li>
                  </ul>
                </div>
                <div className="instruction-section">
                  <h3>Winning the Game</h3>
                  <ul>
                    <li>Reduce your opponent's HP to 0 to win</li>
                    <li>Strategic card placement is key - consider Attack vs Defense stats</li>
                    <li>Protect your HP by keeping strong defenders on the field</li>
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
          
          <GameBoard
            gameState={gameState}
            onCardPlay={handleCardPlay}
            setGameState={setGameState}
            playerInfo={playerInfo}
            opponentInfo={opponentInfo}
          />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
