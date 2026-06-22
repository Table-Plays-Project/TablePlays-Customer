import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import {
  ActionButton,
  SecondaryButton,
  NavigationButton,
} from '@/components/buttons';
import { MyAppTextInput } from '@/components/inputs';
import AuthContext from '@/contexts/auth';
import { signInAsGuest } from '@/services/auth';
import { createGameSession, joinGameSession } from '@/services/gameSessions';
import { colors } from '@/constants/theme';

import styles from './styles';

export default function JoinSessionPage(): JSX.Element {
  const { user } = AuthContext.useAuth();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showError(message: string): void {
    setError(message);
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Error', message);
    }
  }

  async function ensureAuthenticated(): Promise<boolean> {
    if (user) return true;
    const { error: guestError } = await signInAsGuest();
    if (guestError) {
      showError(guestError.message);
      return false;
    }
    return true;
  }

  async function handleHost(): Promise<void> {
    if (!playerName.trim()) {
      showError('Enter your name first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const authed = await ensureAuthenticated();
      if (!authed) return;

      const { sessionId, error: createError } = await createGameSession(
        'customer',
        'spin_wheel',
        playerName.trim(),
      );
      if (createError || !sessionId) {
        showError(createError?.message ?? 'Failed to create session.');
        return;
      }
      router.push({
        pathname: '/(private)/lobby/page',
        params: { sessionId },
      } as never);
    } catch (e) {
      console.error('handleHost failed:', e);
      showError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(): Promise<void> {
    if (!playerName.trim()) {
      showError('Enter your name first.');
      return;
    }
    if (!roomCode.trim()) {
      showError('Enter a room code first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const authed = await ensureAuthenticated();
      if (!authed) return;

      const { sessionId, error: joinError } = await joinGameSession(
        roomCode.trim(),
        playerName.trim(),
      );
      if (joinError || !sessionId) {
        showError(joinError?.message ?? 'Failed to join session.');
        return;
      }
      router.push({
        pathname: '/(private)/lobby/page',
        params: { sessionId },
      } as never);
    } catch (e) {
      console.error('handleJoin failed:', e);
      showError('Failed to join session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <NavigationButton
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(private)/dashboard/page')
              }
              arrow="arrow-back"
            />
          </View>

          <View style={styles.headingWrap}>
            <BubbleHeading text="HOST OR JOIN" align="center" />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <MyAppTextInput
            variant="pill"
            label="Your Name"
            placeholder="Your Name"
            value={playerName}
            onChangeText={setPlayerName}
          />

          <ActionButton
            onPress={handleHost}
            text="HOST GAME"
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <MyAppTextInput
            variant="pill"
            label="Room Code"
            placeholder="Room Code"
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
          />

          <SecondaryButton
            onPress={handleJoin}
            text="JOIN GAME"
            disabled={loading}
          />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
