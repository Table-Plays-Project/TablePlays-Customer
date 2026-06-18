import { useState } from 'react';
import { useRouter } from 'expo-router';

import { updateUserPassword, signOutUser } from '@/services/auth';

export default function useAuthUpdatePass(): {
  handleUpdatePassword: (password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async (password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    const result = await updateUserPassword(password);
    await signOutUser();
    setLoading(false);
    if (!result.error) {
      router.replace({
        pathname: '/(public)/(auth)/success/page',
        params: { flow: 'password-reset' },
      });
    } else {
      setError(result.error.message);
    }
  };

  return { handleUpdatePassword, loading, error };
}
