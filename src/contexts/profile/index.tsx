import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthContext from '@/contexts/auth';
import { getAvatarById } from '@/constants/avatars';
import { supabase } from '@/lib/supabase';

const AVATAR_KEY_PREFIX = 'selected_avatar_';
const IMAGE_KEY_PREFIX = 'profile_image_';

type ProfileContextValue = {
  avatarId: string | null;
  avatarSource: ImageSourcePropType | null;
  setAvatarId: (id: string | null) => Promise<void>;
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  avatarId: null,
  avatarSource: null,
  setAvatarId: async () => {},
  profileImage: null,
  setProfileImage: async () => {},
});

function ProfileProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = AuthContext.useAuth();
  const [avatarId, setAvatarState] = useState<string | null>(null);
  const [profileImage, setImageState] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const avatarKey = userId ? `${AVATAR_KEY_PREFIX}${userId}` : null;
  const imageKey = userId ? `${IMAGE_KEY_PREFIX}${userId}` : null;

  useEffect(() => {
    async function load(): Promise<void> {
      if (!avatarKey || !imageKey) return;
      try {
        const [storedAvatar, storedImage] = await Promise.all([
          AsyncStorage.getItem(avatarKey),
          AsyncStorage.getItem(imageKey),
        ]);
        setAvatarState(storedAvatar);
        setImageState(storedImage);
      } catch (e) {
        console.error('Failed to load profile data:', e);
      }
    }
    load();
  }, [avatarKey, imageKey]);

  const setAvatarId = useCallback(
    async (id: string | null): Promise<void> => {
      if (!avatarKey) return;
      setAvatarState(id);
      if (id && imageKey) {
        setImageState(null);
        AsyncStorage.removeItem(imageKey).catch(() => {});
      }
      try {
        if (id) {
          await AsyncStorage.setItem(avatarKey, id);
        } else {
          await AsyncStorage.removeItem(avatarKey);
        }
      } catch (e) {
        console.error('Failed to save avatar:', e);
      }
      if (userId) {
        supabase
          .from('profiles')
          .update({ avatar_id: id })
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) console.error('Failed to sync avatar_id to profiles:', error.message);
          });
      }
    },
    [avatarKey, imageKey, userId],
  );

  const setProfileImage = useCallback(
    async (uri: string | null): Promise<void> => {
      if (!imageKey) return;
      setImageState(uri);
      if (uri && avatarKey) {
        setAvatarState(null);
        AsyncStorage.removeItem(avatarKey).catch(() => {});
      }
      try {
        if (uri) {
          await AsyncStorage.setItem(imageKey, uri);
        } else {
          await AsyncStorage.removeItem(imageKey);
        }
      } catch (e) {
        console.error('Failed to save profile image:', e);
      }
    },
    [imageKey, avatarKey],
  );

  const avatarSource = avatarId
    ? (getAvatarById(avatarId)?.source ?? null)
    : null;

  const value = useMemo(
    () => ({
      avatarId,
      avatarSource,
      setAvatarId,
      profileImage,
      setProfileImage,
    }),
    [avatarId, avatarSource, setAvatarId, profileImage, setProfileImage],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

function useProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}

export default { ProfileProvider, useProfile };
