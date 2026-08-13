/**
 * Canonical input types shared between arena-api (server) and arena-web (client).
 */

/**
 * Raw combat input produced by the client. Movement is handled via
 * direct 3D position messages, not dx/dy.
 */
export interface PlayerInput {
  attack: boolean;
  interact: boolean;
  weaponSlot: number | null;
}

/**
 * A fully-formed input packet sent over the network to the server.
 * Extends PlayerInput with a monotonically increasing sequence number.
 */
export interface InputCommand extends PlayerInput {
  seq: number;
}
