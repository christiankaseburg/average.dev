// Types
export type { PlayerInput, InputCommand } from './types/input.types';
export type {
  GamePhase,
  EquipmentSlot,
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

// Constants — 3D world system
export {
  WORLD_SIZE,
  WORLD_HALF_SIZE,
  PLAYER_SPEED,
  SPAWN_HEIGHT,
  TICK_RATE,
  TICK_INTERVAL_MS,
  INPUT_SEND_RATE,
} from './constants/game.constants';

export type { WeaponConfig } from './constants/weapons.constants';
export { WEAPONS } from './constants/weapons.constants';

export { NPC_SPAWN_COUNT, NPC_TYPES } from './constants/npc.constants';
export type { NpcType } from './constants/npc.constants';

// Constants — Equipment & Items
export {
  EQUIPMENT_SLOTS,
  SLOT_LABELS,
  SLOT_DEFAULTS,
  ITEMS,
} from './constants/equipment.constants';
export type {
  ItemRarity,
  ItemSlotType,
  ItemDefinition,
} from './constants/equipment.constants';
