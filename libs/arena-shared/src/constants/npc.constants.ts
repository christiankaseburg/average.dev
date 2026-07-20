/**
 * NPC-related game constants shared between arena-api and arena-web.
 */

/**
 * How many NPCs to spawn per room on creation.
 * Tunable without changing room or client code.
 */
export const NPC_SPAWN_COUNT = 5;

/**
 * All available NPC type identifiers.
 * Must match keys in arena-web's NPC_REGISTRY.
 * The server randomly selects from this list when spawning.
 */
export const NPC_TYPES = ['demon_a'] as const;

/** Union type of all valid NPC type strings */
export type NpcType = typeof NPC_TYPES[number];
