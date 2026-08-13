import { WORLD_HALF_SIZE, SPAWN_HEIGHT } from '@average.dev/arena-shared';

/**
 * 3D spawn points distributed within the world bounds.
 * Each point is { x, y, z } in world units.
 */
export const SPAWN_POINTS = Array.from({ length: 30 }).map(() => ({
  x: (Math.random() - 0.5) * 2 * (WORLD_HALF_SIZE - 1),
  y: SPAWN_HEIGHT,
  z: (Math.random() - 0.5) * 2 * (WORLD_HALF_SIZE - 1),
}));

/** Chest locations near each spawn point. */
export const CHEST_LOCATIONS = SPAWN_POINTS.map(sp => ({
  x: sp.x + 1.5,
  y: 0.5,
  z: sp.z + 1.5,
}));
