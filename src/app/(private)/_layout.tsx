import { Slot } from 'expo-router';

import ProfileContext from '@/contexts/profile';

export default function PrivateLayout(): JSX.Element {
  return (
    <ProfileContext.ProfileProvider>
      <Slot />
    </ProfileContext.ProfileProvider>
  );
}
