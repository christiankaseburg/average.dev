import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GameTemplate.module.scss';

/**
 * GameTemplate — bare full-screen shell for gameplay pages.
 * No UI chrome; the Three.js canvas and HUD own all visual elements.
 */
export function GameTemplate() {
  return (
    <div className={styles.container}>
      <Outlet />
    </div>
  );
}
