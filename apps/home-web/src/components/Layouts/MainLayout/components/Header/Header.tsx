import {
  Flex,
  HStack,
  IconButton,
  Heading,
  Tooltip,
  TooltipPositioner,
  Portal,
} from '@chakra-ui/react';
import { LuMenu } from 'react-icons/lu';
import { ThemeToggle } from '../../../../../components/Theme/ThemeToggle';
import { useColorModeValue } from '../../../../../context/Theme';
import { User } from '../../../../../services/auth/AuthService';
import { UserBlock } from '../UserBlock';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenUserDrawer: () => void;
  user: User | null;
}

export function Header({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenUserDrawer,
  user,
}: HeaderProps) {
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Flex
      h="60px"
      bg={headerBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      align="center"
      justify="space-between"
      flexShrink={0}
      zIndex="sticky"
    >
      <HStack gap="0" h="full">
        <Tooltip.Root openDelay={0} closeDelay={0}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={onToggleSidebar}
              variant="ghost"
              aria-label="Toggle Navigation"
              h="full"
              w="60px"
              rounded="none"
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            >
              <LuMenu />
            </IconButton>
          </Tooltip.Trigger>
          <Portal>
            <TooltipPositioner>
              <Tooltip.Content>
                <Tooltip.Arrow>
                  <Tooltip.ArrowTip />
                </Tooltip.Arrow>
                {isSidebarCollapsed
                  ? 'Expand Navigation'
                  : 'Collapse Navigation'}
              </Tooltip.Content>
            </TooltipPositioner>
          </Portal>
        </Tooltip.Root>

        <Heading size="md" ml="4" display={{ base: 'none', md: 'block' }}>
          Internal Admin
        </Heading>
      </HStack>

      <HStack gap="0" h="full">
        <ThemeToggle />
        <UserBlock user={user} onClick={onOpenUserDrawer} />
      </HStack>
    </Flex>
  );
}
