type Session = { user: { id: string } };
export type AuthPort = {
  getSession(): Promise<{ data: { session: Session | null }; error: unknown }>;
  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe(): void } } };
  startAutoRefresh(): void | Promise<void>;
  stopAutoRefresh(): void | Promise<void>;
};
export type SessionState = { status: 'loading' | 'guest' | 'signed-in' | 'error'; userId: string | null; generation: number; error: string };

export function createSessionController(auth: AuthPort, onChange: (state: SessionState) => void, timeoutMs = 10000) {
  let alive = true;
  let foreground: boolean | undefined;
  let state: SessionState = { status: 'loading', userId: null, generation: 0, error: '' };
  function publish(session: Session | null) {
    if (!alive) return;
    state = { status: session ? 'signed-in' : 'guest', userId: session?.user.id ?? null, generation: state.generation + 1, error: '' };
    onChange({ ...state });
  }
  function failure(generation: number) {
    if (!alive || generation !== state.generation) return;
    state = { status: 'error', userId: null, generation: state.generation + 1, error: 'Could not refresh your account. Your local data is kept.' };
    onChange({ ...state });
  }
  // Auth callbacks stay synchronous; calling another auth method here can deadlock the SDK.
  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => publish(session));
  const startupGeneration = state.generation;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Session check timed out.')), timeoutMs); });
  const ready = Promise.race([auth.getSession(), timeout]).then(result => {
    if (!alive || state.generation !== startupGeneration) return;
    if (result.error) failure(startupGeneration); else publish(result.data.session);
  }).catch(() => failure(startupGeneration)).finally(() => clearTimeout(timer));

  return {
    ready,
    getSnapshot: () => ({ ...state }),
    isCurrent: (generation: number) => alive && state.status === 'signed-in' && generation === state.generation,
    setForeground(active: boolean) {
      if (!alive || foreground === active) return;
      foreground = active;
      const generation = state.generation;
      try { void Promise.resolve(active ? auth.startAutoRefresh() : auth.stopAutoRefresh()).catch(() => failure(generation)); }
      catch { failure(generation); }
    },
    dispose() {
      if (!alive) return;
      alive = false;
      subscription.unsubscribe();
      if (foreground) {
        try { void Promise.resolve(auth.stopAutoRefresh()).catch(() => {}); } catch { /* Cleanup cannot update an unmounted provider. */ }
      }
    },
  };
}

export function parseAuthCallback(source: string): { kind: 'code'; code: string; recovery: boolean } | { kind: 'error' } {
  const url = new URL(source);
  if (url.protocol !== 'buildquestacademy:' || url.hostname !== 'auth-callback' || url.pathname || url.username || url.password || url.port || url.hash) {
    throw new Error('Unexpected authentication callback.');
  }
  const allowed = ['code', 'type', 'error', 'error_code', 'error_description'];
  const names: string[] = [];
  url.searchParams.forEach((_value, key) => names.push(key));
  if (names.some(name => !allowed.includes(name)) || new Set(names).size !== names.length) throw new Error('Invalid authentication callback fields.');
  if (url.searchParams.has('error')) {
    if (url.searchParams.has('code')) throw new Error('Ambiguous authentication callback.');
    return { kind: 'error' };
  }
  const code = url.searchParams.get('code') ?? '';
  const type = url.searchParams.get('type');
  if (!/^[a-zA-Z0-9._~-]{1,2048}$/.test(code) || (type !== null && type !== 'recovery')) throw new Error('Invalid authentication code.');
  return { kind: 'code', code, recovery: type === 'recovery' };
}
