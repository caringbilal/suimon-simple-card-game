import React from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './Gameboard.css';

const GameBoard = () => {
  const layout = [
    { i: 'killCounter', x: 0, y: 0, w: 2, h: 1 },
    { i: 'healthSummary', x: 2, y: 0, w: 2, h: 1 },
    { i: 'battlefield', x: 0, y: 1, w: 4, h: 3 },
  ];

  return (
    <div className="game-board">
      <GridLayout className="layout" layout={layout} cols={12} rowHeight={100} width={1200}>
        <div key="killCounter" className="game-section">Kill Counter</div>
        <div key="healthSummary" className="game-section">Health Summary</div>
        <div key="battlefield" className="game-section">Battlefield</div>
      </GridLayout>
    </div>
  );
};

export default {
  title: 'Game/GameBoard',
  component: GameBoard,
};

export const Default = () => <GameBoard />;