import React from 'react';
import '../styles/gameOver.css';

interface GameOverProps {
    isVictory: boolean;
    playerHP: number;        // Renamed for consistency and clarity
    opponentHP: number;      // Renamed for consistency and clarity
    onPlayAgain: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
    isVictory,
    playerHP,
    opponentHP,
    onPlayAgain,
}) => {
    return (
        <div className="game-over-overlay">
            <div className="game-over-content">
                <h1 className={`game-over-title ${isVictory ? 'victory' : 'defeat'}`}>
                    {isVictory ? 'Victory!' : 'Defeat!'}
                </h1>
                <p className="game-over-message">
                    {isVictory
                        ? 'Congratulations! You have won the battle!'
                        : 'Better luck next time! The opponent was stronger this time.'}
                </p>
                <div className="game-over-stats">
                    <div className="stat-item">
                        <span className="stat-label">Your HP:</span>
                        <span className="stat-value">{playerHP}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Opponent HP:</span>
                        <span className="stat-value">{opponentHP}</span>
                    </div>
                </div>
                <button className="play-again-btn" onClick={onPlayAgain}>
                    Play Again
                </button>
            </div>
        </div>
    );
};

export default GameOver;