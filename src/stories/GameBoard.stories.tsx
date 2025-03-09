import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameBoard from '../components/GameBoard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getInitialHand } from '../data/monsters';
import PlayerProfile from '../assets/ui/Player_Profile.jpg';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import './Gameboard.css';

const meta: Meta<typeof GameBoard> = {
  title: 'Game/GameBoard',
  component: GameBoard,
  decorators: [
    (Story) => (
      <DndProvider backend={HTML5Backend}>
        <Story />
      </DndProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
  argTypes: {
    gameState: {
      control: 'object',
    },
    playerInfo: {
      control: 'object',
    },
    opponentInfo: {
      control: 'object',
    },
    killCount: {
      control: 'object',
    },
    combatLog: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GameBoard>;

const mockGameState: GameState = {
  players: {
    player: {
      id: 'player1',
      energy: 700,
      deck: [],
      hand: getInitialHand(4),
    },
    opponent: {
      id: 'player2',
      energy: 700,
      deck: [],
      hand: getInitialHand(4),
    },
  },
  battlefield: {
    player: [],
    opponent: [],
  },
  currentTurn: 'player',
  gameStatus: 'playing' as 'playing' | 'waiting' | 'finished',
  playerMaxHealth: 700,
  opponentMaxHealth: 700,
};

const mockPlayerInfo = {
  name: 'Player 1',
  avatar: PlayerProfile,
};

const mockOpponentInfo = {
  name: 'Player 2',
  avatar: PlayerProfile,
};

const mockSocket = {
  on: (event: string, callback: Function) => {},
  off: (event: string, callback?: Function) => {},
  emit: (event: string, ...args: any[]) => {},
  offAny: () => {},
  connected: true,
  volatile: {},
  timeout: () => mockSocket,
  disconnected: false,
  id: 'mock-socket-id',
  auth: {},
  io: {} as any,
  nsp: '/',
  flags: {},
  acks: new Map(),
  connect: () => mockSocket,
  disconnect: () => mockSocket,
  close: () => mockSocket,
  send: (...args: any[]) => mockSocket,
  compress: () => mockSocket,
  open: () => mockSocket,
  listeners: () => [],
  onAny: () => mockSocket,
  prependAny: () => mockSocket,
  listenersAny: () => [],
  removeListener: () => mockSocket,
  removeAllListeners: () => mockSocket,
  eventNames: () => [],
  _pid: 0,
  _lastOffset: 0,
  recovered: false,
  receiveBuffer: [],
  sendBuffer: [],
  _queue: [],
  _queueSeq: 0,
  _flags: {},
  _connectTimeout: undefined,
  _reconnection: true,
  _reconnectionAttempts: 0,
  _reconnectionDelay: 1000,
  _reconnectionDelayMax: 5000,
  _randomizationFactor: 0.5,
  _timeout: 20000,
  _offset: 0,
  _callbacks: new Map(),
  _anyListeners: [],
  _anyOutgoingListeners: []
} as unknown as Socket;

export const Default: Story = {
  args: {
    gameState: mockGameState,
    onCardPlay: (card) => console.log('Card played:', card),
    setGameState: (newState) => console.log('New state:', newState),
    playerInfo: mockPlayerInfo,
    opponentInfo: mockOpponentInfo,
    combatLog: [
      { timestamp: Date.now(), message: 'Game started', type: 'info' },
      { timestamp: Date.now(), message: 'Player 1\'s turn', type: 'turn' },
    ],
    addCombatLogEntry: (message, type) => console.log('Combat log:', message, type),
    killCount: { player: 0, opponent: 0 },
    playerRole: 'player1',
    roomId: 'mock-room-id',
    socket: mockSocket,
    onCardDefeated: (defeatedPlayerKey: 'player' | 'opponent') => console.log('Card defeated:', defeatedPlayerKey)
  },
};

export const WithActiveBattle: Story = {
  args: {
    ...Default.args,
    gameState: {
      ...mockGameState,
      battlefield: {
        player: [getInitialHand(1)[0]],
        opponent: [getInitialHand(1)[0]],
      },
    },
  },
};

export const LowHealth: Story = {
  args: {
    ...Default.args,
    gameState: {
      ...mockGameState,
      players: {
        player: { ...mockGameState.players.player, energy: 100 },
        opponent: { ...mockGameState.players.opponent, energy: 150 },
      },
    },
  },
};

export const GameEnding: Story = {
  args: {
    ...Default.args,
    gameState: {
      ...mockGameState,
      gameStatus: 'finished',
      players: {
        player: { ...mockGameState.players.player, energy: 0 },
        opponent: { ...mockGameState.players.opponent, energy: 300 },
      },
    },
  },
};