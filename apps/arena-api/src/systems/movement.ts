import { PlayerState } from '../schemas/player-state';
import type { InputCommand } from '@average.dev/arena-shared';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_SPEED } from '@average.dev/arena-shared';
import type { CollisionGrid } from '../config/map';
import { TILE_SIZE } from '../config/map';

export function processMovement(
  player: PlayerState, 
  input: InputCommand, 
  collisionGrid: CollisionGrid, 
  deltaTime: number
) {
  if (!player.isAlive || (input.dx === 0 && input.dy === 0)) return;

  // Calculate intended movement
  const dtSeconds = deltaTime / 1000;
  const newX = player.x + input.dx * PLAYER_SPEED * dtSeconds;
  const newY = player.y + input.dy * PLAYER_SPEED * dtSeconds;

  // Collision checks (simple AABB vs Grid)
  const tileX = Math.floor(newX / TILE_SIZE);
  const tileY = Math.floor(newY / TILE_SIZE);
  
  // Bounds check and collision check
  let canMoveX = true;
  let canMoveY = true;

  if (newX < 0 || newX > MAP_WIDTH) canMoveX = false;
  if (newY < 0 || newY > MAP_HEIGHT) canMoveY = false;
  
  if (tileY >= 0 && tileY < collisionGrid.length && tileX >= 0 && tileX < collisionGrid[0].length) {
      if (collisionGrid[tileY][tileX] === 1) {
          canMoveX = false;
          canMoveY = false;
      }
  }

  if (canMoveX) player.x = newX;
  if (canMoveY) player.y = newY;

  // Update facing
  if (input.facing) {
    player.facing = input.facing;
  } else if (Math.abs(input.dx) > Math.abs(input.dy)) {
    player.facing = input.dx > 0 ? "right" : "left";
  } else {
    player.facing = input.dy > 0 ? "down" : "up";
  }
}
