import { Schema, type } from "@colyseus/schema";

/**
 * Colyseus schema for a single NPC instance.
 * Synced to all clients via state patches every tick.
 *
 * Keep fields minimal — every field adds network overhead.
 * Animation decisions (attack1 vs attack2) are left to the client.
 */
export class NpcState extends Schema {
  /** Unique ID for this NPC instance (e.g. "npc_0") */
  @type("string") id!: string;

  /** NPC type key — must match a key in arena-web's NPC_REGISTRY (e.g. "demon_a") */
  @type("string") type!: string;

  @type("float32") x!: number;
  @type("float32") y!: number;

  @type("uint8") health!: number;
  @type("uint8") maxHealth!: number;

  /**
   * High-level semantic action broadcast to clients.
   * Client maps this to a specific animation (see NpcEntity.updateFromServer).
   * Values: 'idle' | 'walking' | 'attacking' | 'hurt' | 'dead'
   */
  @type("string") action!: string;
}
