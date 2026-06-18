import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import {
  ActionButton,
  GoogleSignInButton,
  NavigationButton,
} from '@/components/buttons';
import {
  MyAppEmailInput,
  MyAppPasswordInput,
  MyAppTextInput,
} from '@/components/inputs';
import useGoogleSignIn from '@/hooks/useGoogleSignIn';
import useSignUp from '@/hooks/useSignUp';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export default function SignUp(): JSX.Element {
  const { t } = useTranslation();
  const { handleSignUp, loading, error } = useSignUp();

  const schema = z.object({
    firstName: z.string().min(2, t('fields.firstName.errors.minLength')),
    lastName: z.string().min(2, t('fields.lastName.errors.minLength')),
    email: z.string().email(t('fields.email.errors.invalid')),
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

  async function onSubmit({
    email,
    password,
    firstName,
    lastName,
  }: FormFields): Promise<void> {
    const result = await handleSignUp(email, password, firstName, lastName);
    if (result.success) {
      router.replace({
        pathname: '/(public)/(auth)/verifyOtp/page',
        params: { email, flow: 'signup' },
      });
    }
  }

  const {
    triggerGoogleSignIn,
    loading: _googleLoading,
    error: googleError,
  } = useGoogleSignIn();

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
              text={t('pages.signUp.title')}
              fontSize={fontSize['4xl']}
              align="left"
            />
          </View>
          <Text style={styles.subtitle}>{t('pages.signUp.subtitle')}</Text>

          {(error ?? googleError) ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.errorText}>{error ?? googleError}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppTextInput
                variant="pill"
                icon="person-outline"
                label={t('fields.firstName.label')}
                placeholder={t('fields.firstName.placeholder')}
                textContentType="givenName"
                errorMessage={errors.firstName?.message}
                onChangeText={onChange}
                {...rest}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppTextInput
                variant="pill"
                icon="person-outline"
                label={t('fields.lastName.label')}
                onChangeText={onChange}
                placeholder={t('fields.lastName.placeholder')}
                textContentType="familyName"
                errorMessage={errors.lastName?.message}
                {...rest}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppEmailInput
                variant="pill"
                icon="mail-outline"
                label={t('fields.email.label')}
                onChangeText={onChange}
                placeholder={t('fields.email.placeholder')}
                errorMessage={errors.email?.message}
                {...rest}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, ref: _ref, ...rest } }) => (
              <MyAppPasswordInput
                variant="pill"
                icon="lock-closed-outline"
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
            text={t('buttons.signUp')}
            disabled={
              !watch('firstName') ||
              !watch('lastName') ||
              !watch('email') ||
              !watch('password') ||
              loading
            }
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignInButton
            onPress={triggerGoogleSignIn}
            text={t('buttons.continueWithGoogle')}
          />

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>
              {t('pages.signUp.haveAccount')}
            </Text>
            <Pressable
              onPress={() => router.replace('/(public)/(auth)/signin/page')}
            >
              <Text style={styles.signInLink}>
                {t('pages.signUp.signInLink')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
