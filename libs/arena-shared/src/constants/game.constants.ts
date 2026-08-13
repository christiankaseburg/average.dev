/**
 * Authoritative game world constants shared between arena-api and arena-web.
 *
 * All spatial values are in 3D world units (not pixels).
 * The server is authoritative for world size and broadcasts it via GameState.worldSize.
 * These defaults are used when initializing a room.
 */

/** Default world size in world units (server can override per-room). */
export const WORLD_SIZE = 20;

/** Half the world size — used for bounds clamping (±WORLD_HALF_SIZE). */
export const WORLD_HALF_SIZE = WORLD_SIZE / 2;

/** Player movement speed in world units per second. */
export const PLAYER_SPEED = 5;

/** Default spawn height (Y axis) for new players. */
export const SPAWN_HEIGHT = 3;

/** Server simulation tick rate in Hz. */
export const TICK_RATE = 20;

/** Server simulation interval in ms (1000 / TICK_RATE). */
export const TICK_INTERVAL_MS = 1000 / TICK_RATE;

/** Maximum input send rate from client in Hz (should match TICK_RATE). */
export const INPUT_SEND_RATE = TICK_RATE;
