# SUIMON Card Game

A browser-based card game built with React where players can battle with SUIMON monsters on the Sui blockchain.

## Game Overview

- Players connect their Sui wallet and stake 1000 SUIMON
- Each player gets 5 cards from their 25-monster deck
- Turn-based combat system
- Direct HP damage mechanics
- First to reduce opponent's HP to 0 wins
- Winner receives 1900 SUIMON (100 SUIMON automatically burned)

## Technology Stack

- Frontend: React.js with TypeScript
- Blockchain: Sui Network
- Real-time Multiplayer: Socket.io
- Smart Contract: Move

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Development Phases

1. **Phase 1: Basic Game**
   - Wallet Connection
   - Basic UI
   - Game Logic
   - Local 2-player testing

2. **Phase 2: Smart Contract Integration**
   - Stake Function
   - Winner Distribution
   - Token Burning

3. **Phase 3: Multiplayer**
   - Socket.io Setup
   - Matchmaking
   - Game State Sync
   - Deployment

## Contributing

[Add contribution guidelines here]

## License

[Add license information here]
