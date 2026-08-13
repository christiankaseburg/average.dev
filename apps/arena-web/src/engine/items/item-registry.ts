import type { EquipmentSlot } from '@average.dev/arena-shared';
import { ITEMS, EQUIPMENT_SLOTS } from '@average.dev/arena-shared';
import type { ItemDefinition, ItemRarity } from '@average.dev/arena-shared';

// ── Client-Only Rendering Extension ──────────────────────────────────────────

/**
 * Client-side rendering metadata for an item.
 * Extends the shared ItemDefinition with 3D/rendering-specific fields.
 */
export interface ItemRenderConfig {
  /** Path to the .glb model file in public/ */
  modelPath: string;
  /** Scale multiplier when rendered on the ground */
  groundScale: number;
  /** Fallback color used for placeholder geometry when GLB is unavailable */
  placeholderColor: string;
}

/**
 * Full client item entry — shared item data + rendering config.
 */
export type ItemRegistryEntry = ItemDefinition & ItemRenderConfig;

/**
 * Client rendering config for items that have 3D models.
 * Keys must match item IDs in the shared ITEMS registry.
 */
const ITEM_RENDER_CONFIG: Record<string, ItemRenderConfig> = {
  // ── Weapons ──────────────────────────────────────────────────────────────
  sword: {
    modelPath: '/character_v2/sword.glb',
    groundScale: 0.5,
    placeholderColor: '#a0a0a0',
  },
  bow: {
    modelPath: '/character_v2/bow.glb',
    groundScale: 0.5,
    placeholderColor: '#8b5e3c',
  },

  // ── Armor ────────────────────────────────────────────────────────────────
  iron_top: {
    modelPath: '/character_v2/top.glb',
    groundScale: 0.4,
    placeholderColor: '#6a7b8b',
  },
  iron_pants: {
    modelPath: '/character_v2/pants.glb',
    groundScale: 0.4,
    placeholderColor: '#7a6b5a',
  },
  iron_belt: {
    modelPath: '/character_v2/belt.glb',
    groundScale: 0.4,
    placeholderColor: '#8b7355',
  },
  iron_boots: {
    modelPath: '/character_v2/boots.glb',
    groundScale: 0.4,
    placeholderColor: '#6b5b4a',
  },

  // ── Cape / Accessory ─────────────────────────────────────────────────────
  cape: {
    modelPath: '/character_v2/cape.glb',
    groundScale: 0.4,
    placeholderColor: '#8b2252',
  },
  quiver: {
    modelPath: '/character_v2/quiver.glb',
    groundScale: 0.4,
    placeholderColor: '#8b6914',
  },
};

/**
 * Merged registry: shared item data + client rendering config.
 * Only items with a render config entry are included (excludes consumables etc).
 */
export const ITEM_REGISTRY: Record<string, ItemRegistryEntry> = {};

for (const [id, definition] of Object.entries(ITEMS)) {
  const renderConfig = ITEM_RENDER_CONFIG[id];
  if (renderConfig) {
    ITEM_REGISTRY[id] = { ...definition, ...renderConfig };
  }
}

/**
 * Rarity → accent color mapping for UI and 3D glow effects.
 */
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

/**
 * Look up an item's registry entry. Returns undefined for unknown types.
 */
export function getItemEntry(itemType: string): ItemRegistryEntry | undefined {
  return ITEM_REGISTRY[itemType];
}

/**
 * Get all item types available for spawning (used by admin panel).
 */
export function getSpawnableItems(): Array<{ itemType: string } & ItemRegistryEntry> {
  return Object.entries(ITEM_REGISTRY).map(([itemType, entry]) => ({
    itemType,
    ...entry,
  }));
}

/**
 * Get all items that equip to a specific slot (used by Equipment Viewer).
 */
export function getItemsForSlot(
  slot: EquipmentSlot,
): Array<{ itemType: string } & ItemRegistryEntry> {
  return Object.entries(ITEM_REGISTRY)
    .filter(([, entry]) => entry.slot === slot)
    .map(([itemType, entry]) => ({ itemType, ...entry }));
}
