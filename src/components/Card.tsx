import React from 'react';
import { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-content">
        <h3>{card.name}</h3>
        <div className="card-stats">
          <div>ATK: {card.attack}</div>
          <div>DEF: {card.defense}</div>
          <div>HP: {card.hp}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;