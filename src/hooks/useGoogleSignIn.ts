import { useState } from 'react';

import { signInWithGoogleToken } from '@/services/auth';

type UseGoogleSignInReturn = {
  triggerGoogleSignIn: () => void;
  loading: boolean;
  error: string | null;
};

export default function useGoogleSignIn(): UseGoogleSignInReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function triggerGoogleSignIn(): Promise<void> {
    setError(null);
    setLoading(true);

    try {
      const { GoogleSignin, statusCodes } = await import(
        '@react-native-google-signin/google-signin'
      );

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        setError('No ID token received from Google.');
        return;
      }

      const result = await signInWithGoogleToken(idToken);
      if (result.error) {
        setError(result.error.message);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.message?.includes('could not be found')) {
        setError('Google Sign-In requires a development build.');
      } else if (err.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — not an error
      } else if (err.code === 'IN_PROGRESS') {
        setError('Sign-in already in progress.');
      } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Google Play Services not available.');
      } else {
        console.error('Google sign-in failed:', e);
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return { triggerGoogleSignIn, loading, error };
}
