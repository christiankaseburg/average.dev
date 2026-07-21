import React from 'react';
import { Box, Heading, Text, Grid } from '@chakra-ui/react';
import { useColorModeValue } from '../../../../../context/Theme';

export interface ProfileSharedProps {
  variant?: 'card' | 'drawer';
}

export const useProfileStyles = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderCol = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const codeBg = useColorModeValue('gray.100', 'gray.700');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorBorder = useColorModeValue('red.200', 'red.800');
  const errorText = useColorModeValue('red.600', 'red.200');

  return {
    cardBg,
    borderCol,
    labelColor,
    codeBg,
    errorBg,
    errorBorder,
    errorText,
  };
};

export const ProfileSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const { borderCol } = useProfileStyles();

  return (
    <Box mb="8">
      <Heading
        size="md"
        mb="4"
        borderBottom="1px solid"
        borderColor={borderCol}
        pb="2"
        fontSize="lg"
      >
        {title}
      </Heading>
      {children}
    </Box>
  );
};

export const ProfileInfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  isCode?: boolean;
  variant?: 'card' | 'drawer';
}> = ({ label, value, isCode = false, variant = 'card' }) => {
  const { labelColor, codeBg } = useProfileStyles();
  const isDrawer = variant === 'drawer';

  if (isDrawer) {
    return (
      <Box mb="3">
        <Text fontWeight="bold" color={labelColor} fontSize="sm">
          {label}
        </Text>
        {isCode ? (
          <Box
            as="span"
            fontFamily="mono"
            fontSize="sm"
            bg={codeBg}
            px="2"
            py="1"
            borderRadius="md"
            display="inline-block"
            mt="1"
          >
            {value}
          </Box>
        ) : (
          <Text fontSize="md" mt="0.5">
            {value}
          </Text>
        )}
      </Box>
    );
  }

  // Card Mode
  return (
    <>
      <Text fontWeight="bold" color={labelColor}>
        {label}:
      </Text>
      {isCode ? (
        <Box
          as="span"
          fontFamily="mono"
          fontSize="sm"
          bg={codeBg}
          px="2"
          py="0.5"
          borderRadius="md"
          w="fit-content"
        >
          {value}
        </Box>
      ) : (
        <Text>{value}</Text>
      )}
    </>
  );
};

export const ProfileContentWrapper: React.FC<{
  children: React.ReactNode;
  variant?: 'card' | 'drawer';
}> = ({ children, variant = 'card' }) => {
  const isDrawer = variant === 'drawer';

  return isDrawer ? (
    <Box>{children}</Box>
  ) : (
    <Grid templateColumns="150px 1fr" gapY="4" alignItems="center">
      {children}
    </Grid>
  );
};
