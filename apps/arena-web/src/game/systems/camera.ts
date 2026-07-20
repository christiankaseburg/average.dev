import Phaser from 'phaser';

export function setupCamera(scene: Phaser.Scene, player: Phaser.GameObjects.Container, mapWidth: number, mapHeight: number) {
  const camera = scene.cameras.main;
  
  // Set bounds to the edge of the map
  camera.setBounds(0, 0, mapWidth, mapHeight);
  
  // Follow the player with a bit of lerp for smoothness
  camera.startFollow(player, true, 0.1, 0.1);
  
  // Optional deadzone
  camera.setDeadzone(50, 50);
}
