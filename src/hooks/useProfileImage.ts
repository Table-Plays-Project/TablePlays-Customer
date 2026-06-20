import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import AuthContext from '@/contexts/auth';

const KEY_PREFIX = 'profile_image_';

type UseProfileImageReturn = {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
  loading: boolean;
};

export default function useProfileImage(): UseProfileImageReturn {
  const { user } = AuthContext.useAuth();
  const [profileImage, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const key = user?.id ? `${KEY_PREFIX}${user.id}` : null;

  useFocusEffect(
    useCallback(() => {
      async function load(): Promise<void> {
        if (!key) {
          setLoading(false);
          return;
        }
        try {
          const uri = await AsyncStorage.getItem(key);
          setImage(uri);
        } catch (e) {
          console.error('Failed to load profile image:', e);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [key]),
  );

  const setProfileImage = useCallback(
    async (uri: string | null): Promise<void> => {
      if (!key) return;
      try {
        if (uri) {
          await AsyncStorage.setItem(key, uri);
        } else {
          await AsyncStorage.removeItem(key);
        }
        setImage(uri);
      } catch (e) {
        console.error('Failed to save profile image:', e);
      }
    },
    [key],
  );

  return { profileImage, setProfileImage, loading };
}
