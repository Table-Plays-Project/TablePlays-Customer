import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { ActionButton, NavigationButton } from '@/components/buttons';
import { MyAppTextInput } from '@/components/inputs';
import AuthContext from '@/contexts/auth';
import ProfileContext from '@/contexts/profile';
import { signInAsGuest } from '@/services/auth';
import { createGameSession, joinGameSession } from '@/services/game';
import { colors } from '@/constants/theme';

import styles from './styles';

export default function JoinSessionPage(): JSX.Element {
  const { user } = AuthContext.useAuth();
  const { avatarId } = ProfileContext.useProfile();
  const { mode, code } = useLocalSearchParams<{ mode?: string; code?: string }>();
  const isJoinMode = mode === 'join';

  const accountName =
    user?.user_metadata?.first_name ??
    user?.user_metadata?.name ??
    '';

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(code ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function openScanner(): Promise<void> {
    if (!cameraPermission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission needed', 'Camera access is required to scan QR codes.');
        return;
      }
    }
    setScanned(false);
    setScannerOpen(true);
  }

  async function handleBarCodeScanned({ data }: { data: string }): Promise<void> {
    if (scanned) return;
    setScanned(true);
    setScannerOpen(false);

    // Extract room code from deep link URL or plain text
    let extractedCode: string | null = null;
    const codeMatch = data.match(/[?&]code=([A-Za-z0-9]+)/);
    if (codeMatch) {
      extractedCode = codeMatch[1].toUpperCase();
    } else if (/^[A-Za-z0-9]{4,8}$/.test(data.trim())) {
      extractedCode = data.trim().toUpperCase();
    }

    if (!extractedCode) {
      Alert.alert('Invalid QR', 'This QR code does not contain a valid room code.');
      return;
    }

    setRoomCode(extractedCode);

    // Auto-join immediately
    const name = playerName.trim() || accountName || 'Player';
    setLoading(true);
    setError(null);
    try {
      const authed = await ensureAuthenticated();
      if (!authed) { setLoading(false); return; }

      const { sessionId, error: joinError } = await joinGameSession(
        extractedCode,
        name,
        avatarId,
      );
      if (joinError || !sessionId) {
        setLoading(false);
        showError(joinError?.message ?? 'Failed to join session.');
        return;
      }
      router.push({
        pathname: '/(private)/lobby/page',
        params: { sessionId },
      } as never);
    } catch {
      setLoading(false);
      showError('Failed to join session. Please try again.');
    }
  }

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
        null,
        avatarId,
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
        avatarId,
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
    <>
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

          {!isJoinMode ? (
            <View style={{ alignItems: 'center', marginTop: '42%', marginBottom: 40 }}>
              <BubbleHeading
                text={'WELCOME\nHOST'}
                fontSize={52}
                align="center"
              />
            </View>
          ) : (
            <View style={styles.headingWrap}>
              <BubbleHeading text="JOIN GAME" align="center" />
            </View>
          )}

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

          {isJoinMode ? (
            <MyAppTextInput
              variant="pill"
              label="Your Name"
              placeholder="Your Name"
              value={playerName}
              onChangeText={setPlayerName}
            />
          ) : (
            <View style={scannerStyles.hostNameInput}>
              <Ionicons name="person" size={18} color="#9B6FD4" />
              <View style={scannerStyles.hostNameDivider} />
              <TextInput
                style={scannerStyles.hostNameText}
                placeholder="Your Name"
                placeholderTextColor="#B8B0D0"
                value={playerName}
                onChangeText={setPlayerName}
              />
            </View>
          )}

          {isJoinMode ? (
            <>
              <MyAppTextInput
                variant="pill"
                label="Room Code"
                placeholder="Room Code"
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
              />
              <Pressable
                onPress={openScanner}
                style={({ pressed }) => [
                  scannerStyles.scanBtn,
                  pressed && scannerStyles.scanBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Scan QR code"
              >
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                <Text style={scannerStyles.scanBtnText}>SCAN QR CODE</Text>
              </Pressable>
              <ActionButton
                onPress={handleJoin}
                text="JOIN GAME"
                disabled={loading}
              />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* CREATE ROOM button pinned to bottom — host only */}
      {!isJoinMode ? (
        <Pressable
          onPress={handleHost}
          disabled={loading}
          style={({ pressed }) => [
            scannerStyles.createRoomBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            loading && { opacity: 0.5 },
          ]}
        >
          <LinearGradient
            colors={['#F87171', '#F4736A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={scannerStyles.createRoomGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={scannerStyles.createRoomText}>+ CREATE ROOM</Text>
            )}
          </LinearGradient>
        </Pressable>
      ) : null}
    </AppBackground>

    {/* QR Scanner Modal */}
    <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
      <View style={scannerStyles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={scannerStyles.overlay}>
          <View style={scannerStyles.frame} />
        </View>
        <SafeAreaView style={scannerStyles.topBar}>
          <Text style={scannerStyles.title}>Scan Room QR Code</Text>
          <Pressable
            onPress={() => setScannerOpen(false)}
            style={scannerStyles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
    </>
  );
}

const scannerStyles = StyleSheet.create({
  hostNameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6D4AFF',
    paddingHorizontal: 20,
    height: 62,
  },
  hostNameDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 10,
  },
  hostNameText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    letterSpacing: 2,
    color: '#2A2F4A',
    paddingVertical: 0,
  },
  createRoomBtn: {
    position: 'absolute' as const,
    bottom: 40,
    left: 24,
    right: 24,
  },
  createRoomGradient: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#F4736A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createRoomText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    marginBottom: 16,
  },
  scanBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  scanBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
