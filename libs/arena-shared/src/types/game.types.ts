/**
 * Shared game state types used by both the server (arena-api) and client (arena-web).
 */

import type { Facing } from './input.types';

export type { Facing };

/**
 * All valid game phases. Matches the server's `GameState.phase` field.
 */
export type GamePhase = 'waiting' | 'countdown' | 'playing' | 'ended';

/**
 * A lightweight snapshot of a player's renderable state, used by the client
 * to create and update player entities without importing Colyseus schemas.
 */
export interface PlayerSnapshot {
  sessionId: string;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  health: number;
  maxHealth: number;
  weapon: string;
  armor: string;
  kills: number;
  isAlive: boolean;
  lastProcessedInputSeq: number;
  bodyType: string;
  hairStyle: string;
  deviceType: string;
}

/**
 * A lightweight snapshot of the zone/circle state for rendering.
 */
export interface ZoneSnapshot {
  currentCenterX: number;
  currentCenterY: number;
  currentRadius: number;
  targetCenterX: number;
  targetCenterY: number;
  targetRadius: number;
  damagePerSecond: number;
  phase: number;
}

/**
 * A lightweight snapshot of an item for rendering.
 */
export interface ItemSnapshot {
  id: string;
  itemType: string;
  x: number;
  y: number;
  isPickedUp: boolean;
}

/**
 * Payload broadcast when a player attacks.
 */
export interface PlayerAttackedEvent {
  sessionId: string;
  weapon: string;
}

/**
 * Payload broadcast when a player is hit.
 */
export interface PlayerHitEvent {
  targetId: string;
  attackerId: string;
  damage: number;
  killed: boolean;
}

/**
 * Metadata attached to an ArenaRoom or SandboxRoom listing.
 * Set on the server via setMetadata() and read by the client for room browsing.
 */
export interface ArenaRoomMetadata {
  roomCode: string;
  matchMode: string;
  isPrivate: boolean;
}

/**
 * Callback type for game loop event broadcasts.
 * Used by GameLoop to notify rooms of combat events.
 */
export type GameEventCallback = (event: string, data: PlayerAttackedEvent | PlayerHitEvent) => void;

