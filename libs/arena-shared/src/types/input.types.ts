/**
 * Canonical input types shared between arena-api (server) and arena-web (client).
 *
 * IMPORTANT: This file has zero runtime dependencies — it must remain pure TS
 * so it can be consumed by both the Node.js CommonJS server and the Vite ESM client.
 */

/**
 * Facing direction for a player character. Matches the server's authoritative
 * `player.facing` field in PlayerState.
 */
export type Facing = 'up' | 'down' | 'left' | 'right';

/**
 * Raw input produced each frame by the client's InputSystem before a sequence
 * number is assigned. This is what `getCommand()` returns.
 */
export interface PlayerInput {
  dx: number;
  dy: number;
  attack: boolean;
  interact: boolean;
  weaponSlot: number | null;
  /**
   * Explicit facing override — sent when the player clicks to attack on
   * desktop so the server uses the mouse direction rather than movement direction.
   */
  facing?: Facing;
}

/**
 * A fully-formed input packet sent over the network to the server.
 * Extends PlayerInput with a monotonically increasing sequence number
 * used for server reconciliation.
 */
export interface InputCommand extends PlayerInput {
  seq: number;
}
