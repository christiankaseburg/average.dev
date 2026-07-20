import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getGameConfig } from '../../game/config';
import { StateHandler } from '../../network/state-handler';
import styles from './game-canvas.module.scss';

interface GameCanvasProps {
  stateHandler: StateHandler;
}

export function GameCanvas({ stateHandler }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      const config = getGameConfig(containerRef.current.id);
      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Wait for BootScene.create() to finish — it fires 'boot-complete' after all
      // atlas textures are built. Do NOT use game.events.once('ready', ...) here;
      // 'ready' fires when the Phaser engine boots (before BootScene even preloads),
      // so NPC atlas frames won't be available yet when GameScene creates NPCs.
      game.events.once('boot-complete', () => {
         // Start the game scene and pass the state handler
         game.scene.start('GameScene', { stateHandler });
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [stateHandler]);

  return <div id="game-container" ref={containerRef} className={styles.gameContainer} />;
}
