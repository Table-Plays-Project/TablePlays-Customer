import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  Image,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import AuthContext from '@/contexts/auth';
import SplashOverlay from '@/components/SplashOverlay';
import { getDeviceId } from '@/lib/deviceId';
import i18n, { initI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import {
  registerDevice,
  forceDeviceTakeover,
  checkDeviceActive,
} from '@/services/deviceSession';

import type { CurrentUser } from '@/contexts/auth/types';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'home',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Baloo2_800ExtraBold,
  });

  const [i18nReady, setI18nReady] = useState<boolean>(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!fontsLoaded || !i18nReady) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AuthContext.AuthProvider>
        <MainLayout />
      </AuthContext.AuthProvider>
    </I18nextProvider>
  );
}

function MainLayout(): JSX.Element {
  const { user, setAuth } = AuthContext.useAuth();
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const [evicting, setEvicting] = useState(false);
  const deviceIdRef = useRef<string | null>(null);

  async function handleDeviceConflictOnSignIn(
    sessionUser: CurrentUser,
    navigateToDashboard: () => void,
  ): Promise<void> {
    const deviceId = await getDeviceId();
    deviceIdRef.current = deviceId;
    const { conflict } = await registerDevice(deviceId);
    if (!conflict) {
      navigateToDashboard();
      return;
    }
    Alert.alert(
      'Already Signed In',
      'You are signed in on another device. Continue here and sign out there?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            supabase.auth.signOut();
          },
        },
        {
          text: 'Continue',
          onPress: async () => {
            await forceDeviceTakeover(deviceId);
            navigateToDashboard();
          },
        },
      ],
      { cancelable: false },
    );
  }

  useEffect(() => {
    getDeviceId().then((id) => {
      deviceIdRef.current = id;
    });
  }, []);

  function startEviction(): void {
    if (evicting) return;
    setEvicting(true);
    setTimeout(() => {
      supabase.auth.signOut().finally(() => setEvicting(false));
    }, 3000);
  }

  // Polling timer (5s) — primary deterministic eviction mechanism.
  useEffect(() => {
    if (!user || user.is_anonymous) return;
    const deviceId = deviceIdRef.current;
    if (!deviceId) return;
    const safeDeviceId: string = deviceId;

    const timer = setInterval(async () => {
      const isActive = await checkDeviceActive(safeDeviceId);
      if (!isActive) startEviction();
    }, 5_000);
    return () => clearInterval(timer);
  }, [user]);

  // AppState check — belt-and-suspenders for app resume.
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      async (state: AppStateStatus) => {
        if (state !== 'active') return;
        if (!user || user.is_anonymous) return;
        const deviceId = deviceIdRef.current;
        if (!deviceId) return;
        const isActive = await checkDeviceActive(deviceId);
        if (!isActive) startEviction();
      },
    );
    return () => sub.remove();
  }, [user]);

  // Realtime — catches takeover instantly when websocket is alive.
  useEffect(() => {
    if (!user || user.is_anonymous) return;
    const deviceId = deviceIdRef.current;
    if (!deviceId) return;

    const channel = supabase
      .channel('active-device-watch')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_devices',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newDeviceId = (payload.new as { device_id?: string })
            ?.device_id;
          if (newDeviceId && newDeviceId !== deviceId) {
            startEviction();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    async function handleDeepLink(url: string): Promise<void> {
      if (!url.includes('reset-password')) return;
      const hash = url.split('#')[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      if (accessToken && refreshToken && type === 'recovery') {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const linkSub = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        router.replace('/(public)/(auth)/updatePassword/page');
        return;
      }
      if (_event === 'SIGNED_OUT') {
        setAuth(null);
        router.replace('/(public)/(auth)/signin/page');
        return;
      }
      if (_event === 'SIGNED_IN') {
        const isAnonymous = session?.user?.is_anonymous === true;
        if (!isAnonymous && !session?.user?.email_confirmed_at) {
          return;
        }
        setAuth(session.user as CurrentUser);
        if (isAnonymous) {
          return;
        }
        const sessionUser = session.user as CurrentUser;
        const isGoogle = sessionUser.app_metadata?.provider === 'google';

        function navigateToDashboard(): void {
          if (isGoogle) {
            const uid = sessionUser.id;
            const key = `welcome_shown_${uid}`;
            AsyncStorage.getItem(key).then((shown) => {
              if (!shown) {
                AsyncStorage.setItem(key, '1');
                router.replace({
                  pathname: '/(public)/(auth)/success/page',
                  params: { flow: 'welcome' },
                });
              } else {
                router.replace('/(private)/dashboard/page');
              }
            });
          } else {
            router.replace('/(private)/dashboard/page');
          }
        }

        handleDeviceConflictOnSignIn(sessionUser, navigateToDashboard);
        return;
      }
      if (_event === 'INITIAL_SESSION') {
        const isAnonymous = session?.user?.is_anonymous === true;
        if (session && isAnonymous) {
          setAuth(session.user as CurrentUser);
        } else if (session && session.user?.email_confirmed_at) {
          setAuth(session.user as CurrentUser);
          // Navigate immediately — never block on the device check.
          // If another device took over, the Realtime subscription or
          // next foreground check will evict cleanly with a message.
          router.replace('/(private)/dashboard/page');
          getDeviceId()
            .then(async (deviceId) => {
              deviceIdRef.current = deviceId;
              const isActive = await checkDeviceActive(deviceId);
              if (!isActive) {
                startEviction();
              } else {
                await registerDevice(deviceId);
              }
            })
            .catch(() => {});
        } else {
          setAuth(null);
          router.replace('/(public)/(auth)/signin/page');
        }
        return;
      }
      if (session) {
        setAuth(session.user as CurrentUser);
      }
    });

    return () => {
      linkSub.remove();
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, title: 'Loading' }}
        />
        <Stack.Screen name="(public)/(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(private)" options={{ headerShown: false }} />
      </Stack>
      {evicting ? (
        <View style={evictStyles.overlay}>
          <Image
            source={require('@/assets/images/success-star.gif')}
            style={evictStyles.star}
            resizeMode="contain"
          />
          <Text style={evictStyles.heading}>Signed Out</Text>
          <Text style={evictStyles.message}>
            Someone else signed in to your account
          </Text>
        </View>
      ) : null}
      {showSplash ? (
        <SplashOverlay onFinish={() => setShowSplash(false)} />
      ) : null}
    </ThemeProvider>
  );
}

const evictStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D6AE9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  star: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  heading: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
