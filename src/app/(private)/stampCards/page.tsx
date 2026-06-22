import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import AppBackground from '@/components/AppBackground';
import { ActionButton, NavigationButton } from '@/components/buttons';

import styles from './styles';

type StampCard = {
  id: string;
  restaurant: string;
  stamps: number;
  totalSlots: number;
};

const MOCK_STAMP_CARDS: StampCard[] = [
  { id: '1', restaurant: 'CHILLOX', stamps: 3, totalSlots: 12 },
  { id: '2', restaurant: 'PIZZABURG', stamps: 1, totalSlots: 12 },
  { id: '3', restaurant: 'KFC', stamps: 5, totalSlots: 12 },
];

const BARCODE_BARS = [
  { height: 4, opacity: 0.9 },
  { height: 2, opacity: 0.5 },
  { height: 5, opacity: 0.9 },
  { height: 2, opacity: 0.4 },
  { height: 3, opacity: 0.8 },
  { height: 2, opacity: 0.5 },
  { height: 4, opacity: 0.9 },
  { height: 2, opacity: 0.4 },
  { height: 5, opacity: 0.8 },
  { height: 2, opacity: 0.5 },
  { height: 3, opacity: 0.9 },
  { height: 2, opacity: 0.4 },
];

function handleBack(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(private)/dashboard/page');
  }
}

function handleCardPress(card: StampCard): void {
  router.push({
    pathname: '/(private)/stampCard/page',
    params: {
      id: card.id,
      restaurant: card.restaurant,
      stamps: String(card.stamps),
      totalSlots: String(card.totalSlots),
    },
  } as never);
}

export default function StampCardsScreen(): JSX.Element {
  const { t } = useTranslation();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <NavigationButton onPress={handleBack} arrow="arrow-back" />

          <Text
            maxFontSizeMultiplier={1.3}
            style={styles.pageTitle}
            accessibilityRole="header"
          >
            {t('pages.stampCards.title')}
          </Text>

          <View style={styles.cardList}>
            {MOCK_STAMP_CARDS.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => handleCardPress(card)}
                style={({ pressed }) => [
                  styles.ticket,
                  pressed && styles.ticketPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${t('pages.stampCards.stampCardFrom')} ${card.restaurant}`}
              >
                <View style={styles.ticketLeft}>
                  <View style={styles.barcodeContainer}>
                    {BARCODE_BARS.map((bar, index) => (
                      <View
                        key={index}
                        style={[
                          styles.barcodeBar,
                          {
                            height: bar.height,
                            backgroundColor: `rgba(255, 255, 255, ${bar.opacity})`,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text maxFontSizeMultiplier={1.3} style={styles.forYouText}>
                    {t('pages.stampCards.forYou')}
                  </Text>
                </View>

                <View style={styles.ticketRight}>
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={styles.stampCardLabel}
                  >
                    {t('pages.stampCards.stampCardFrom')}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={styles.restaurantName}
                  >
                    {card.restaurant}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.bottomAction}>
            <ActionButton
              onPress={handleBack}
              text={t('pages.stampCards.back')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
