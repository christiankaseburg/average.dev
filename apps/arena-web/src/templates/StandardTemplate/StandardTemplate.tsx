import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@average.dev/arena-ui';
import styles from './StandardTemplate.module.scss';

/**
 * StandardTemplate — layout shell for content-focused pages.
 * Provides the grid background, full-screen centering, and the
 * global theme toggle. Pages rendered via <Outlet /> need only
 * return their own content (e.g. a Panel) without layout concerns.
 */
export function StandardTemplate() {
  return (
    <div className={styles.container}>
      <ThemeToggle style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
      <Outlet />
    </div>
  );
}
