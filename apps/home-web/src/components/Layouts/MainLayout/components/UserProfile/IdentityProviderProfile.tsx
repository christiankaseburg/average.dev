import React from 'react';
import { Badge } from '@chakra-ui/react';
import { useAuth } from '../../../../../context/Auth';
import {
  ProfileSection,
  ProfileContentWrapper,
  ProfileInfoRow,
  ProfileSharedProps,
} from './shared';

export const IdentityProviderProfile: React.FC<ProfileSharedProps> = ({
  variant = 'card',
}) => {
  const { user } = useAuth();

  return (
    <ProfileSection
      title={`Identity Provider (${user?.provider || 'Unknown'})`}
    >
      <ProfileContentWrapper variant={variant}>
        <ProfileInfoRow label="Name" value={user?.name} variant={variant} />
        <ProfileInfoRow label="Email" value={user?.email} variant={variant} />
        {user?.issuer && user.issuer !== 'internal-admin-api' && (
          <ProfileInfoRow
            label="Issuer"
            value={user.issuer}
            isCode
            variant={variant}
          />
        )}
        {user?.subject && user.provider !== 'local' && (
          <ProfileInfoRow
            label="Subject ID"
            value={user.subject}
            isCode
            variant={variant}
          />
        )}
        {user?.provider === 'local' && (
          <ProfileInfoRow
            label="Account Type"
            value={<Badge colorPalette="green">Local Account</Badge>}
            variant={variant}
          />
        )}
      </ProfileContentWrapper>
    </ProfileSection>
  );
};
