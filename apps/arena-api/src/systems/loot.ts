import { ItemState } from '../schemas/item-state';
import { PlayerState } from '../schemas/player-state';
import { GameState } from '../schemas/game-state';
import { CHEST_LOCATIONS } from '../config/map';
import { ITEMS, SLOT_DEFAULTS, EquipmentSlot } from '@average.dev/arena-shared';
import { distanceSquaredXZ } from '../utils/math';

export function spawnChests(state: GameState) {
  let chestId = 0;
  for (const loc of CHEST_LOCATIONS) {
    const chest = new ItemState();
    chest.assign({
      id: `chest_${chestId++}`,
      itemType: 'chest',
      x: loc.x,
      y: loc.y,
      z: loc.z,
      isPickedUp: false
    });
    state.items.set(chest.id, chest);
  }
}

export function handleInteract(player: PlayerState, state: GameState) {
  if (!player.isAlive) return;
  const INTERACT_RANGE = 2.0; // world units
  const rangeSq = INTERACT_RANGE * INTERACT_RANGE;

  for (const [id, item] of state.items.entries()) {
    if (item.isPickedUp) continue;

    const distSq = distanceSquaredXZ(player, item);
    if (distSq <= rangeSq) {
      if (item.itemType === 'chest') {
        item.isPickedUp = true;
        state.items.delete(id);
        
        const weaponKeys = Object.keys(ITEMS).filter(k => ITEMS[k].slot === 'weapon');
        const randomWeaponKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        
        const droppedWeapon = new ItemState();
        droppedWeapon.assign({
          id: `item_${Date.now()}_${Math.random()}`,
          itemType: randomWeaponKey,
          x: item.x + (Math.random() * 2 - 1),
          y: 0.5,
          z: item.z + (Math.random() * 2 - 1),
          isPickedUp: false
        });
        state.items.set(droppedWeapon.id, droppedWeapon);
      } else {
        item.isPickedUp = true;
        state.items.delete(id);
        
        const config = ITEMS[item.itemType];
        if (config) {
          if (config.slot === 'consumable') {
            if (player.health < player.maxHealth) {
              player.health = Math.min(player.maxHealth, player.health + 20);
            }
          } else {
            (player as Record<string, unknown>)[config.slot] = item.itemType;
          }
        }
      }
      break;
    }
  }
}

/**
 * Spawn an item in front of a player (admin command).
 * Places the item 2 world units in front of the player's facing direction.
 */
export function handleAdminSpawn(
  player: PlayerState,
  itemType: string,
  state: GameState,
) {
  if (!ITEMS[itemType]) return; // Unknown item type

  const spawnDistance = 2.0;
  const forwardX = Math.sin(player.rotationY) * spawnDistance;
  const forwardZ = Math.cos(player.rotationY) * spawnDistance;

  const item = new ItemState();
  item.assign({
    id: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    itemType,
    x: player.x + forwardX,
    y: 0.5,
    z: player.z + forwardZ,
    isPickedUp: false,
  });
  state.items.set(item.id, item);
}

/**
 * Unequip an item from a player slot and drop it on the ground.
 * The slot parameter uses the EquipmentSlot name directly (e.g. 'weapon', 'top', 'legs').
 */
export function handleUnequip(
  player: PlayerState,
  slot: string,
  state: GameState,
) {
  if (!(slot in SLOT_DEFAULTS)) return;
  const itemType = (player as Record<string, unknown>)[slot] as string;
  const defaultVal = SLOT_DEFAULTS[slot as EquipmentSlot];
  if (!itemType || itemType === defaultVal) return;

  // Clear the slot
  (player as Record<string, unknown>)[slot] = defaultVal;

  // Spawn the item on the ground near the player
  const offsetX = (Math.random() * 2 - 1) * 0.5;
  const offsetZ = (Math.random() * 2 - 1) * 0.5;
  const droppedItem = new ItemState();
  droppedItem.assign({
    id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    itemType,
    x: player.x + offsetX,
    y: 0.5,
    z: player.z + offsetZ,
    isPickedUp: false,
  });
  state.items.set(droppedItem.id, droppedItem);
}
