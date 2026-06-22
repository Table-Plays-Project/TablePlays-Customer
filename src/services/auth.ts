import { supabase } from '@/lib/supabase';

export type AuthError = { message: string };

function safeErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string') {
      if (
        msg.toLowerCase().includes('rate') ||
        msg.toLowerCase().includes('too many')
      )
        return 'Too many attempts. Please wait a few minutes and try again.';
      if (msg.length < 200) return msg;
    }
  }
  return fallback;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return { error: { message: safeErrorMessage(error, 'Sign in failed.') } };
    return { error: null };
  } catch (e) {
    console.error('signInWithEmail failed:', e);
    return { error: { message: 'Sign in failed. Please try again.' } };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{ sessionExists: boolean; error: AuthError | null }> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error)
      return {
        sessionExists: false,
        error: {
          message: safeErrorMessage(error, 'Sign up failed. Please try again.'),
        },
      };
    return { sessionExists: !!session, error: null };
  } catch (e) {
    console.error('signUpWithEmail failed:', e);
    return {
      sessionExists: false,
      error: { message: 'Sign up failed. Please try again.' },
    };
  }
}

export async function signOutUser(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error)
      return {
        error: { message: safeErrorMessage(error, 'Sign out failed.') },
      };
    return { error: null };
  } catch (e) {
    console.error('signOutUser failed:', e);
    return { error: { message: 'Sign out failed. Please try again.' } };
  }
}

export async function sendPasswordReset(
  email: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Password reset failed. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('sendPasswordReset failed:', e);
    return { error: { message: 'Password reset failed. Please try again.' } };
  }
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Verification failed. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('verifyOtp failed:', e);
    return { error: { message: 'Verification failed. Please try again.' } };
  }
}

export async function resendSignupOtp(
  email: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Failed to resend code. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('resendSignupOtp failed:', e);
    return { error: { message: 'Failed to resend code. Please try again.' } };
  }
}

export async function setUserSession(
  accessToken: string,
  refreshToken: string,
): Promise<{ email: string | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error)
      return {
        email: null,
        error: {
          message: safeErrorMessage(error, 'Session restore failed.'),
        },
      };
    return { email: data.user?.email ?? null, error: null };
  } catch (e) {
    console.error('setUserSession failed:', e);
    return { email: null, error: { message: 'Session restore failed.' } };
  }
}

export async function signInWithGoogleToken(
  idToken: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Google sign-in failed. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('signInWithGoogleToken failed:', e);
    return {
      error: { message: 'Google sign-in failed. Please try again.' },
    };
  }
}

export async function updateUserPassword(
  password: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Password update failed. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('updateUserPassword failed:', e);
    return { error: { message: 'Password update failed. Please try again.' } };
  }
}

export async function updateUserProfile(
  firstName: string,
  lastName: string,
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    if (error)
      return {
        error: {
          message: safeErrorMessage(
            error,
            'Profile update failed. Please try again.',
          ),
        },
      };
    return { error: null };
  } catch (e) {
    console.error('updateUserProfile failed:', e);
    return { error: { message: 'Profile update failed. Please try again.' } };
  }
}

export async function signInAsGuest(): Promise<{
  userId: string | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error)
      return {
        userId: null,
        error: {
          message: safeErrorMessage(
            error,
            'Failed to join as guest. Please try again.',
          ),
        },
      };
    return { userId: data.user?.id ?? null, error: null };
  } catch (e) {
    console.error('signInAsGuest failed:', e);
    return {
      userId: null,
      error: { message: 'Failed to join as guest. Please try again.' },
    };
  }
}
