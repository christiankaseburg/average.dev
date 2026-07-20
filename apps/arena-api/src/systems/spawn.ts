import { PlayerState } from '../schemas/player-state';
import { Vector2 } from '../utils/math';
import { SPAWN_POINTS } from '../config/map';

export function getSpawnPoint(usedSpawns: Set<number>): Vector2 {
  // Try to find an unused spawn point
  let availableIndices = Array.from({ length: SPAWN_POINTS.length }, (_, i) => i)
                              .filter(i => !usedSpawns.has(i));
  
  if (availableIndices.length === 0) {
    // If all used, just pick a random one
    availableIndices = Array.from({ length: SPAWN_POINTS.length }, (_, i) => i);
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedSpawns.add(randomIndex);
  return SPAWN_POINTS[randomIndex];
}

export function respawnPlayer(player: PlayerState, usedSpawns: Set<number>) {
  const spawn = getSpawnPoint(usedSpawns);
  player.x = spawn.x;
  player.y = spawn.y;
  player.health = player.maxHealth;
  player.isAlive = true;
  player.weapon = 'fists';
}
