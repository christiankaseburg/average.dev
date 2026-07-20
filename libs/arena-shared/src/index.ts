// Types
export type { Facing, PlayerInput, InputCommand } from './types/input.types';
export type {
  GamePhase,
  PlayerSnapshot,
  ZoneSnapshot,
  ItemSnapshot,
  PlayerAttackedEvent,
  PlayerHitEvent,
  ArenaRoomMetadata,
  GameEventCallback,
} from './types/game.types';

export type {
  NpcAction,
  NpcSnapshot,
  NpcHitEvent,
} from './types/npc.types';



// Constants
export {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  MAP_TILES,
  PLAYER_SPEED,
  TICK_RATE,
  TICK_INTERVAL_MS,
  INPUT_SEND_RATE,
  RECONCILE_SNAP_THRESHOLD_SQ,
  RECONCILE_TELEPORT_THRESHOLD,
} from './constants/game.constants';

export type { WeaponConfig } from './constants/weapons.constants';
export { WEAPONS } from './constants/weapons.constants';

export { NPC_SPAWN_COUNT, NPC_TYPES } from './constants/npc.constants';
export type { NpcType } from './constants/npc.constants';
