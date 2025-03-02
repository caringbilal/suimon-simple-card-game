import React from 'react';
import { useDrag } from 'react-dnd';
import { CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const [{ isDragging }, dragRef] = useDrag<CardType, unknown, { isDragging: boolean }>({
    type: 'CARD',
    item: card,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={dragRef as unknown as React.LegacyRef<HTMLDivElement>}
      className={`card ${isDragging ? 'card-dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
    >
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