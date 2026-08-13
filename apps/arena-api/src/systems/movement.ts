import { PlayerState } from '../schemas/player-state';
import { WORLD_HALF_SIZE } from '@average.dev/arena-shared';

/**
 * Clamps a player's position to world bounds.
 * Called after the client sends a position update.
 */
export function clampPlayerPosition(player: PlayerState): void {
  if (!player.isAlive) return;

  player.x = Math.max(-WORLD_HALF_SIZE, Math.min(WORLD_HALF_SIZE, player.x));
  player.z = Math.max(-WORLD_HALF_SIZE, Math.min(WORLD_HALF_SIZE, player.z));

  // Respawn if fallen off map
  if (player.y < -50) {
    player.x = 0;
    player.y = 3;
    player.z = 0;
  }
}
