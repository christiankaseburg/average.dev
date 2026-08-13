import React from 'react';
import { useItems } from '../../context/ItemContext';
import { useGame } from '../../context/GameContext';
import { getItemEntry } from '../../engine/items/item-registry';
import { EQUIPMENT_SLOTS, SLOT_LABELS } from '@average.dev/arena-shared';
import type { EquipmentSlot } from '@average.dev/arena-shared';
import styles from './EquipmentHUD.module.scss';

export function EquipmentHUD() {
  const { state, requestUnequip } = useItems();
  const { state: gameState } = useGame();
  
  const handleUnequip = (slot: EquipmentSlot) => {
    if (gameState.room) {
      requestUnequip(gameState.room, slot);
    }
  };

  const slots = EQUIPMENT_SLOTS.map(slot => ({
    id: slot,
    label: SLOT_LABELS[slot],
    value: state.equippedItems[slot],
  }));

  return (
    <div className={styles.container}>
      {slots.map(slot => {
        const isEmpty = !slot.value || slot.value === 'none' || slot.value === 'fists';
        const entry = !isEmpty ? getItemEntry(slot.value as string) : null;
        const rarityClass = entry ? styles[`rarity-${entry.rarity}`] : '';

        return (
          <div 
            key={slot.id}
            className={`${styles.slotCard} ${isEmpty ? styles.empty : styles.filled} ${rarityClass}`}
            onClick={() => !isEmpty && handleUnequip(slot.id as EquipmentSlot)}
          >
            <span className={styles.slotLabel}>{slot.label}</span>
            
            {!isEmpty && entry ? (
              <>
                <span className={styles.itemName}>{entry.name}</span>
                <div className={styles.unequipOverlay}>Unequip</div>
              </>
            ) : (
              <span className={styles.itemName} style={{ color: '#6b7280' }}>Empty</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
