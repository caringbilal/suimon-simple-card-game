export interface Card {
    id: string;
    name: string;
    attack: number;
    defense: number;
    hp: number;
    imageUrl: string;
}

export interface Player {
    id: string;
    hp: number;
    deck: Card[];
    hand: Card[];
}

export interface GameState {
    players: {
        [key: string]: Player;
    };
    currentTurn: string;
    gameStatus: 'waiting' | 'playing' | 'finished';
}