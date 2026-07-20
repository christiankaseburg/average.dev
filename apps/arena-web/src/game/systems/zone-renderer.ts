import Phaser from 'phaser';

export class ZoneRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private mapWidth: number;
  private mapHeight: number;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100); // Above ground, below entities
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  public update(x: number, y: number, radius: number) {
    this.graphics.clear();
    
    // Draw semi-transparent red over everything
    this.graphics.fillStyle(0xe06c5c, 0.3);
    this.graphics.fillRect(0, 0, this.mapWidth, this.mapHeight);

    // Erase the safe zone circle
    // Phaser Graphics doesn't have an easy "erase" blend mode that works across all renderers.
    // The robust way is to draw a path with a hole.
    
    this.graphics.clear();
    
    this.graphics.fillStyle(0xe06c5c, 0.3);
    this.graphics.beginPath();
    
    // Outer rect (CW)
    this.graphics.moveTo(0, 0);
    this.graphics.lineTo(this.mapWidth, 0);
    this.graphics.lineTo(this.mapWidth, this.mapHeight);
    this.graphics.lineTo(0, this.mapHeight);
    this.graphics.lineTo(0, 0);
    
    // Inner circle (CCW to cut hole)
    this.graphics.moveTo(x + radius, y);
    this.graphics.arc(x, y, radius, 0, Math.PI * 2, true);
    
    this.graphics.fillPath();
    
    // Draw a thick border for the circle
    this.graphics.lineStyle(4, 0xe06c5c, 0.8);
    this.graphics.strokeCircle(x, y, radius);
  }
}
