import React from 'react';
import { GameState } from '../types/game';

interface GameBoardProps {
    gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
    return (
        <div className="game-board">
            <h2>SUIMON Card Game</h2>
            <div className="game-status">
                Game Status: {gameState.gameStatus}
            </div>
            {/* We'll add more game elements here in the next steps */}
        </div>
    );
};

export default GameBoard;