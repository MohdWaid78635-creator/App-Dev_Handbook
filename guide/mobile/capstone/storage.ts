import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { openDatabaseAsync } from 'expo-sqlite';

export type Habit = { id: string; label: string; done: boolean };
export type HabitStore = {
  list(): Promise<Habit[]>;
  add(label: string): Promise<void>;
  toggle(habit: Habit): Promise<void>;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloud = url && key ? createClient(url, key, {
  auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
}) : null;

let database: ReturnType<typeof openDatabaseAsync> | undefined;
async function localDb() {
  database ??= openDatabaseAsync('habit-check-in.db').then(async db => {
    await db.execAsync('CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY, label TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)');
    return db;
  }).catch(error => {
    database = undefined;
    throw error;
  });
  return database;
}

export const localHabits: HabitStore = {
  async list() {
    const db = await localDb();
    const rows = await db.getAllAsync<{ id: number; label: string; done: number }>('SELECT id, label, done FROM habits ORDER BY id DESC');
    return rows.map(row => ({ ...row, id: String(row.id), done: Boolean(row.done) }));
  },
  async add(label) {
    const db = await localDb();
    await db.runAsync('INSERT INTO habits (label) VALUES (?)', label);
  },
  async toggle(habit) {
    const db = await localDb();
    await db.runAsync('UPDATE habits SET done = ? WHERE id = ?', habit.done ? 0 : 1, Number(habit.id));
  },
};

export function makeCloudHabits(client: NonNullable<typeof cloud>): HabitStore {
  return {
    async list() {
      const { data, error } = await client.from('habits').select('id,label,done').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    async add(label) {
      const { error } = await client.from('habits').insert({ label });
      if (error) throw error;
    },
    async toggle(habit) {
      const { error } = await client.from('habits').update({ done: !habit.done }).eq('id', habit.id).select('id').single();
      if (error) throw error;
    },
  };
}
