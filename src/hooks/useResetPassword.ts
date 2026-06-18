import { useState } from 'react';
import { sendPasswordReset } from '@/services/auth';

type UseResetPasswordReturn = {
  handleResetPassword: (email: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

export default function useResetPassword(): UseResetPasswordReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResetPassword(email: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    const { error: authError } = await sendPasswordReset(email);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return false;
    }
    return true;
  }

  return {
    handleResetPassword,
    loading,
    error,
    clearError: () => setError(null),
  };
}
