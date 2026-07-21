import React from 'react';
import { Box } from '@chakra-ui/react';
import { useProfileStyles } from './shared';
import { IdentityProviderProfile } from './IdentityProviderProfile';
import { InternalUserProfile } from './InternalUserProfile';

export interface UserProfileProps {
  variant?: 'card' | 'drawer';
}

export const UserProfile: React.FC<UserProfileProps> = ({
  variant = 'card',
}) => {
  const { cardBg, borderCol } = useProfileStyles();
  const isDrawer = variant === 'drawer';

  const Container = Box;
  const containerProps = isDrawer
    ? {}
    : {
        bg: cardBg,
        borderRadius: 'lg',
        borderWidth: '1px',
        borderColor: borderCol,
        p: '6',
        boxShadow: 'sm',
      };

  return (
    <Container {...containerProps}>
      <IdentityProviderProfile variant={variant} />
      <InternalUserProfile variant={variant} />
    </Container>
  );
};
