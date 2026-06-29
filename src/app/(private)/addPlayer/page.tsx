import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import AppBackground from '@/components/AppBackground';
import AuthContext from '@/contexts/auth';
import useGameSession from '@/hooks/game/useGameSession';
import { addManualPlayer, kickOfflinePlayer } from '@/services/game';

function TrashIcon(): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 6V4h8v2" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 6l1 14h12l1-14" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 11v6" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function AddPlayerPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const accountName =
    user?.user_metadata?.first_name ??
    user?.user_metadata?.name ??
    'Player';

  const { players } = useGameSession(
    sessionId ?? null,
    user?.id ?? null,
    accountName,
  );
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const manualPlayers = players.filter((p) => !p.user_id);

  async function handleAdd(): Promise<void> {
    if (!name.trim() || !sessionId || adding) return;
    setAdding(true);
    try {
      const result = await addManualPlayer(sessionId, name.trim());
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        setName('');
      }
    } catch {
      Alert.alert('Error', 'Failed to add player.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(playerId: string): Promise<void> {
    if (!sessionId) return;
    const result = await kickOfflinePlayer(sessionId, playerId);
    if (result.error) {
      Alert.alert('Error', result.error.message);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          {/* Title — large, sits where the input field used to be */}
          <Text style={s.title}>ADD PLAYER</Text>

          {/* Input row — two separate white boxes */}
          <View style={s.inputRow}>
            <TextInput
              style={s.nameInput}
              placeholder="Player Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleAdd}
              disabled={adding || !name.trim()}
              style={({ pressed }) => [
                s.addBox,
                pressed && { opacity: 0.6 },
                (adding || !name.trim()) && { opacity: 0.35 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add player"
            >
              <Text style={s.addText}>Add</Text>
            </Pressable>
          </View>

          {/* Player list */}
          {manualPlayers.map((player) => (
            <View key={player.id} style={s.playerRow}>
              <View style={s.playerCard}>
                <Text style={s.playerName}>{player.player_name}</Text>
              </View>
              <Pressable
                onPress={() => handleRemove(player.id)}
                style={({ pressed }) => [s.trashBox, pressed && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${player.player_name}`}
              >
                <TrashIcon />
              </Pressable>
            </View>
          ))}

          {manualPlayers.length === 0 ? (
            <Text style={s.emptyText}>No manual players added yet</Text>
          ) : null}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={s.bottomRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.bottomBtn, s.backBtnBottom, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.backBtnBottomText}>BACK</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, { flex: 1 }]}
          >
            <LinearGradient
              colors={['#F4736A', '#E8556A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.bottomBtn, s.nextBtn]}
            >
              <Text style={s.nextBtnText}>NEXT</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 36,
    color: '#F4736A',
    textShadowColor: '#B83A1A',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 0,
    textAlign: 'center',
    marginBottom: 32,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // ── Input row — two separate white boxes ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 18,
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    color: '#333',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A3ABA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A3ABA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 17,
    color: '#333',
  },

  // ── Player rows — name card + trash box as siblings ──
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  playerCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A3ABA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  playerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: '#333',
  },
  trashBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A3ABA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 30,
  },

  // ── Bottom buttons ──
  bottomRow: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 12,
  },
  bottomBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnBottom: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  backBtnBottomText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  nextBtn: {
    flex: 1,
  },
  nextBtnText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
