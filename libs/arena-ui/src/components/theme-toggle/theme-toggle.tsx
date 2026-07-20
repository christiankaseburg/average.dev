import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import styles from './theme-toggle.module.scss';

export function ThemeToggle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { theme, setTheme } = useTheme();

  // Handle SSR (next-themes sets theme to 'system' initially sometimes)
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <motion.button
      className={`${styles.themeToggle} ${className || ''}`}
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      style={style}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0 }}
        style={{ position: 'absolute' }}
      >
        <Moon size={20} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? -180 : 0, scale: isDark ? 0 : 1 }}
        style={{ position: 'absolute' }}
      >
        <Sun size={20} />
      </motion.div>
    </motion.button>
  );
}
