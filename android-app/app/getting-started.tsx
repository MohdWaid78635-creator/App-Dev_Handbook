import { Link } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgress } from '../src/progress/provider';
import type { CheckpointId } from '../src/progress/store';
import { colors } from '../src/theme';

const checkpoints: { id: CheckpointId; title: string; task: string; proof: string }[] = [
  {
    id: 'tools', title: 'Set up your computer',
    task: 'Install Node.js LTS, Git, and a code editor. Open a terminal and run node -v, npm -v, and git --version. Get a compatible Expo Go app on your Android phone, or set up an Android emulator.',
    proof: 'The three commands show version numbers and you have an Android device or emulator ready.',
  },
  {
    id: 'first-edit', title: 'Run and edit your first screen',
    task: 'On your computer, open the Habit Check-in capstone folder in a terminal. Run npm ci, then npm start. Open it on Android. Edit the title in Starter.tsx and save.',
    proof: 'The Habit Check-in screen opens on Android and shows the title you typed.',
  },
  {
    id: 'git-checkpoint', title: 'Save a Git checkpoint',
    task: 'In your own copy, use git status and git diff to review the edit. Save the changed Starter.tsx file in a Git commit, then verify the commit with git log -1.',
    proof: 'Git shows your checkpoint and you can explain what changed.',
  },
  {
    id: 'habit-lab', title: 'Save a habit and recover from a failure',
    task: 'Open Local lab. Add a habit, close the sample app, and confirm the habit is still there when you reopen it. Simulate a failed save and retry.',
    proof: 'The failed save keeps your draft, and retry adds exactly one habit.',
  },
];

export default function GettingStarted() {
  const { bottom } = useSafeAreaInsets();
  const { progress, saveError, toggleCheckpoint } = useProgress();
  const [resourceError, setResourceError] = useState('');

  async function openGuide() {
    setResourceError('');
    try {
      await Linking.openURL('https://github.com/MohdWaid78635-creator/App-Dev_Handbook/tree/master/guide/mobile/capstone');
    } catch {
      setResourceError('Could not open the capstone guide. Look for guide/mobile/capstone in the App Builder’s Handbook repository.');
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <Text style={styles.eyebrow}>YOUR FIRST ANDROID BUILD</Text>
        <Text accessibilityRole="header" style={styles.heading}>Get your workshop ready</Text>
        <Text style={styles.body}>Follow the steps on your computer. Check off each one after you see the result on Android.</Text>
        <Text accessibilityLiveRegion="polite" style={styles.progress}>{progress.checkpoints.length} of {checkpoints.length} steps checked</Text>
        {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
        <Pressable accessibilityRole="link" style={styles.secondary} onPress={() => void openGuide()}>
          <Text style={styles.secondaryText}>Open Habit Check-in files and guide</Text>
        </Pressable>
        {resourceError ? <Text accessibilityRole="alert" style={styles.notice}>{resourceError}</Text> : null}
        {checkpoints.map((checkpoint, index) => {
          const checked = progress.checkpoints.includes(checkpoint.id);
          return (
            <View key={checkpoint.id} style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>{index + 1}. {checkpoint.title}</Text>
              <Text style={styles.body}>{checkpoint.task}</Text>
              <Text style={styles.proof}><Text style={styles.strong}>You should see</Text> {checkpoint.proof}</Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${checkpoint.title} verified`}
                onPress={() => toggleCheckpoint(checkpoint.id)}
                style={({ pressed }) => [styles.check, checked && styles.checked, pressed && styles.pressed]}>
                <Text style={styles.checkText}>{checked ? '✓ Checked' : 'Mark as checked'}</Text>
              </Pressable>
            </View>
          );
        })}
        <Link href="/mission/0" asChild>
          <Pressable accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Open the first mission</Text></Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  eyebrow: { color: colors.purple, fontSize: 13, fontWeight: '800', letterSpacing: 1.3 },
  heading: { color: colors.ink, fontSize: 32, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  progress: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  card: { padding: 16, gap: 10, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 16 },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  proof: { color: colors.ink, fontSize: 16, lineHeight: 23, backgroundColor: colors.lavender, padding: 12, borderRadius: 10 },
  strong: { fontWeight: '800' },
  check: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignSelf: 'flex-start', backgroundColor: colors.lavender },
  checked: { backgroundColor: colors.mint },
  pressed: { opacity: 0.75 },
  checkText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  secondary: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignSelf: 'flex-start' },
  secondaryText: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  primary: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.purple, borderRadius: 12, justifyContent: 'center', alignSelf: 'flex-start' },
  primaryText: { color: colors.card, fontSize: 16, fontWeight: '800' },
  notice: { color: colors.ink, backgroundColor: '#fff0d4', padding: 12, borderRadius: 12 },
});
