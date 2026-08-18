import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthSession, FamilyMember } from '@/types';
import * as authStore from '@/store/authStore';
import { getMemberById } from '@/store/memberStore';

interface AuthContextValue {
  session: AuthSession | null;
  currentMember: FamilyMember | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    gender?: 'male' | 'female' | 'other',
    dateOfBirth?: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshMember: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  currentMember: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => {},
  register: async () => ({ success: false }),
  refreshMember: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(authStore.getSession());
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);

  const refreshMember = useCallback(() => {
    if (session) {
      const member = getMemberById(session.memberId);
      setCurrentMember(member ?? null);
    } else {
      setCurrentMember(null);
    }
  }, [session]);

  useEffect(() => {
    refreshMember();
  }, [refreshMember]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authStore.login(email, password);
    if (result.success && result.session) {
      setSession(result.session);
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(() => {
    authStore.logout();
    setSession(null);
    setCurrentMember(null);
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      gender: 'male' | 'female' | 'other' = 'other',
      dateOfBirth: string = ''
    ) => {
      const result = await authStore.register(name, email, password, gender, dateOfBirth);
      if (result.success) {
        return login(email, password);
      }
      return { success: false, error: result.error };
    },
    [login]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        currentMember,
        isAuthenticated: session !== null,
        login,
        logout,
        register,
        refreshMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
