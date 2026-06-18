import { useState } from 'react';
import { signUpWithEmail } from '@/services/auth';

type SignUpResult = { success: boolean; needsEmailVerification: boolean };

type UseSignUpReturn = {
  handleSignUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<SignUpResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

export default function useSignUp(): UseSignUpReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<SignUpResult> {
    setLoading(true);
    setError(null);
    const { sessionExists, error: authError } = await signUpWithEmail(
      email,
      password,
      firstName,
      lastName,
    );
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return { success: false, needsEmailVerification: false };
    }
    return { success: true, needsEmailVerification: !sessionExists };
  }

  return { handleSignUp, loading, error, clearError: () => setError(null) };
}
