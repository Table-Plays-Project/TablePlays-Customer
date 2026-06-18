import { useState } from 'react';
import { signInWithEmail } from '@/services/auth';

type UseSignInReturn = {
  handleSignIn: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

export default function useSignIn(): UseSignInReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(
    email: string,
    password: string,
  ): Promise<boolean> {
    setLoading(true);
    setError(null);
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return false;
    }
    return true;
  }

  return { handleSignIn, loading, error, clearError: () => setError(null) };
}
