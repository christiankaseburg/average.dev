import { Outlet } from 'react-router-dom';
import { Flex, Box } from '@chakra-ui/react';
import { useColorModeValue } from '../../../context/Theme';
import { ThemeToggle } from '../../../components/Theme/ThemeToggle';

export function EmptyLayout({ children }: { children?: React.ReactNode }) {
  const bg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex
      h="100%"
      w="100%"
      align="center"
      justify="center"
      bg={bg}
      pos="relative"
    >
      <Box pos="absolute" top="4" right="4">
        <ThemeToggle h="10" w="10" rounded="md" />
      </Box>
      {children || <Outlet />}
    </Flex>
  );
}

export default EmptyLayout;
