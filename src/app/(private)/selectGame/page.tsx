import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { NavigationButton } from '@/components/buttons';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

type GameOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
};

const GAMES: GameOption[] = [
  {
    icon: 'sync-circle',
    label: 'Spinning\nWheel',
    route: '/(private)/joinSession/page',
  },
  { icon: 'refresh-circle', label: 'Reverse\nWheel' },
  { icon: 'flash', label: 'Blinking\nLight' },
  { icon: 'dice', label: 'Dice\nRoll' },
  { icon: 'compass', label: 'Spinner\nWith Arrow' },
  { icon: 'hand-left', label: 'Rock Paper\nScissors' },
  { icon: 'pulse', label: 'Pulse\nTest' },
  { icon: 'shuffle', label: 'Random\nPicker' },
];

export default function SelectGame(): JSX.Element {
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
            <BubbleHeading
              text="SELECT GAME"
              fontSize={fontSize['2xl']}
              align="center"
            />
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.grid}>
            {GAMES.map((game) => {
              const isActive = !!game.route;
              return (
                <Pressable
                  key={game.label}
                  onPress={() =>
                    isActive &&
                    router.push({
                      pathname: game.route,
                      params: { mode: 'host' },
                    } as never)
                  }
                  style={({ pressed }) => [
                    styles.gameCard,
                    !isActive && styles.gameCardDisabled,
                    pressed && isActive && styles.gameCardPressed,
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={game.icon}
                      size={32}
                      color={colors.textInverse}
                      style={styles.iconShadow}
                    />
                  </View>
                  <Text
                    style={[
                      styles.gameLabel,
                      !isActive && styles.gameLabelDisabled,
                    ]}
                  >
                    {game.label}
                  </Text>
                  {!isActive ? (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>SOON</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
