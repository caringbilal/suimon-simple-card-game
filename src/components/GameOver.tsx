import React from 'react';
import '../styles/gameOver.css';

interface GameOverProps {
  isVictory: boolean;
  playerHealth: number;
  opponentHealth: number;
  onPlayAgain: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  isVictory,
  playerHealth,
  opponentHealth,
  onPlayAgain
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
            <div className="stat-label">Your HP</div>
            <div className="stat-value">{playerHealth}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Opponent HP</div>
            <div className="stat-value">{opponentHealth}</div>
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