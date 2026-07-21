import {
  Box,
  VStack,
  Flex,
  Text,
  Link,
  Tooltip,
  TooltipPositioner,
  Portal,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { LuLayoutDashboard, LuListTree } from 'react-icons/lu';
import { useColorModeValue } from '../../../../../context/Theme';

interface SidebarProps {
  isCollapsed: boolean;
}

const NavItem = ({
  to,
  icon,
  label,
  isSidebarCollapsed,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  isSidebarCollapsed: boolean;
}) => {
  const location = useLocation();
  const activeNavItemBg = useColorModeValue('blue.50', 'blue.900');
  const activeNavItemColor = useColorModeValue('blue.600', 'blue.200');
  const hoverNavItemBg = useColorModeValue('gray.100', 'gray.800');
  const activeClickBg = useColorModeValue('gray.200', 'gray.700');

  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const content = (
    <Link
      asChild
      _hover={{ textDecor: 'none' }}
      w="full"
      display="block"
      outline="none"
      _focus={{ boxShadow: 'none' }}
      _focusVisible={{ boxShadow: 'none' }}
    >
      <RouterLink to={to}>
        <Flex
          align="center"
          px={isSidebarCollapsed ? 3 : 4} // 3 (12px) approx center for icon vs 4 (16px) standard
          pl={isSidebarCollapsed ? 5 : 4} // 5 (20px) centers 18px icon in 60px box. 4 (16px) is standard.
          h="48px"
          justify="flex-start" // Always start to prevent jump
          gap="0" // Handle gap via margin on Text for animation
          borderRadius="0"
          bg={isActive ? activeNavItemBg : 'transparent'}
          color={isActive ? activeNavItemColor : 'inherit'}
          _hover={{ bg: isActive ? activeNavItemBg : hoverNavItemBg }}
          _active={{
            bg: activeClickBg,
            borderLeftColor: 'gray.400',
            outline: 'none',
            boxShadow: 'none',
          }}
          _focus={{ outline: 'none', boxShadow: 'none' }}
          _focusVisible={{ outline: 'none', boxShadow: 'none' }}
          position="relative"
          borderLeftWidth="4px"
          borderLeftColor={isActive ? 'blue.500' : 'transparent'}
          transition="background 0.2s, padding 0.2s"
        >
          <Box as={icon} fontSize="lg" flexShrink={0} />

          <Text
            fontSize="sm"
            fontWeight={isActive ? 'semibold' : 'medium'}
            truncate
            whiteSpace="nowrap"
            opacity={isSidebarCollapsed ? 0 : 1}
            maxW={isSidebarCollapsed ? 0 : '200px'}
            ml={isSidebarCollapsed ? 0 : 3}
            transition="all 0.2s"
            overflow="hidden"
          >
            {label}
          </Text>
        </Flex>
      </RouterLink>
    </Link>
  );

  if (isSidebarCollapsed) {
    return (
      <Tooltip.Root positioning={{ placement: 'right' }} openDelay={0} closeDelay={0}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Portal>
          <TooltipPositioner>
            <Tooltip.Content>
              <Tooltip.Arrow>
                <Tooltip.ArrowTip />
              </Tooltip.Arrow>
              {label}
            </Tooltip.Content>
          </TooltipPositioner>
        </Portal>
      </Tooltip.Root>
    );
  }

  return content;
};

export function Sidebar({ isCollapsed }: SidebarProps) {
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      w={isCollapsed ? '60px' : 'auto'}
      minW={isCollapsed ? '60px' : '250px'}
      maxW={isCollapsed ? '60px' : '320px'}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={borderColor}
      flexShrink={0}
      transition="min-width 0.2s, max-width 0.2s, width 0.2s"
      display={{ base: 'none', md: 'block' }}
    >
      <VStack align="stretch" gap="0">
        <NavItem
          to="/home"
          icon={LuLayoutDashboard}
          label="Home"
          isSidebarCollapsed={isCollapsed}
        />
      </VStack>
    </Box>
  );
}
