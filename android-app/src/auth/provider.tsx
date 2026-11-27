import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { configuration, getCloudClient } from '../cloud/client';
import { createSessionController } from './session';
import type { SessionState } from './session';

type Controller = ReturnType<typeof createSessionController>;
type AuthContextValue = { session: SessionState; configurationStatus: typeof configuration.status; isCurrent(generation: number): boolean };
const AuthContext = createContext<AuthContextValue | null>(null);
const guest: SessionState = { status: 'guest', userId: null, generation: 0, error: '' };

// Mount only after Phase 3 connects account-scoped data; existing stores are still guest-only.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(guest);
  const controller = useRef<Controller | null>(null);
  useEffect(() => {
    const client = getCloudClient();
    if (!client) return;
    const current = createSessionController(client.auth, setSession);
    controller.current = current;
    current.setForeground(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', state => current.setForeground(state === 'active'));
    return () => { subscription.remove(); current.dispose(); controller.current = null; };
  }, []);
  return <AuthContext.Provider value={{ session, configurationStatus: configuration.status,
    isCurrent: generation => controller.current?.isCurrent(generation) ?? false }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is not mounted.');
  return value;
}
