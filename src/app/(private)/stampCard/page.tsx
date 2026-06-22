import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import {
  ActionButton,
  NavigationButton,
  SecondaryButton,
} from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

function handleBack(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(private)/dashboard/page');
  }
}

export default function StampCardScreen(): JSX.Element {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    id: string;
    restaurant: string;
    stamps: string;
    totalSlots: string;
  }>();
  const { user } = AuthContext.useAuth();

  const userName =
    user?.user_metadata?.first_name ??
    user?.user_metadata?.name ??
    t('pages.stampCard.defaultUser');
  const stamps = parseInt(params.stamps ?? '0', 10);
  const totalSlots = parseInt(params.totalSlots ?? '12', 10);

  const slots = Array.from({ length: totalSlots }, (_, index) => index);

  function renderSlot(index: number): JSX.Element {
    const slotNumber = index + 1;
    const isStamped = slotNumber <= stamps;
    const isCurrent = slotNumber === stamps;

    if (isStamped) {
      return (
        <View
          key={index}
          style={[styles.slot, styles.slotStamped]}
          accessibilityLabel={`${t('pages.stampCard.stamp')} ${slotNumber}, ${t('pages.stampCard.completed')}`}
        >
          {isCurrent ? (
            <Text maxFontSizeMultiplier={1.3} style={styles.stampNumber}>
              {slotNumber}
            </Text>
          ) : (
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={colors.textInverse}
              style={styles.checkIcon}
            />
          )}
        </View>
      );
    }

    return (
      <View
        key={index}
        style={[styles.slot, styles.slotEmpty]}
        accessibilityLabel={`${t('pages.stampCard.stamp')} ${slotNumber}, ${t('pages.stampCard.empty')}`}
      >
        <Ionicons
          name="add"
          size={28}
          color="rgba(255, 255, 255, 0.7)"
          style={styles.plusIcon}
        />
      </View>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backRow}>
            <NavigationButton onPress={handleBack} arrow="arrow-back" />
          </View>

          <View style={styles.headingWrap}>
            <BubbleHeading
              text={`${userName.toUpperCase()}'S\n${t('pages.stampCard.heading')}`}
              fontSize={fontSize['3xl']}
            />
          </View>

          <View
            style={styles.grid}
            accessibilityLabel={`${t('pages.stampCard.stampProgress', { stamps, totalSlots })}`}
          >
            {slots.map((_, index) => renderSlot(index))}
          </View>

          <View style={styles.ctaSection}>
            <ActionButton
              onPress={() => {}}
              text={t('pages.stampCard.markStamp')}
            />
            <SecondaryButton
              onPress={() => {}}
              text={t('pages.stampCard.giveNewCard')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
