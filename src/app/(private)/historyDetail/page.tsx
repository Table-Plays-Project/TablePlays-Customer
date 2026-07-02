import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image as RNImage,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import { getAvatarById } from '@/constants/avatars';
import { getGameHistoryDetail } from '@/services/gameHistory';
import type {
  GameHistoryDetail,
  GameHistoryParticipant,
} from '@/services/gameHistory';

const GAME_THUMBNAILS: Record<string, number> = {
  spin_wheel: require('@/assets/images/spin-wheel-icon.png'),
};

function gameThumbnail(gameType: string): number | null {
  return GAME_THUMBNAILS[gameType] ?? null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function paymentMethodLabel(method: string | null): string {
  if (!method) return 'Not specified';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

function paymentMethodIcon(
  method: string | null,
): keyof typeof Ionicons.glyphMap {
  if (!method) return 'help-circle-outline';
  const normalized = method.toLowerCase();
  if (normalized.includes('card')) return 'card-outline';
  if (normalized.includes('cash')) return 'cash-outline';
  return 'wallet-outline';
}

function initials(name: string | null): string {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function Avatar({
  avatarId,
  name,
  size,
}: {
  avatarId: string | null;
  name: string | null;
  size: number;
}): React.JSX.Element {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const circleStyle = [
    s.avatarCircle,
    { width: size, height: size, borderRadius: size / 2 },
  ];
  if (avatar) {
    return (
      <View style={circleStyle}>
        <RNImage
          source={avatar.source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }
  return (
    <View style={circleStyle}>
      <Text style={[s.avatarLetter, { fontSize: size * 0.4 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

export default function HistoryDetailPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [detail, setDetail] = useState<GameHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    setLoading(true);
    const result = await getGameHistoryDetail(sessionId);
    if (result.error) {
      setError(result.error.message);
    } else {
      setError(null);
      setDetail(result.detail);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  function renderParticipant(p: GameHistoryParticipant): React.JSX.Element {
    return (
      <View key={p.id} style={s.participantRow}>
        <Avatar avatarId={p.avatarId} name={p.name} size={36} />
        <Text style={s.participantName} numberOfLines={1}>
          {p.name}
        </Text>
        {p.isBot ? (
          <View style={s.botBadge}>
            <Text style={s.botBadgeText}>BOT</Text>
          </View>
        ) : null}
      </View>
    );
  }

  const thumb = detail ? gameThumbnail(detail.gameType) : null;

  return (
    <AppBackground>
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <Pressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(private)/viewHistory/page')
              }
              style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <Text style={s.title}>Details</Text>
            <View style={s.headerSpacer} />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={s.loadingIndicator}
            />
          ) : error ? (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : !detail ? (
            <Text style={s.emptyText}>Game not found.</Text>
          ) : (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Avatar
                  avatarId={detail.payer?.avatarId ?? null}
                  name={detail.payer?.name ?? null}
                  size={42}
                />
                <View style={s.payerInfo}>
                  <View style={s.payerNameRow}>
                    <Text style={s.payerName} numberOfLines={1}>
                      {detail.payer?.name ?? 'Unknown'}
                    </Text>
                    {detail.payer?.isBot ? (
                      <View style={s.botBadge}>
                        <Text style={s.botBadgeText}>BOT</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.dateText}>{formatDate(detail.endedAt)}</Text>
                </View>
              </View>

              <Text style={s.sectionLabel}>GAMES PLAYED:</Text>
              <View style={s.thumbsRow}>
                {thumb ? (
                  <View style={s.thumbWrap}>
                    <RNImage
                      source={thumb}
                      style={s.thumbImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={s.thumbWrap}>
                    <Ionicons
                      name="game-controller"
                      size={28}
                      color="#F4736A"
                    />
                  </View>
                )}
              </View>

              <View style={s.divider} />

              <View style={s.footerRow}>
                <View style={s.footerItem}>
                  <Text style={s.footerLabel}>Amount Paid</Text>
                  <Text style={s.footerValue}>
                    {detail.billAmount != null ? `$${detail.billAmount}` : '—'}
                  </Text>
                </View>
                <View style={s.footerItem}>
                  <Text style={s.footerLabel}>Method</Text>
                  <View style={s.methodRow}>
                    <Ionicons
                      name={paymentMethodIcon(detail.paymentMethod)}
                      size={14}
                      color="#2A2F4A"
                    />
                    <Text style={s.footerValue} numberOfLines={1}>
                      {paymentMethodLabel(detail.paymentMethod)}
                    </Text>
                  </View>
                </View>
                <View style={s.footerItem}>
                  <Text style={s.footerLabel}>Tip</Text>
                  <Text style={s.footerValue}>
                    {detail.tipPercent != null ? `${detail.tipPercent}%` : '—'}
                  </Text>
                </View>
              </View>

              <View style={s.divider} />

              <Text style={s.sectionLabel}>LOCATION:</Text>
              <Text style={s.locationText}>
                {detail.location ?? 'Not specified'}
              </Text>

              {detail.participants.length > 0 ? (
                <>
                  <View style={s.divider} />
                  <Text style={s.sectionLabel}>PARTICIPANTS:</Text>
                  {detail.participants.map(renderParticipant)}
                </>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerSpacer: {
    width: 36,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },

  errorBanner: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 40,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  payerInfo: {
    flex: 1,
  },
  payerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  botBadgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  avatarCircle: {
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
  },
  payerName: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#2A2F4A',
  },
  dateText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#8A8FA3',
    marginTop: 2,
  },

  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#8A8FA3',
    letterSpacing: 1,
    marginBottom: 10,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F4F3F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 40,
    height: 40,
  },

  divider: {
    height: 1,
    backgroundColor: '#EDE9F5',
    marginBottom: 16,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#8A8FA3',
    marginBottom: 3,
  },
  footerValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#2A2F4A',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  locationText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#2A2F4A',
    marginBottom: 16,
  },

  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  participantName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#2A2F4A',
    flex: 1,
  },
});
