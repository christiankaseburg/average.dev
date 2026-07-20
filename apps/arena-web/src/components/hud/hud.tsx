import React, { useEffect, useState } from 'react';
import styles from './hud.module.scss';
import { StateHandler } from '../../network/state-handler';
import { HealthBar, Button } from '@average.dev/arena-ui';
import type { PlayerSnapshot } from '@average.dev/arena-shared';

interface HUDProps {
  stateHandler: StateHandler;
  onLeave: () => void;
}

export function HUD({ stateHandler, onLeave }: HUDProps) {
  const [alive, setAlive] = useState(0);
  const [kills, setKills] = useState(0);
  const [health, setHealth] = useState(100);
  const [phase, setPhase] = useState('waiting');

  useEffect(() => {
    const room = stateHandler.getRoom();
    const myId = room.sessionId;

    stateHandler.on('aliveCountChange', (count: number) => setAlive(count));
    stateHandler.on('gamePhaseChange', (p: string) => setPhase(p));
    
    stateHandler.on('playerUpdate', (id: string, player: PlayerSnapshot) => {
      if (id === myId) {
         setHealth(player.health);
         setKills(player.kills);
      }
    });

    return () => {
      // cleanup would be here if we stored handlers
    };
  }, [stateHandler]);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.topBar}>
        <div className={styles.healthSection}>
          <HealthBar current={Math.ceil(health)} max={100} style={{ width: '200px' }} />
        </div>

        <div className={styles.centerInfo}>
          {phase === 'countdown' ? (
             <div className={styles.warning}>MATCH STARTING...</div>
          ) : phase === 'waiting' ? (
             <div className={styles.info}>WAITING FOR PLAYERS...</div>
          ) : (
             <div className={styles.aliveCount}>{alive} ALIVE</div>
          )}
        </div>

        <div className={styles.statsSection}>
           <div className={styles.kills}>KILLS: {kills}</div>
           <Button variant="danger" onClick={onLeave} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
             Leave
           </Button>
        </div>
      </div>
    </div>
  );
}
