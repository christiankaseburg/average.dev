import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerPositioner,
  DrawerFooter,
  Portal,
  Button,
} from '@chakra-ui/react';
import { UserProfile } from '../UserProfile';
import { LuX, LuLogOut } from 'react-icons/lu';
import { useAuth } from '../../../../../context/Auth';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserDrawer({ isOpen, onClose }: UserDrawerProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
      size="md"
    >
      <Portal>
        <DrawerBackdrop />
        <DrawerPositioner>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>My Profile</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              <UserProfile variant="drawer" />
            </DrawerBody>
            <DrawerFooter>
              <Button
                w="full"
                variant="subtle"
                colorPalette="red"
                onClick={handleLogout}
              >
                <LuLogOut /> Log Out
              </Button>
            </DrawerFooter>
            <DrawerCloseTrigger
              position="absolute"
              top="4"
              right="4"
              boxSize="10"
              fontSize="2xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _hover={{ bg: 'red.500', color: 'white' }}
            >
              <LuX />
            </DrawerCloseTrigger>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </DrawerRoot>
  );
}
