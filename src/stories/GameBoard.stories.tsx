import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import GameBoard from '../components/GameBoard';
import { GameState, CardType } from '../types/game';
import { Socket } from 'socket.io-client';

// Mock socket for Storybook
const mockSocket = {
  on: () => {},
  off: () => {},
  emit: () => {},
} as unknown as Socket;

// Mock player and opponent info
const playerInfo = { name: 'Player 1', avatar: 'https://via.placeholder.com/50' };
const opponentInfo = { name: 'Player 2', avatar: 'https://via.placeholder.com/50' };

// Mock GameState with combatLog and killCount
const mockGameState: GameState = {
  players: {
    player: {
      id: 'player1',
      energy: 700,
      deck: [],
      hand: [
        { id: 'card1', name: 'Card 1', attack: 30, defense: 20, hp: 50, maxHp: 50, imageUrl: 'https://via.placeholder.com/150' },
        { id: 'card2', name: 'Card 2', attack: 25, defense: 15, hp: 40, maxHp: 40, imageUrl: 'https://via.placeholder.com/150' },
      ],
    },
    opponent: {
      id: 'player2',
      energy: 700,
      deck: [],
      hand: [
        { id: 'card3', name: 'Card 3', attack: 35, defense: 25, hp: 60, maxHp: 60, imageUrl: 'https://via.placeholder.com/150' },
        { id: 'card4', name: 'Card 4', attack: 20, defense: 10, hp: 30, maxHp: 30, imageUrl: 'https://via.placeholder.com/150' },
      ],
    },
  },
  battlefield: {
    player: [],
    opponent: [],
  },
  currentTurn: 'player',
  gameStatus: 'playing',
  playerMaxHealth: 700,
  opponentMaxHealth: 700,
  combatLog: [
    { timestamp: Date.now(), message: 'Mock combat log entry', type: 'info' },
  ],
  killCount: { player: 1, opponent: 0 },
};

// Mock addCombatLogEntry function
const mockAddCombatLogEntry = (message: string, type: string) => {
  console.log('Combat log entry:', message, type);
};

// Mock setGameState function
const mockSetGameState = (newState: React.SetStateAction<GameState | null>) => {
  console.log('Set game state:', newState);
};

// Mock onCardPlay function
const mockOnCardPlay = (card: CardType) => {
  console.log('Card played:', card);
};

export default {
  title: 'Components/GameBoard',
  component: GameBoard,
  argTypes: {
    playerRole: {
      control: { type: 'select', options: ['player1', 'player2'] },
    },
    gameStatus: {
      control: { type: 'select', options: ['waiting', 'playing', 'finished'] },
    },
  },
} as Meta<typeof GameBoard>;

type Story = StoryObj<typeof GameBoard>;

export const Default: Story = {
  args: {
    gameState: mockGameState,
    onCardPlay: mockOnCardPlay,
    setGameState: mockSetGameState,
    playerInfo,
    opponentInfo,
    combatLog: mockGameState.combatLog,
    addCombatLogEntry: mockAddCombatLogEntry,
    killCount: mockGameState.killCount,
    playerRole: 'player1',
    roomId: 'mock-room-id',
    socket: mockSocket,
  },
};

export const Player2View: Story = {
  args: {
    gameState: {
      ...mockGameState,
      currentTurn: 'opponent',
    },
    onCardPlay: mockOnCardPlay,
    setGameState: mockSetGameState,
    playerInfo: opponentInfo,
    opponentInfo: playerInfo,
    combatLog: mockGameState.combatLog,
    addCombatLogEntry: mockAddCombatLogEntry,
    killCount: mockGameState.killCount,
    playerRole: 'player2',
    roomId: 'mock-room-id',
    socket: mockSocket,
  },
};

export const GameFinished: Story = {
  args: {
    gameState: {
      ...mockGameState,
      gameStatus: 'finished',
      players: {
        ...mockGameState.players,
        player: { ...mockGameState.players.player, energy: 0 },
      },
    },
    onCardPlay: mockOnCardPlay,
    setGameState: mockSetGameState,
    playerInfo,
    opponentInfo,
    combatLog: mockGameState.combatLog,
    addCombatLogEntry: mockAddCombatLogEntry,
    killCount: mockGameState.killCount,
    playerRole: 'player1',
    roomId: 'mock-room-id',
    socket: mockSocket,
  },
};