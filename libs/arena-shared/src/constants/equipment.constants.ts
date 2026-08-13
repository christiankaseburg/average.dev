import type { EquipmentSlot } from '../types/game.types';

// ── Slot Constants ───────────────────────────────────────────────────────────

/** Ordered list of all equipment slots. Single source of truth. */
export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon',
  'shield',
  'helm',
  'top',
  'legs',
  'belt',
  'boots',
  'cape',
  'accessory',
];

/** Display labels for each equipment slot. */
export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: 'Weapon',
  shield: 'Shield',
  helm: 'Helm',
  top: 'Top',
  legs: 'Legs',
  belt: 'Belt',
  boots: 'Boots',
  cape: 'Cape',
  accessory: 'Accessory',
};

/**
 * Default (empty) value for each equipment slot.
 * Used by server when initializing players and by client for UI state.
 */
export const SLOT_DEFAULTS: Record<EquipmentSlot, string> = {
  weapon: 'fists',
  shield: 'none',
  helm: 'none',
  top: 'none',
  legs: 'none',
  belt: 'none',
  boots: 'none',
  cape: 'none',
  accessory: 'none',
};

// ── Item Definitions ─────────────────────────────────────────────────────────

/** Item rarity tiers — drives UI accents and drop weighting. */
export type ItemRarity = 'common' | 'rare' | 'legendary';

/** Item slot type — an equipment slot or 'consumable' for single-use items. */
export type ItemSlotType = EquipmentSlot | 'consumable';

/**
 * Shared item definition used by both server and client.
 * Contains only game-logic data — rendering data lives in the client registry.
 */
export interface ItemDefinition {
  /** Display name shown in UI. */
  name: string;
  /** Which equipment slot this item occupies, or 'consumable'. */
  slot: ItemSlotType;
  /** Rarity tier. */
  rarity: ItemRarity;
}

/**
 * Single registry of all game items.
 * Keys are the canonical item type IDs used in Colyseus state and messages.
 */
export const ITEMS: Record<string, ItemDefinition> = {
  health_potion: { name: 'Health Potion', slot: 'consumable', rarity: 'common' },
  sword:         { name: 'Sword',         slot: 'weapon',     rarity: 'common' },
  bow:           { name: 'Bow',           slot: 'weapon',     rarity: 'rare' },
  iron_top:      { name: 'Iron Armor',    slot: 'top',        rarity: 'rare' },
  iron_pants:    { name: 'Iron Pants',    slot: 'legs',       rarity: 'common' },
  iron_belt:     { name: 'Iron Belt',     slot: 'belt',       rarity: 'common' },
  iron_boots:    { name: 'Iron Boots',    slot: 'boots',      rarity: 'common' },
  cape:          { name: 'Cape',          slot: 'cape',       rarity: 'rare' },
  quiver:        { name: 'Quiver',        slot: 'accessory',  rarity: 'common' },
};
