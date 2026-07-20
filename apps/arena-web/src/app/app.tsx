import React from 'react';
import { ThemeProvider } from 'next-themes';
import { GameProvider } from '../context/GameContext';
import { AppRouter } from '../router/AppRouter';
import styles from './app.module.scss';

/**
 * Root application shell.
 * Provides theme, game session context, and routing.
 * All page-level concerns (layout, data) live in pages/ and the router.
 */
export function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <GameProvider>
        <div className={styles.appContainer}>
          <AppRouter />
        </div>
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
