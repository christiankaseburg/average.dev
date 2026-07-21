'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export type ColorMode = 'light' | 'dark';

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return {
      colorMode: 'light',
      setColorMode: () => {
        /* noop */
      },
      toggleColorMode: () => {
        /* noop */
      },
    };
  }

  const colorMode = (theme === 'system' ? systemTheme : theme) as ColorMode;

  return {
    colorMode: colorMode || 'light',
    setColorMode: setTheme,
    toggleColorMode: () => {
      setTheme(colorMode === 'light' ? 'dark' : 'light');
    },
  };
}

export function useColorModeValue<T>(light: T, dark: T): T {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? dark : light;
}
