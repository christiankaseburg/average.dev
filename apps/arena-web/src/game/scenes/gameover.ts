import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    // Mostly handled by React, but we can stop physics here
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.8)');
  }
}
