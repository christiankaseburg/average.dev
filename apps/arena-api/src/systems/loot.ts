import { ItemState } from '../schemas/item-state';
import { PlayerState } from '../schemas/player-state';
import { GameState } from '../schemas/game-state';
import { CHEST_LOCATIONS } from '../config/map';
import { ITEMS } from '../config/items';
import { distanceSquared } from '../utils/math';

export function spawnChests(state: GameState) {
  let chestId = 0;
  for (const loc of CHEST_LOCATIONS) {
    const chest = new ItemState();
    chest.assign({
      id: `chest_${chestId++}`,
      itemType: 'chest',
      x: loc.x,
      y: loc.y,
      isPickedUp: false
    });
    state.items.set(chest.id, chest);
  }
}

export function handleInteract(player: PlayerState, state: GameState) {
  if (!player.isAlive) return;
  const INTERACT_RANGE = 60;
  const rangeSq = INTERACT_RANGE * INTERACT_RANGE;

  for (const [id, item] of state.items.entries()) {
    if (item.isPickedUp) continue;

    const distSq = distanceSquared(player, item);
    if (distSq <= rangeSq) {
      if (item.itemType === 'chest') {
        // Open chest
        item.isPickedUp = true;
        state.items.delete(id);
        
        // Spawn random weapon
        const weaponKeys = Object.keys(ITEMS).filter(k => ITEMS[k].type === 'weapon');
        const randomWeaponKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        
        const droppedWeapon = new ItemState();
        droppedWeapon.assign({
          id: `item_${Date.now()}_${Math.random()}`,
          itemType: randomWeaponKey,
          x: item.x + (Math.random() * 40 - 20),
          y: item.y + (Math.random() * 40 - 20),
          isPickedUp: false
        });
        state.items.set(droppedWeapon.id, droppedWeapon);
        
      } else {
        // Pick up item
        item.isPickedUp = true;
        state.items.delete(id);
        
        const config = ITEMS[item.itemType];
        if (config) {
          if (config.type === 'weapon') {
            player.weapon = item.itemType;
          } else if (config.type === 'armor') {
            player.armor = item.itemType;
          } else if (config.type === 'consumable' && player.health < player.maxHealth) {
             player.health = Math.min(player.maxHealth, player.health + 20); // Example heal
          }
        }
      }
      break; // Only interact with one thing at a time
    }
  }
}
