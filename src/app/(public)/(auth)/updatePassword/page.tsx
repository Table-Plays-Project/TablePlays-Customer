import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AppBackground from '@/components/AppBackground';
import { ActionButton, NavigationButton } from '@/components/buttons';
import { MyAppPasswordInput } from '@/components/inputs';
import useAuthUpdatePass from '@/hooks/useAuthUpdatePass';
import { colors } from '@/constants/theme';

import styles from './styles';

type FormFields = {
  password: string;
};

export default function UpdatePassword(): JSX.Element {
  const { handleUpdatePassword, loading, error } = useAuthUpdatePass();
  const { t } = useTranslation();

  const schema = z.object({
    password: z
      .string()
      .min(6, t('fields.password.errors.minLength'))
      .regex(/[A-Z]/, t('fields.password.errors.uppercase'))
      .regex(/[a-z]/, t('fields.password.errors.lowercase'))
      .regex(/[\W_]/, t('fields.password.errors.specialCharacter')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormFields>({ resolver: zodResolver(schema) });

  async function onSubmit({ password }: FormFields): Promise<void> {
    await handleUpdatePassword(password);
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

          <Text style={styles.title}>{t('pages.updatePassword.title')}</Text>
          <Text style={styles.subtitle}>
            {t('pages.updatePassword.subtitle')}
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
            name="password"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppPasswordInput
                variant="pill"
                label={t('fields.password.label')}
                onChangeText={onChange}
                placeholder={t('fields.password.placeholder')}
                textContentType="newPassword"
                errorMessage={errors.password?.message}
                {...rest}
              />
            )}
          />

          <ActionButton
            onPress={handleSubmit(onSubmit)}
            text={t('pages.updatePassword.button')}
            disabled={!watch('password') || loading}
          />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
