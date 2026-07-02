import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image as RNImage,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import { getAvatarById } from '@/constants/avatars';
import {
  clearGameHistory,
  getGameHistory,
  GAME_HISTORY_PAGE_SIZE,
} from '@/services/gameHistory';
import type { GameHistoryEntry } from '@/services/gameHistory';

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

function HistoryAvatar({
  avatarId,
  name,
}: {
  avatarId: string | null;
  name: string | null;
}): React.JSX.Element {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  if (avatar) {
    return (
      <View style={s.avatarCircle}>
        <RNImage
          source={avatar.source}
          style={s.avatarImage}
          resizeMode="cover"
        />
      </View>
    );
  }
  return (
    <View style={s.avatarCircle}>
      <Text style={s.avatarLetter}>{initials(name)}</Text>
    </View>
  );
}

function HistoryCard({ entry }: { entry: GameHistoryEntry }): React.JSX.Element {
  const thumb = gameThumbnail(entry.gameType);
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(private)/historyDetail/page',
          params: { sessionId: entry.sessionId },
        } as never)
      }
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View details for game with ${entry.payerName ?? 'unknown'}`}
    >
      <View style={s.cardHeader}>
        <HistoryAvatar avatarId={entry.payerAvatarId} name={entry.payerName} />
        <View style={s.payerInfo}>
          <View style={s.payerNameRow}>
            <Text style={s.payerName} numberOfLines={1}>
              {entry.payerName ?? 'Unknown'}
            </Text>
            {entry.payerIsBot ? (
              <View style={s.botBadge}>
                <Text style={s.botBadgeText}>BOT</Text>
              </View>
            ) : null}
          </View>
          <Text style={s.dateText}>{formatDate(entry.endedAt)}</Text>
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
            <Ionicons name="game-controller" size={28} color="#F4736A" />
          </View>
        )}
      </View>

      <View style={s.divider} />

      <View style={s.footerRow}>
        <View style={s.footerItem}>
          <Text style={s.footerLabel}>Amount Paid</Text>
          <Text style={s.footerValue}>
            {entry.billAmount != null ? `$${entry.billAmount}` : '—'}
          </Text>
        </View>
        <View style={s.footerItem}>
          <Text style={s.footerLabel}>Method</Text>
          <View style={s.methodRow}>
            <Ionicons
              name={paymentMethodIcon(entry.paymentMethod)}
              size={14}
              color="#2A2F4A"
            />
            <Text style={s.footerValue} numberOfLines={1}>
              {paymentMethodLabel(entry.paymentMethod)}
            </Text>
          </View>
        </View>
        <View style={s.footerItem}>
          <Text style={s.footerLabel}>Tip</Text>
          <Text style={s.footerValue}>
            {entry.tipPercent != null ? `${entry.tipPercent}%` : '—'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ListFooter({ loadingMore }: { loadingMore: boolean }): React.JSX.Element | null {
  if (!loadingMore) return null;
  return (
    <View style={s.footerLoader}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
    </View>
  );
}

function EmptyList({ refreshing }: { refreshing: boolean }): React.JSX.Element | null {
  if (refreshing) return null;
  return (
    <View style={s.emptyWrap}>
      <Ionicons
        name="game-controller-outline"
        size={48}
        color="rgba(255,255,255,0.4)"
      />
      <Text style={s.emptyText}>No games played yet</Text>
      <Text style={s.emptySubtext}>
        Finished games will show up here once you've played.
      </Text>
    </View>
  );
}

export default function ViewHistoryPage(): JSX.Element {
  const [entries, setEntries] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const hasMountedRef = useRef(false);
  const loadingMoreGuard = useRef(false);
  const nextOffsetRef = useRef(0);

  const loadPage = useCallback(async (offset: number): Promise<void> => {
    const result = await getGameHistory(offset, GAME_HISTORY_PAGE_SIZE);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setError(null);
    if (offset === 0) {
      setEntries(result.entries);
    } else {
      setEntries((prev) => [...prev, ...result.entries]);
    }
    setHasMore(result.hasMore);
    nextOffsetRef.current = offset + result.entries.length;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const isFirst = !hasMountedRef.current;
      hasMountedRef.current = true;
      nextOffsetRef.current = 0;
      loadingMoreGuard.current = false;
      if (isFirst) {
        setLoading(true);
        loadPage(0).finally(() => setLoading(false));
      } else {
        setRefreshing(true);
        loadPage(0).finally(() => setRefreshing(false));
      }
    }, [loadPage]),
  );

  const handleRefresh = useCallback((): void => {
    nextOffsetRef.current = 0;
    loadingMoreGuard.current = false;
    setRefreshing(true);
    loadPage(0).finally(() => setRefreshing(false));
  }, [loadPage]);

  const handleEndReached = useCallback((): void => {
    if (!hasMore || loadingMoreGuard.current) return;
    loadingMoreGuard.current = true;
    setLoadingMore(true);
    const offset = nextOffsetRef.current;
    loadPage(offset).finally(() => {
      loadingMoreGuard.current = false;
      setLoadingMore(false);
    });
  }, [hasMore, loadPage]);

  function handleClearHistory(): void {
    if (entries.length === 0 || clearing) return;
    Alert.alert(
      'Clear History',
      'This removes all finished games from your history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            const result = await clearGameHistory();
            if (result.error) {
              Alert.alert('Error', result.error.message);
            } else {
              setEntries([]);
              setHasMore(false);
              nextOffsetRef.current = 0;
            }
            setClearing(false);
          },
        },
      ],
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: GameHistoryEntry }): React.JSX.Element => (
      <HistoryCard entry={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: GameHistoryEntry): string => item.sessionId,
    [],
  );

  return (
    <AppBackground>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/(private)/dashboard/page')
            }
            style={({ pressed }) => [s.backBtn, pressed && s.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <Text style={s.title}>View History</Text>
          <Pressable
            onPress={handleClearHistory}
            disabled={entries.length === 0 || clearing}
            style={({ pressed }) => [
              s.clearBtn,
              pressed && s.btnPressed,
              (entries.length === 0 || clearing) && s.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear history"
            accessibilityState={{ disabled: entries.length === 0 || clearing }}
          >
            {clearing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#fff" />
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : error ? (
          <View style={s.errorWrap}>
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            style={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="rgba(255,255,255,0.7)"
                colors={['#F4736A']}
              />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<EmptyList refreshing={refreshing} />}
            ListFooterComponent={<ListFooter loadingMore={loadingMore} />}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={10}
            removeClippedSubviews
          />
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.6,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  emptySubtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  payerInfo: {
    flex: 1,
  },
  payerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payerName: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#2A2F4A',
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
    marginBottom: 14,
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
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
