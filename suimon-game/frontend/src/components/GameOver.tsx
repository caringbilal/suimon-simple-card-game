import React from 'react';
import '../styles/gameOver.css'; // Adjust the path as needed

interface GameOverProps {
  isVictory: boolean;
  isTie: boolean;
  playerEnergy: number;
  opponentEnergy: number;
  onPlayAgain: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ isVictory, isTie, playerEnergy, opponentEnergy, onPlayAgain }) => {
  console.log(`GameOver props: isVictory=${isVictory}, isTie=${isTie}, playerEnergy=${playerEnergy}, opponentEnergy=${opponentEnergy}`);
  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h1 className={`game-over-title ${isVictory ? 'victory' : isTie ? '' : 'defeat'}`}>
          {isVictory ? 'VICTORY!' : isTie ? 'TIE!' : 'DEFEAT!'}
        </h1>
        <p className="game-over-message">
          {isVictory
            ? 'Congratulations! You have won the battle!'
            : isTie
            ? 'The battle ended in a tie!'
            : 'Better luck next time! The opponent was stronger this time.'}
        </p>
        <div className="game-over-stats">
          <div className="stat-item">
            <span className="stat-label">YOUR ENERGY</span>
            <span className="stat-value">{playerEnergy}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">OPPONENT ENERGY</span>
            <span className="stat-value">{opponentEnergy}</span>
          </div>
        </div>
        <button className="play-again-btn" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
export default GameOver;