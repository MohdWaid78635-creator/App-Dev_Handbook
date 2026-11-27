import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { cloudConfig } from './config';
import type { Database } from './database.types';
import { createSessionStorage } from '../auth/session-storage';
import { parseAuthCallback } from '../auth/session';

export const configuration = cloudConfig({
  enabled: process.env.EXPO_PUBLIC_ENABLE_CLOUD === 'true',
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  allowLocal: __DEV__,
});
let client: SupabaseClient<Database> | null = null;
export function getCloudClient(): SupabaseClient<Database> | null {
  if (configuration.status !== 'ready') return null;
  client ??= createClient<Database>(configuration.url, configuration.key, {
    auth: {
      storage: createSessionStorage(Storage),
      storageKey: `buildwisp-${new URL(configuration.url).host}-session`,
      flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, lock: processLock,
    },
  });
  return client;
}

// Called by the approved auth route in a later phase; no automatic deep-link sign-in yet.
export async function completeAuthCallback(source: string): Promise<{ recovery: boolean }> {
  const callback = parseAuthCallback(source);
  const cloud = getCloudClient();
  if (!cloud || callback.kind === 'error') throw new Error('Sign-in could not be completed. Please try again.');
  const { error } = await cloud.auth.exchangeCodeForSession(callback.code);
  if (error) throw new Error('This sign-in link is expired or belongs to another sign-in attempt.');
  return { recovery: callback.recovery };
}
