import React from 'react';
import { Box, Spinner, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '../../context/Theme';

export const SplashScreen: React.FC = () => {
  const bg = useColorModeValue('white', 'gray.900');
  const color = useColorModeValue('blue.500', 'blue.200');

  return (
    <Box
      bg={bg}
      h="100vh"
      w="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap="4">
        <Spinner
          size="xl"
          color={color}
          borderWidth="4px"
          animationDuration="0.65s"
        />
      </VStack>
    </Box>
  );
};
