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
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import AuthContext from '@/contexts/auth';
import SplashOverlay from '@/components/SplashOverlay';
import i18n, { initI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

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
  const { setAuth } = AuthContext.useAuth();
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Parse recovery tokens from a deep link URL and set the Supabase session.
    // Supabase appends tokens as a hash fragment:
    // tableplays-customer://reset-password#access_token=...&refresh_token=...&type=recovery
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
        // onAuthStateChange below fires PASSWORD_RECOVERY → routes to updatePassword
      }
    }

    // Case 1: app was closed, opened by tapping the reset-password deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Case 2: app already open in background, deep link arrives
    const linkSub = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Auth state listener — only navigate on meaningful events.
    // TOKEN_REFRESHED / USER_UPDATED must NOT trigger navigation or the user
    // gets kicked back to dashboard while browsing other private screens.
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
          // Guest sign-in is initiated from a specific join/host game-session
          // screen, which navigates explicitly once this resolves — never
          // force a global redirect for a guest mid-join-flow.
          return;
        }
        const isGoogle = session.user.app_metadata?.provider === 'google';
        if (isGoogle) {
          const uid = session.user.id;
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
        return;
      }
      if (_event === 'INITIAL_SESSION') {
        const isAnonymous = session?.user?.is_anonymous === true;
        if (session && isAnonymous) {
          // Reopened app with an existing guest session — keep the session
          // alive but don't force any redirect until reconnect/lobby
          // reconciliation is built.
          setAuth(session.user as CurrentUser);
        } else if (session && session.user?.email_confirmed_at) {
          setAuth(session.user as CurrentUser);
          router.replace('/(private)/dashboard/page');
        } else {
          setAuth(null);
          router.replace('/(public)/(auth)/signin/page');
        }
        return;
      }
      // TOKEN_REFRESHED, USER_UPDATED — just keep auth state in sync, no navigation
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
      {showSplash ? (
        <SplashOverlay onFinish={() => setShowSplash(false)} />
      ) : null}
    </ThemeProvider>
  );
}
