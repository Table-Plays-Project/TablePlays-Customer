import * as Linking from 'expo-linking';

export const RESET_PASSWORD_REDIRECT = Linking.createURL('reset-password');

export const OTP_LENGTH = 6;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;
