// Card type definition
export interface CardType {
  id: string;
  name: string;
  attack: number;
  defense: number;
  hp: number;
  imageUrl: string;
}

// Player interface
export interface Player {
  id: string;
  hp: number;
  deck: CardType[];
  hand: CardType[];
}

// Single GameState interface with proper types
export interface GameState {
  players: {
    [key: string]: Player;
  };
  currentTurn: 'player' | 'opponent';
  gameStatus: 'waiting' | 'playing' | 'finished';
}