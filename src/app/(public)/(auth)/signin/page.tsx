import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { ActionButton, GoogleSignInButton } from '@/components/buttons';
import { MyAppEmailInput, MyAppPasswordInput } from '@/components/inputs';
import useGoogleSignIn from '@/hooks/useGoogleSignIn';
import useSignIn from '@/hooks/useSignIn';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

export default function LoginPage(): JSX.Element {
  const { t } = useTranslation();
  const { handleSignIn, loading, error } = useSignIn();
  const {
    triggerGoogleSignIn,
    loading: _googleLoading,
    error: googleError,
  } = useGoogleSignIn();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const displayError = error ?? googleError;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={styles.badge}>
            <Ionicons
              name="game-controller"
              size={22}
              color={colors.textInverse}
            />
          </View>

          <View style={styles.titleWrap}>
            <BubbleHeading text={t('pages.signIn.title')} fontSize={48} />
          </View>

          <Text style={styles.subtitleText}>{t('pages.signIn.subtitle')}</Text>

          {displayError ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <MyAppEmailInput
            variant="pill"
            icon="mail-outline"
            label={t('fields.email.label')}
            placeholder={t('fields.email.placeholder')}
            onChangeText={setEmail}
            value={email}
          />
          <MyAppPasswordInput
            variant="pill"
            icon="lock-closed-outline"
            label={t('fields.password.label')}
            onChangeText={setPassword}
            placeholder={t('fields.password.placeholder')}
            value={password}
          />

          <Pressable
            onPress={() => router.push('/(public)/(auth)/forgotPassword/page')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>
              {t('links.forgotPassword')}
            </Text>
          </Pressable>

          <ActionButton
            onPress={() => handleSignIn(email, password)}
            text={t('buttons.signIn')}
            disabled={!email || !password || loading}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>
              {t('pages.signIn.newOwner')}
            </Text>
            <Pressable
              onPress={() => router.push('/(public)/(auth)/signup/page')}
            >
              <Text style={styles.registerLink}>
                {t('pages.signIn.registerLink')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton
            onPress={triggerGoogleSignIn}
            text={t('buttons.continueWithGoogle')}
          />

          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>
              {t('pages.signIn.noAccount')}
            </Text>
            <Pressable
              onPress={() => router.push('/(public)/(auth)/signup/page')}
            >
              <Text style={styles.signUpLink}>
                {t('pages.signIn.signUpLink')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
