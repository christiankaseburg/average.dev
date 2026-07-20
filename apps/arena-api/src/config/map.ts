export const MAP_WIDTH = 2048;
export const MAP_HEIGHT = 2048;
export const TILE_SIZE = 32;

export const GRID_WIDTH = MAP_WIDTH / TILE_SIZE;
export const GRID_HEIGHT = MAP_HEIGHT / TILE_SIZE;

export type CollisionGrid = number[][];

/**
 * Generates a collision grid for the arena map.
 *
 * Currently returns a fully open grid (no walls). Client-side prediction in
 * player.ts already clamps movement to map bounds, so border walls are redundant
 * and cause reconciliation jitter when prediction overshoots tile boundaries.
 *
 * A real procedural map generator with rooms, corridors, and obstacles should
 * replace this before a full launch.
 */
export function generateCollisionGrid(): CollisionGrid {
  const grid: CollisionGrid = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push(0); // 0 = open — fully traversable
    }
    grid.push(row);
  }
  return grid;
}

export const SPAWN_POINTS = Array.from({ length: 30 }).map(() => ({
  x: Math.floor(Math.random() * (MAP_WIDTH - 200)) + 100,
  y: Math.floor(Math.random() * (MAP_HEIGHT - 200)) + 100
}));

// Put a chest exactly near every spawn point so players always find one immediately
export const CHEST_LOCATIONS = SPAWN_POINTS.map(sp => ({
  x: sp.x + 40,
  y: sp.y + 40
}));
