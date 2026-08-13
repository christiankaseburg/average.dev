import React from 'react';
import { useAdminPanel } from './useAdminPanel';
import { useItems } from '../../context/ItemContext';
import { useGame } from '../../context/GameContext';
import { getSpawnableItems } from '../../engine/items/item-registry';
import styles from './AdminPanel.module.scss';

export function AdminPanel() {
  const { isOpen, toggle, close } = useAdminPanel();
  const { requestSpawn } = useItems();
  const { state: gameState } = useGame();
  
  const spawnableItems = getSpawnableItems();

  const handleSpawn = (itemType: string) => {
    if (gameState.room) {
      requestSpawn(gameState.room, itemType);
    }
  };

  return (
    <>
      <button className={styles.toggleBtn} onClick={toggle}>
        <span role="img" aria-label="Admin">⚡</span> Admin
      </button>

      <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Spawn Items</h2>
          <button className={styles.closeBtn} onClick={close}>&times;</button>
        </div>
        
        <div className={styles.content}>
          {spawnableItems.map(item => (
            <div 
              key={item.itemType} 
              className={`${styles.itemCard} ${styles[`rarity-${item.rarity}`]}`}
              onClick={() => handleSpawn(item.itemType)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.typeBadge}>{item.slot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
