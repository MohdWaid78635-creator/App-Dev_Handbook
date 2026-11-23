import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import Starter from './Starter';
import { cloud, localHabits, makeCloudHabits } from './storage';
import type { Habit, HabitStore } from './storage';

const cloudHabits = cloud ? makeCloudHabits(cloud) : null;

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

function Habits({ store }: { store: HabitStore }) {
  const [rows, setRows] = useState<Habit[] | null>(null);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const failNextSave = useRef(false);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    void store.list().then(value => { if (active) setRows(value); }).catch(() => {
      if (active) setNotice('Could not load habits. Try again.');
    });
    return () => { active = false; };
  }, [store]);

  async function run(work: () => Promise<void>, onSuccess?: () => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice('');
    let didWrite = false;
    try {
      await work();
      didWrite = Boolean(onSuccess);
      onSuccess?.();
      setRows(await store.list());
    } catch {
      setNotice(didWrite ? 'Saved. Refresh to see the updated list.' : 'Could not finish. Refresh and check the list before retrying.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function add() {
    const label = draft.trim();
    if (!label) { setNotice('Enter a habit name first.'); return; }
    if (failNextSave.current) {
      failNextSave.current = false;
      setNotice('Practice failure: the save was stopped before it reached storage. Your draft is safe. Tap Add habit again.');
      return;
    }
    void run(() => store.add(label), () => setDraft(''));
  }

  return (
    <View style={styles.group}>
      <Text nativeID="habit-label" style={styles.label}>Habit name</Text>
      <TextInput accessibilityLabelledBy="habit-label" editable={!busy} style={styles.input} value={draft} onChangeText={setDraft} maxLength={60} placeholder="Walk for five minutes" />
      <Action label="Add habit" onPress={add} disabled={busy || rows === null} />
      <Action label="Simulate next save failure" disabled={busy} onPress={() => {
        failNextSave.current = true;
        setNotice('The next valid save will stop before writing.');
      }} />
      <Text accessibilityLiveRegion="polite">{notice || (rows === null ? 'Loading habits…' : busy ? 'Working…' : rows.length ? '' : 'No habits yet. Add your first one.')}</Text>
      <Action label="Refresh list" disabled={busy} onPress={() => void run(async () => {})} />
      {rows?.map(habit => (
        <Pressable key={habit.id} accessibilityRole="checkbox" accessibilityState={{ checked: habit.done, disabled: busy }} accessibilityLabel={habit.label} disabled={busy} style={styles.row} onPress={() => void run(() => store.toggle(habit), () => {})}>
          <Text>{habit.done ? '✓ Completed' : '○ Ready'}  {habit.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState<'starter' | 'local' | 'cloud'>('starter');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const subscription = cloud?.auth.onAuthStateChange((_event, next) => setSession(next)).data.subscription;
    return () => subscription?.unsubscribe();
  }, []);

  async function signIn() {
    if (!cloud || busy) return;
    setBusy(true);
    setAuthNotice('');
    try {
      const { error } = await cloud.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setAuthNotice('Sign-in failed. Check your disposable development account.');
      else setPassword('');
    } catch { setAuthNotice('Could not reach the development backend.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!cloud || busy) return;
    setBusy(true);
    try {
      const { error } = await cloud.auth.signOut();
      if (error) setAuthNotice('Could not sign out. Check connectivity and retry.');
    } catch { setAuthNotice('Could not sign out. Check connectivity and retry.'); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior="height">
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">Habit Check-in</Text>
        <View style={styles.tabs}>
          <Action label="First screen" onPress={() => setMode('starter')} />
          <Action label="Local lab" onPress={() => setMode('local')} />
          {cloud && <Action label="Cloud lab" onPress={() => setMode('cloud')} />}
        </View>
        {mode === 'starter' && <Starter />}
        {mode === 'local' && <Habits key="local" store={localHabits} />}
        {mode === 'cloud' && cloudHabits && (session ? <>
          <Text>Development account: {session.user.email}</Text>
          <Text accessibilityLiveRegion="polite">{authNotice}</Text>
          <Action label="Sign out" disabled={busy} onPress={() => void signOut()} />
          <Habits key={session.user.id} store={cloudHabits} />
        </> : <View style={styles.group}>
          <Text>Use a disposable account from your development Supabase project.</Text>
          <TextInput accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
          <TextInput accessibilityLabel="Password" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" />
          <Action label="Sign in" disabled={busy || !email.trim() || !password} onPress={() => void signIn()} />
          <Text accessibilityLiveRegion="polite">{authNotice}</Text>
        </View>)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f3ff' },
  screen: { padding: 20, paddingTop: 64, paddingBottom: 40, gap: 16 },
  title: { fontWeight: '900', fontSize: 32, color: '#201a43' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { gap: 10 },
  button: { borderRadius: 12, backgroundColor: '#5636cf', minHeight: 48, padding: 12, justifyContent: 'center', alignSelf: 'flex-start' },
  disabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontWeight: '700' },
  label: { fontWeight: '700', color: '#201a43' },
  input: { minHeight: 48, borderColor: '#7664a5', borderWidth: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff' },
  row: { minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: '#fff' },
});
