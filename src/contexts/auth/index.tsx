import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { CurrentUser } from './types';

interface AuthContextProps {
  user: CurrentUser | null;
  setAuth: (authUser: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  setAuth: () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextProps['user']>(null);

  const setAuth = useCallback((authUser: CurrentUser | null) => {
    setUser(authUser);
  }, []);

  const value = useMemo(() => ({ user, setAuth }), [user, setAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

export default { AuthProvider, useAuth };
