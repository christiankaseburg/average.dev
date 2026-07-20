import Phaser from 'phaser';
import { BootScene } from './scenes/boot';
import { GameScene } from './scenes/game';
import { GameOverScene } from './scenes/gameover';

export const getGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    pixelArt: true,
    antialias: false
  },
  scene: [BootScene, GameScene, GameOverScene]
});
