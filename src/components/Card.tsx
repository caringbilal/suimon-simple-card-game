import React from 'react';
import { CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-title">{card.name}</div>
      <div className="card-image">
        <img src={card.imageUrl} alt={card.name} />
      </div>
      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">ATK</span>
          <span className="stat-value">{card.attack}</span>
        </div>
        <div className="stat">
          <span className="stat-label">DEF</span>
          <span className="stat-value">{card.defense}</span>
        </div>
        <div className="stat">
          <span className="stat-label">HP</span>
          <span className="stat-value">{card.hp}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;