import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { setShowingSuccessScreen } from '@/app/_layout';
import AppBackground from '@/components/AppBackground';
import SuccessMascot from '@/components/SuccessMascot';

import styles from './styles';

type FlowType = 'signup' | 'password-reset' | 'welcome';

export default function SuccessPage(): JSX.Element {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ flow: FlowType }>();
  const flow: FlowType =
    params.flow === 'password-reset'
      ? 'password-reset'
      : params.flow === 'welcome'
        ? 'welcome'
        : 'signup';

  const content: Record<
    FlowType,
    { heading: string; subtitle: string; button: string }
  > = {
    signup: {
      heading: t('pages.success.accountVerified'),
      subtitle: t('pages.success.accountVerifiedSubtitle'),
      button: t('pages.success.done'),
    },
    'password-reset': {
      heading: t('pages.success.passwordChanged'),
      subtitle: t('pages.success.passwordChangedSubtitle'),
      button: t('pages.success.done'),
    },
    welcome: {
      heading: t('pages.success.welcome'),
      subtitle: t('pages.success.welcomeSubtitle'),
      button: t('pages.success.continueBtn'),
    },
  };

  function handleDone(): void {
    setShowingSuccessScreen(false);
    if (flow === 'welcome') {
      router.replace('/(private)/dashboard/page');
    } else {
      router.replace('/(public)/(auth)/signin/page');
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SuccessMascot
            heading={content[flow].heading}
            subtitle={content[flow].subtitle}
            buttonLabel={content[flow].button}
            onPress={handleDone}
          />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
