import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@average.dev/arena-ui';
import { useGame } from '../../../context/GameContext';
import styles from './GameOverPage.module.scss';

/**
 * Game over page — shows victory or defeat and lets the player return home.
 * Reads winner from GameContext. Calling leaveRoom() disconnects the Colyseus
 * room before navigating away.
 */
export function GameOverPage() {
  const { state, leaveRoom } = useGame();
  const navigate = useNavigate();

  const isVictory = state.winner !== '' && state.winner === state.room?.sessionId;

  const handleReturnHome = () => {
    leaveRoom();
    navigate('/');
  };

  return (
    <div className={styles.gameOverPage}>
      <h1>{isVictory ? '🏆 Victory Royale!' : 'Game Over'}</h1>
      <h2>
        {isVictory
          ? 'You are the last one standing!'
          : `Winner: ${state.winner || 'Unknown'}`}
      </h2>
      <Button variant="primary" onClick={handleReturnHome}>
        Return to Home
      </Button>
    </div>
  );
}
