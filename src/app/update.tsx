import Constants from 'expo-constants';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ActionButton } from '@/components/buttons';

export default function Update(): JSX.Element {
  const { t } = useTranslation();

  async function updateAsync(): Promise<void> {
    const androidPackageName = Constants.expoConfig?.android?.package;
    const iosAppId = Constants.expoConfig?.ios?.bundleIdentifier;

    if (Platform.OS === 'android' && androidPackageName) {
      const playStoreUrl = `https://play.google.com/store/apps/details?id=${androidPackageName}`;
      Linking.openURL(playStoreUrl).catch((err) =>
        console.error('Failed to open Play Store:', err),
      );
    }

    if (Platform.OS === 'ios' && iosAppId) {
      const appStoreUrl = `https://apps.apple.com/app/id${iosAppId}`;
      Linking.openURL(appStoreUrl).catch((err) =>
        console.error('Failed to open App Store:', err),
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('pages.update.title')}</Text>
      <Text style={styles.message}>{t('pages.update.message')}</Text>
      <ActionButton
        text={t('pages.update.button')}
        onPress={() => updateAsync()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing[20],
    paddingHorizontal: spacing[8],
    height: '100%',
    gap: spacing[4],
    justifyContent: 'flex-start',
    backgroundColor: colors.background,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[4],
    paddingBottom: spacing[20],
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
});
