import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../../context/Auth';

export default function HomePage() {
  const { user } = useAuth();
  return (
    <Box p={8}>
      <VStack align="start" gap={4}>
        <Heading>Welcome to Home-Web!</Heading>
        <Text>You are logged in as: {user?.email}</Text>
      </VStack>
    </Box>
  );
}
