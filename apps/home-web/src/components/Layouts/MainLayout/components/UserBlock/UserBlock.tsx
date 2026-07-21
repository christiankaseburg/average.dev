import { HStack, Avatar, VStack, Text } from '@chakra-ui/react';
import { useColorModeValue } from '../../../../../context/Theme';
import { User } from '../../../../../services/auth/AuthService';

interface UserBlockProps {
  user: User | null;
  onClick: () => void;
}

export function UserBlock({ user, onClick }: UserBlockProps) {
  const userBlockHoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <HStack
      gap="3"
      cursor="pointer"
      onClick={onClick}
      h="full"
      px="4"
      borderRadius="0"
      _hover={{ bg: userBlockHoverBg }}
      justifyContent="flex-start"
    >
      <Avatar.Root size="sm">
        <Avatar.Fallback name={user?.name || 'U'} />
      </Avatar.Root>
      <VStack gap="0" align="flex-start" display={{ base: 'none', md: 'flex' }}>
        <Text fontSize="sm" fontWeight="bold" lineHeight="1">
          {user?.name || 'User'}
        </Text>
        <Text fontSize="xs" color="gray.500" lineHeight="1">
          {user?.email}
        </Text>
      </VStack>
    </HStack>
  );
}
