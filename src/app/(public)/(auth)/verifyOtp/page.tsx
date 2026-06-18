import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { ActionButton, NavigationButton } from '@/components/buttons';
import OtpInput from '@/components/OtpInput';
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '@/constants/config';
import { colors, fontSize } from '@/constants/theme';
import { verifyOtp, resendSignupOtp, sendPasswordReset } from '@/services/auth';

import styles from './styles';

type FlowType = 'signup' | 'password-reset';

export default function VerifyOtpPage(): JSX.Element {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    email: string;
    flow: FlowType;
  }>();
  const email = params.email ?? '';
  const flow: FlowType =
    params.flow === 'password-reset' ? 'password-reset' : 'signup';

  const [code, setCode] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback((): void => {
    setCountdown(OTP_RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  async function handleSubmit(): Promise<void> {
    const token = code.join('');
    if (token.length < OTP_LENGTH) {
      setError('Please enter the full verification code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(email, token);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (flow === 'signup') {
        router.replace({
          pathname: '/(public)/(auth)/success/page',
          params: { flow: 'signup' },
        });
      } else {
        router.replace('/(public)/(auth)/updatePassword/page');
      }
    } catch (e) {
      setError('Network error. Please check your connection.');
      console.error('handleSubmit failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (countdown > 0) return;
    setError(null);
    try {
      const result =
        flow === 'signup'
          ? await resendSignupOtp(email)
          : await sendPasswordReset(email);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      startCountdown();
    } catch (e) {
      setError('Failed to resend code. Please try again.');
      console.error('handleResend failed:', e);
    }
  }

  const formattedCountdown = `0:${String(countdown).padStart(2, '0')}`;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={styles.backButton}>
            <NavigationButton
              arrow="arrow-back"
              onPress={() => router.back()}
            />
          </View>

          <View style={styles.titleWrap}>
            <BubbleHeading
              text={t('pages.verifyOtp.title')}
              fontSize={fontSize['4xl']}
              align="left"
            />
          </View>

          <Text style={styles.subtitle}>{t('pages.verifyOtp.subtitle')}</Text>

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

          <OtpInput code={code} onCodeChange={setCode} />

          <ActionButton
            onPress={handleSubmit}
            text={t('pages.verifyOtp.button')}
            disabled={code.join('').length < OTP_LENGTH || loading}
          />

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendDisabledText}>
                {t('pages.verifyOtp.resend')}{' '}
                <Text style={styles.resendCountdown}>{formattedCountdown}</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendText}>
                  {t('pages.verifyOtp.resendReady')}
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.spamHint}>{t('pages.verifyOtp.spamHint')}</Text>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
