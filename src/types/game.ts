// Card type definition
export interface CardType {
  id: string;
  name: string;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  imageUrl: string;
}

// Player interface
export interface Player {
  id: string;
  hp: number;
  energy: number;
  deck: CardType[];
  hand: CardType[];
}

// Single GameState interface with proper types
export interface GameState {
  players: {
    player: Player;
    opponent: Player;
  };
  battlefield: {
    player: CardType[];
    opponent: CardType[];
  };
  currentTurn: 'player' | 'opponent';
  gameStatus: 'waiting' | 'playing' | 'finished';
  playerMaxHealth: number;
  opponentMaxHealth: number;
}