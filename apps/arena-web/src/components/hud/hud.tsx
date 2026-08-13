import React, { useEffect, useState } from 'react';
import { Panel, HealthBar, Button } from '@average.dev/arena-ui';
import { StateHandler } from '../../network/state-handler';
import type { PlayerSnapshot } from '@average.dev/arena-shared';
import styles from './HUD.module.scss';

interface HUDProps {
  stateHandler: StateHandler;
  onLeave: () => void;
}

/**
 * HUD — DOM overlay rendered on top of the 3D canvas.
 * Shows game state, health, kills, and controls hint.
 * Reads from Colyseus StateHandler events.
 */
export function HUD({ stateHandler, onLeave }: HUDProps) {
  const [alive, setAlive] = useState(0);
  const [kills, setKills] = useState(0);
  const [health, setHealth] = useState(100);
  const [phase, setPhase] = useState('waiting');
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const room = stateHandler.getRoom();
    const myId = room.sessionId;

    const onAliveCount = (count: number) => setAlive(count);
    const onPhase = (p: string) => setPhase(p);
    const onPlayerUpdate = (id: string, player: PlayerSnapshot) => {
      if (id === myId) {
        setHealth(player.health);
        setKills(player.kills);
      }
    };

    stateHandler.on('aliveCountChange', onAliveCount);
    stateHandler.on('gamePhaseChange', onPhase);
    stateHandler.on('playerUpdate', onPlayerUpdate);

    return () => {
      stateHandler.off('aliveCountChange', onAliveCount);
      stateHandler.off('gamePhaseChange', onPhase);
      stateHandler.off('playerUpdate', onPlayerUpdate);
    };
  }, [stateHandler]);

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.hudContainer}>
      {/* Top bar — health, phase, stats */}
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

      {/* Controls hint */}
      {showControls && (
        <Panel className={styles.controlsHint}>
          <h3 className={styles.controlsTitle}>Controls</h3>
          <div className={styles.controlsList}>
            <div className={styles.controlItem}>
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
              <span>Move</span>
            </div>
            <div className={styles.controlItem}>
              <kbd>Space</kbd>
              <span>Jump</span>
            </div>
            <div className={styles.controlItem}>
              <kbd>Q</kbd> / <kbd>E</kbd>
              <span>Rotate camera (snap)</span>
            </div>
            <div className={styles.controlItem}>
              <kbd>Right Drag</kbd>
              <span>Rotate camera (free)</span>
            </div>
            <div className={styles.controlItem}>
              <kbd>Scroll</kbd>
              <span>Zoom in/out</span>
            </div>
          </div>
          <button
            className={styles.dismissBtn}
            onClick={() => setShowControls(false)}
          >
            Got it
          </button>
        </Panel>
      )}

      {/* Title badge */}
      <div className={styles.titleBadge}>
        ARENA <span className={styles.version}>3D</span>
      </div>
    </div>
  );
}
