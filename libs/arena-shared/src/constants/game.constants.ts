/**
 * Authoritative game world constants shared between arena-api and arena-web.
 * The client uses these to match server-side prediction bounds exactly.
 */

/** Map width in pixels (64 tiles × 32px) */
export const MAP_WIDTH = 2048;

/** Map height in pixels (64 tiles × 32px) */
export const MAP_HEIGHT = 2048;

/** Size of a single tile in pixels */
export const TILE_SIZE = 32;

/** Number of tiles along each axis */
export const MAP_TILES = MAP_WIDTH / TILE_SIZE; // 64

/** Player movement speed in pixels per second */
export const PLAYER_SPEED = 200;

/** Server simulation tick rate in Hz */
export const TICK_RATE = 20;

/** Server simulation interval in ms (1000 / TICK_RATE) */
export const TICK_INTERVAL_MS = 1000 / TICK_RATE;

/** Maximum input send rate from client in Hz (should match TICK_RATE) */
export const INPUT_SEND_RATE = TICK_RATE;

/** Radius threshold below which the server snaps to stop position (px²) */
export const RECONCILE_SNAP_THRESHOLD_SQ = 25;

/** Radius threshold above which the server hard-teleports the player (px) */
export const RECONCILE_TELEPORT_THRESHOLD = 150;
