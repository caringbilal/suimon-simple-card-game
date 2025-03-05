import React, { useState } from 'react';
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
    let dialog = null;

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
        dialog = <Dialog
          isOpen={true}
          onClose={() => setGameState(prev => ({ ...prev, gameStatus: 'playing' }))}
          title="Game Over"
          message="Better luck next time! The opponent was stronger this time."
          isVictory={false}
        />;
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
        dialog = <Dialog
          isOpen={true}
          onClose={() => setGameState(prev => ({ ...prev, gameStatus: 'playing' }))}
          title="Victory!"
          message="Congratulations! You have won the battle!"
          isVictory={true}
        />;
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

    setGameState(prevState => {
      const updatedPlayerHand = prevState.players.player.hand.filter(c => c.id !== card.id);
      
      let updatedBattlefield = {
        ...prevState.battlefield,
        player: [...prevState.battlefield.player, card]
      };

      const afterPlayerMove: GameState = {
        ...prevState,
        players: {
          ...prevState.players,
          player: {
            ...prevState.players.player,
            hand: updatedPlayerHand
          },
          opponent: prevState.players.opponent
        },
        battlefield: updatedBattlefield,
        currentTurn: 'opponent' as const,
        gameStatus: 'playing'
      };

      const gameAI = new GameAI();
      const opponentHand = afterPlayerMove.players.opponent.hand;
      const playerField = afterPlayerMove.battlefield.player;
      
      if (opponentHand.length > 0) {
        const aiCard = gameAI.decideMove(opponentHand, playerField);
        const updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);

        updatedBattlefield = {
          ...updatedBattlefield,
          opponent: [...updatedBattlefield.opponent, aiCard]
        };

        if (playerField.length > 0) {
          const playerCard = playerField[0];

          const updatedOpponentCard = handleCombat(playerCard, aiCard);
          const updatedPlayerCard = handleCombat(aiCard, playerCard);

          // Update battlefield with combat results
          updatedBattlefield = {
            opponent: updatedOpponentCard.hp > 0 ? [updatedOpponentCard] : [],
            player: updatedPlayerCard.hp > 0 ? [updatedPlayerCard] : []
          };

          // Calculate and apply direct damage if a card is destroyed
          if (updatedPlayerCard.hp <= 0) {
            const directDamage = Math.max(0, aiCard.attack - playerCard.defense);
            afterPlayerMove.players.player.hp = Math.max(0, afterPlayerMove.players.player.hp - directDamage);
          }
          if (updatedOpponentCard.hp <= 0) {
            const directDamage = Math.max(0, playerCard.attack - aiCard.defense);
            afterPlayerMove.players.opponent.hp = Math.max(0, afterPlayerMove.players.opponent.hp - directDamage);
          }

          // Clear battlefield if both cards are destroyed
          if (updatedPlayerCard.hp <= 0 && updatedOpponentCard.hp <= 0) {
            updatedBattlefield = { player: [], opponent: [] };
          }

          // Check if either player needs new cards
          const needsNewCards = updatedOpponentHand.length === 0 || updatedPlayerHand.length === 0;
        
          // If either player needs cards, deal new hands to both players
          const finalPlayerHand = needsNewCards ? getInitialHand(4) : updatedPlayerHand;
          const finalOpponentHand = needsNewCards ? getInitialHand(4) : updatedOpponentHand;

          // Check if we need to replenish cards
          const shouldReplenishCards = (updatedBattlefield.player.length === 0 && updatedPlayerHand.length < 4) ||
                                     (updatedBattlefield.opponent.length === 0 && updatedOpponentHand.length < 4);

          // Get new hands if needed
          const replenishedPlayerHand = shouldReplenishCards ? getInitialHand(4) : finalPlayerHand;
          const replenishedOpponentHand = shouldReplenishCards ? getInitialHand(4) : finalOpponentHand;

          return {
            ...afterPlayerMove,
            players: {
              ...afterPlayerMove.players,
              player: {
                ...afterPlayerMove.players.player,
                hand: replenishedPlayerHand
              },
              opponent: {
                ...afterPlayerMove.players.opponent,
                hand: replenishedOpponentHand
              }
            },
            battlefield: updatedBattlefield,
            currentTurn: 'player' as const
          };
        }

        return {
          ...afterPlayerMove,
          players: {
            ...afterPlayerMove.players,
            opponent: {
              ...afterPlayerMove.players.opponent,
              hand: updatedOpponentHand
            }
          },
          battlefield: updatedBattlefield,
          currentTurn: 'player' as const
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
              }}
            />
          ) : (
            <GameBoard
              gameState={gameState}
              onCardPlay={handleCardPlay}
              setGameState={setGameState}
              playerInfo={playerInfo}
              opponentInfo={opponentInfo}
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
