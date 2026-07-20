import { MapSchema } from '@colyseus/schema';
import { NpcState } from '../schemas/npc-state';
import { NPC_SPAWN_COUNT, NPC_TYPES, MAP_WIDTH, MAP_HEIGHT } from '@average.dev/arena-shared';

/** Padding from map edges — keeps NPCs out of border tiles */
const SPAWN_PADDING = 200;

const SPAWN_MIN_X = SPAWN_PADDING;
const SPAWN_MAX_X = MAP_WIDTH - SPAWN_PADDING;
const SPAWN_MIN_Y = SPAWN_PADDING;
const SPAWN_MAX_Y = MAP_HEIGHT - SPAWN_PADDING;

/**
 * Randomly spawns NPC_SPAWN_COUNT NPCs across the map and adds them to the
 * provided MapSchema. Called once in room.onCreate() for both sandbox and arena rooms.
 *
 * FUTURE — AI integration:
 *   Once an NPC AI system is implemented, it will read this.state.npcs and
 *   update each NpcState's (x, y, action) on every tick. For now NPCs are
 *   stationary and stay in 'idle' action.
 *
 * FUTURE — zone-aware spawning:
 *   Distribute NPCs more evenly using a grid or Poisson disk sampling
 *   to avoid clusters near map edges or player spawn points.
 */
export function spawnNpcs(npcs: MapSchema<NpcState>): void {
  for (let i = 0; i < NPC_SPAWN_COUNT; i++) {
    const id = `npc_${i}`;
    const type = NPC_TYPES[Math.floor(Math.random() * NPC_TYPES.length)];

    const npc = new NpcState();
    npc.assign({
      id,
      type,
      x: SPAWN_MIN_X + Math.random() * (SPAWN_MAX_X - SPAWN_MIN_X),
      y: SPAWN_MIN_Y + Math.random() * (SPAWN_MAX_Y - SPAWN_MIN_Y),
      health:    100,
      maxHealth: 100,
      action:    'idle',
    });

    npcs.set(id, npc);
    console.log(`[NpcSpawner] Spawned "${type}" at (${Math.round(npc.x)}, ${Math.round(npc.y)})`);
  }
}
