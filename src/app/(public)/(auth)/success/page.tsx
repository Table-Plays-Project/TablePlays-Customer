import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, View } from 'react-native';

import AppBackground from '@/components/AppBackground';
import SuccessMascot from '@/components/SuccessMascot';

import styles from './styles';

type FlowType = 'signup' | 'password-reset';

export default function SuccessPage(): JSX.Element {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ flow: FlowType }>();
  const flow: FlowType =
    params.flow === 'password-reset' ? 'password-reset' : 'signup';

  const heading =
    flow === 'signup'
      ? t('pages.success.accountVerified')
      : t('pages.success.passwordChanged');

  function handleDone(): void {
    router.replace('/(public)/(auth)/signin/page');
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <SuccessMascot
            heading={heading}
            buttonLabel={t('pages.success.done')}
            onPress={handleDone}
          />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}
