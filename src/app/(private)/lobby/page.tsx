import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { NavigationButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import useGameSession from '@/hooks/useGameSession';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

function initialsFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function LobbyPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const { session, players, loading, error } = useGameSession(
    sessionId ?? null,
  );

  function handleExit(): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(private)/dashboard/page');
    }
  }

  const isHost = session?.host_id === user?.id;
  const roomCode = session?.room_code ?? '------';

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <NavigationButton onPress={handleExit} arrow="arrow-back" />
            <BubbleHeading
              text="GAME LOBBY"
              fontSize={fontSize['2xl']}
              align="center"
            />
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.roomCodeCard}>
            <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
            <Text style={styles.roomCodeValue}>{roomCode}</Text>
            <Text style={styles.roomCodeHint}>
              Share this code with friends to join
            </Text>
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

          <Text style={styles.sectionTitle}>PLAYERS ({players.length})</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.textInverse}
              style={styles.loadingIndicator}
            />
          ) : (
            <View style={styles.playersList}>
              {players.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {initialsFor(player.player_name)}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{player.player_name}</Text>
                  {player.is_host ? (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  ) : null}
                  {player.user_id === null ? (
                    <View style={styles.guestBadge}>
                      <Text style={styles.guestBadgeText}>GUEST</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <Pressable
            disabled={!isHost}
            style={({ pressed }) => [
              styles.startButton,
              !isHost && styles.startButtonDisabled,
              pressed && isHost && styles.startButtonPressed,
            ]}
          >
            <Text style={styles.startButtonText}>
              {isHost ? 'START GAME' : 'WAITING FOR HOST...'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
