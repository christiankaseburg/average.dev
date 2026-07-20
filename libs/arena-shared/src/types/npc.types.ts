/**
 * Shared NPC types used by both arena-api (spawning/AI) and arena-web (rendering).
 */

/**
 * High-level semantic action state broadcast by the server.
 * The client maps this to the appropriate animation.
 *
 * Server owns: what the NPC is doing (semantic)
 * Client owns: which specific animation plays (presentation)
 *   idle      → idle loop
 *   walking   → walk loop
 *   attacking → attack1 or attack2 (client picks for visual variety)
 *   hurt      → hurt (plays once)
 *   dead      → death (plays once, then freezes)
 */
export type NpcAction = 'idle' | 'walking' | 'attacking' | 'hurt' | 'dead';

/**
 * Lightweight snapshot of an NPC's state, synced from server → client
 * via Colyseus state patches. The client uses this to position and
 * animate NpcEntity instances without importing Colyseus schemas.
 */
export interface NpcSnapshot {
  id: string;
  /** NPC type key — must match a key in arena-web's NPC_REGISTRY (e.g. 'demon_a') */
  type: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  /** Server's high-level action; client derives the specific animation from this */
  action: NpcAction;
}

/**
 * Broadcast event when an NPC is hit (future: combat integration).
 */
export interface NpcHitEvent {
  npcId: string;
  attackerId: string;
  damage: number;
  killed: boolean;
}
