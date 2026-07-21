import { Outlet } from 'react-router-dom';
import { Flex, Box } from '@chakra-ui/react';
import { useAuth } from '../../../context/Auth';
import { useColorModeValue } from '../../../context/Theme';
import { useState } from 'react';
import { UserDrawer } from './components/UserDrawer';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

export function MainLayout() {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const contentBg = useColorModeValue('white', 'gray.900');

  return (
    <Flex h="100vh" direction="column" overflow="hidden">
      {/* Top Header */}
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenUserDrawer={() => setIsDrawerOpen(true)}
        user={user}
      />

      {/* Main Layout Body (Sidebar + Content) */}
      <Flex flex="1" overflow="hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {/* Scrollable Page Content */}
        <Box as="main" flex="1" overflowY="auto" p="6" bg={contentBg}>
          <Outlet />
        </Box>
      </Flex>

      {/* User Profile Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Flex>
  );
}

export default MainLayout;
