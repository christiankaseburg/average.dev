export interface ItemConfig {
  name: string;
  type: 'weapon' | 'armor' | 'consumable';
  rarity: 'common' | 'rare' | 'legendary';
}

export const ITEMS: Record<string, ItemConfig> = {
  'health_potion': {
    name: 'Health Potion',
    type: 'consumable',
    rarity: 'common'
  },
  'iron_chest': {
    name: 'Iron Chestplate',
    type: 'armor',
    rarity: 'rare'
  },
  'sword': {
    name: 'Sword',
    type: 'weapon',
    rarity: 'common'
  },
  'spear': {
    name: 'Spear',
    type: 'weapon',
    rarity: 'common'
  },
  'dagger': {
    name: 'Dagger',
    type: 'weapon',
    rarity: 'common'
  },
  'bow': {
    name: 'Bow',
    type: 'weapon',
    rarity: 'rare'
  }
};
