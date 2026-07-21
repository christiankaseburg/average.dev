import React from 'react';
import { Badge, Box, Text } from '@chakra-ui/react';
import { useAuth } from '../../../../../context/Auth';
import {
  ProfileSection,
  ProfileContentWrapper,
  ProfileInfoRow,
  ProfileSharedProps,
  useProfileStyles,
} from './shared';

export const InternalUserProfile: React.FC<ProfileSharedProps> = ({ variant = 'card' }) => {
  const { user } = useAuth();
  const { labelColor } = useProfileStyles();
  const isDrawer = variant === 'drawer';

  if (!user) return null;

  return (
    <ProfileSection title="Internal Database Profile">
      <ProfileContentWrapper variant={variant}>
        <ProfileInfoRow label="Name" value={user?.name || ''} variant={variant} />
        <ProfileInfoRow label="Email" value={user?.email || ''} variant={variant} />
        <ProfileInfoRow label="Internal ID" value={user?.id || ''} isCode variant={variant} />

        {isDrawer ? (
          <Box mb="3">
            <Text fontWeight="bold" color={labelColor} fontSize="sm">
              Provider
            </Text>
            <Box mt="1">
              <Badge colorPalette="blue">{user?.provider}</Badge>
            </Box>
          </Box>
        ) : (
          <>
            <Text fontWeight="bold" color={labelColor}>
              Provider:
            </Text>
            <Box>
              <Badge colorPalette="blue">{user?.provider}</Badge>
            </Box>
          </>
        )}
      </ProfileContentWrapper>
    </ProfileSection>
  );
};
