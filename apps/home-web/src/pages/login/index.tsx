import { Button, Center, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useLocation } from 'react-router-dom';
import { useColorModeValue } from '../../context/Theme';
import { authService } from '../../services/auth/AuthService';

export default function LoginPage() {
  const location = useLocation();

  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const buttonBg = useColorModeValue('white', 'gray.800');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');
  const buttonTextColor = useColorModeValue('gray.700', 'white');

  const handleLogin = () => {
    // If the user was redirected here, preserve where they wanted to go
    const params = new URLSearchParams(location.search);
    const returnUrl = params.get('returnUrl') || undefined;

    authService.login(returnUrl);
  };

  return (
    <Center h="100vh">
      <VStack
        gap={6}
        p={8}
        bg="transparent"
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        shadow="xl"
        w="full"
        maxW="md"
      >
        <Flex direction="column" align="center" gap={2}>
          <Heading size="2xl" fontWeight="bold" letterSpacing="tight">
            Welcome Back
          </Heading>
          <Text color={textColor} textAlign="center" fontSize="md">
            Sign in to to use the home application
          </Text>
        </Flex>

        <Button
          variant="outline"
          size="xl"
          w="full"
          height="14"
          onClick={handleLogin}
          bg={buttonBg}
          color={buttonTextColor}
          borderColor={borderColor}
          _hover={{ bg: buttonHoverBg }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={3}
          fontSize="lg"
          fontWeight="semibold"
          shadow="sm"
        >
          <FcGoogle size={24} />
          Continue with Google
        </Button>
      </VStack>
    </Center>
  );
}
