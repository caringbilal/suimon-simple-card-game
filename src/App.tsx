import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import { GameState, CardType } from './types/game';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameAI } from './utils/gameAI';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player: {
        id: 'player',
        hp: 1000,
        deck: [],
        hand: []
      },
      opponent: {
        id: 'opponent',
        hp: 1000,
        deck: [],
        hand: []
      }
    },
    battlefield: {
      player: [],
      opponent: []
    },
    currentTurn: 'player',
    gameStatus: 'waiting'
  });

  const handleCombat = (attackingCard: CardType, defendingCard: CardType) => {
    const damage = Math.max(0, attackingCard.attack - defendingCard.defense);
    const updatedCard = {
      ...defendingCard,
      hp: Math.max(0, defendingCard.hp - damage)
    };

    // Update player HP based on damage and show visual feedback
    setGameState(prev => {
      const playerCard = prev.battlefield.player[0];
      const opponentCard = prev.battlefield.opponent[0];
      const newPlayerHP = Math.max(0, prev.players.player.hp - 
        (playerCard && defendingCard.id === playerCard.id ? damage : 0));
      const newOpponentHP = Math.max(0, prev.players.opponent.hp - 
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

    // Check for game over condition
    if (gameState.players.player.hp <= 0) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        currentTurn: 'opponent',
        battlefield: { player: [], opponent: [] }
      }));
      alert('Game Over - Opponent Wins!');
    } else if (gameState.players.opponent.hp <= 0) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        currentTurn: 'player',
        battlefield: { player: [], opponent: [] }
      }));
      alert('Congratulations - You Win!');
    }

    return updatedCard;
  };

  const handleCardPlay = (card: CardType) => {
    if (gameState.currentTurn !== 'player') return;

    setGameState(prevState => {
      // Remove the card from player's hand
      const updatedPlayerHand = prevState.players.player.hand.filter(c => c.id !== card.id);
      
      // Add the card to the battlefield
      let updatedBattlefield = {
        ...prevState.battlefield,
        player: [...prevState.battlefield.player, card]
      };

      // Update game state after player's move
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

      // AI opponent's turn
      const gameAI = new GameAI();
      const opponentHand = afterPlayerMove.players.opponent.hand;
      const playerField = afterPlayerMove.battlefield.player;
      
      if (opponentHand.length > 0) {
        const aiCard = gameAI.decideMove(opponentHand, playerField);
        const updatedOpponentHand = opponentHand.filter(c => c.id !== aiCard.id);

        // Add AI card to battlefield
        updatedBattlefield = {
          ...updatedBattlefield,
          opponent: [...updatedBattlefield.opponent, aiCard]
        };

        // Handle combat if there are cards on both sides
        if (playerField.length > 0) {
          const playerCard = playerField[0];

          // Both cards attack simultaneously
          const updatedOpponentCard = handleCombat(playerCard, aiCard);
          const updatedPlayerCard = handleCombat(aiCard, playerCard);

          // Update battlefield with combat results
          updatedBattlefield = {
            opponent: updatedOpponentCard.hp > 0 ? [updatedOpponentCard] : [],
            player: updatedPlayerCard.hp > 0 ? [updatedPlayerCard] : []
          };

          // Calculate direct damage if a card is destroyed
          if (updatedPlayerCard.hp <= 0) {
            afterPlayerMove.players.player.hp -= Math.max(0, aiCard.attack - playerCard.defense);
          }
          if (updatedOpponentCard.hp <= 0) {
            afterPlayerMove.players.opponent.hp -= Math.max(0, playerCard.attack - aiCard.defense);
          }
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
      <div className="App">
        <GameBoard 
          gameState={gameState} 
          onCardPlay={handleCardPlay}
          setGameState={setGameState}
        />
      </div>
    </DndProvider>
  );
}

export default App;
