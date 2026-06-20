import { useCallback, useState } from 'react';
import { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import AuthContext from '@/contexts/auth';
import { getAvatarById } from '@/constants/avatars';

const KEY_PREFIX = 'selected_avatar_';

type UseAvatarReturn = {
  avatarId: string | null;
  avatarSource: ImageSourcePropType | null;
  setAvatarId: (id: string | null) => Promise<void>;
  loading: boolean;
};

export default function useAvatar(): UseAvatarReturn {
  const { user } = AuthContext.useAuth();
  const [avatarId, setId] = useState<string | null>(null);
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
          const stored = await AsyncStorage.getItem(key);
          setId(stored);
        } catch (e) {
          console.error('Failed to load avatar:', e);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [key]),
  );

  const setAvatarId = useCallback(
    async (id: string | null): Promise<void> => {
      if (!key) return;
      try {
        if (id) {
          await AsyncStorage.setItem(key, id);
        } else {
          await AsyncStorage.removeItem(key);
        }
        setId(id);
      } catch (e) {
        console.error('Failed to save avatar:', e);
      }
    },
    [key],
  );

  const avatar = avatarId ? getAvatarById(avatarId) : null;

  return {
    avatarId,
    avatarSource: avatar?.source ?? null,
    setAvatarId,
    loading,
  };
}
