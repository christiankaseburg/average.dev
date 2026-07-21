import { IconButton, IconButtonProps } from '@chakra-ui/react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useColorMode } from '../../../context/Theme';

export function ThemeToggle(props: Omit<IconButtonProps, 'aria-label'>) {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      onClick={toggleColorMode}
      variant="ghost"
      aria-label="Toggle color mode"
      h="full"
      w="60px"
      rounded="none"
      _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
      {...props}
    >
      {colorMode === 'light' ? <LuSun /> : <LuMoon />}
    </IconButton>
  );
}
