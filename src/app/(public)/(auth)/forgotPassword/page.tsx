import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AppBackground from '@/components/AppBackground';
import { ActionButton, NavigationButton } from '@/components/buttons';
import { MyAppEmailInput } from '@/components/inputs';
import useResetPassword from '@/hooks/useResetPassword';
import { colors } from '@/constants/theme';

import styles from './styles';

type FormFields = {
  email: string;
};

export default function ForgotPassword(): JSX.Element {
  const { t } = useTranslation();
  const { handleResetPassword, loading, error } = useResetPassword();

  const schema = z.object({
    email: z.string().email(t('fields.email.errors.invalid')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormFields>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormFields): Promise<void> {
    const success = await handleResetPassword(email);
    if (success) {
      router.replace({
        pathname: '/(public)/(auth)/verifyOtp/page',
        params: { email, flow: 'password-reset' },
      });
    }
  }

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

          <Text style={styles.title}>{t('pages.forgotPassword.title')}</Text>
          <Text style={styles.subtitle}>
            {t('pages.forgotPassword.subtitle')}
          </Text>

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

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppEmailInput
                variant="pill"
                label={t('fields.email.label')}
                onChangeText={onChange}
                placeholder={t('fields.email.placeholder')}
                errorMessage={errors.email?.message}
                {...rest}
              />
            )}
          />

          <ActionButton
            onPress={handleSubmit(onSubmit)}
            text={t('pages.forgotPassword.button')}
            disabled={!watch('email') || loading}
          />

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>
              {t('pages.forgotPassword.backToSignIn')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
