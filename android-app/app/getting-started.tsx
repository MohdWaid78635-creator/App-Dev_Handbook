import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from '../src/components/Link';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgress } from '../src/progress/provider';
import type { CheckpointId } from '../src/progress/store';
import { homeColors as colors } from '../src/theme';

const checkpoints: { id: CheckpointId; title: string; task: string; commands?: string[]; after?: string; proof: string }[] = [
  {
    id: 'tools', title: 'Set up your computer',
    task: 'Install Node.js LTS, Git, and a code editor. Open a terminal and run node -v, npm -v, and git --version. Get a compatible Expo Go app on your Android phone, or set up an Android emulator.',
    proof: 'The three commands show version numbers and you have an Android device or emulator ready.',
  },
  {
    id: 'first-edit', title: 'Run and edit your first screen',
    task: 'On your computer, open the Habit Check-in capstone folder in a terminal.',
    commands: ['npm ci', 'npm start'],
    after: 'Open it on Android. Edit the title in Starter.tsx and save.',
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

function FirstMissionAction({ bottom }: { bottom: number }) {
  return <View style={[styles.footer, { paddingBottom: Math.max(bottom, 12) }]}>
    <View style={styles.footerColumn}>
      <Link href="/mission/0" asChild>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Open the first mission</Text>
          <Ionicons name="arrow-forward" size={23} color={colors.white} importantForAccessibility="no" />
        </Pressable>
      </Link>
    </View>
  </View>;
}

export default function GettingStarted() {
  const { top, bottom } = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const dockAction = height >= 600 && fontScale <= 1.5;
  const { progress, saveError, toggleCheckpoint } = useProgress();
  const [resourceError, setResourceError] = useState('');
  const [expanded, setExpanded] = useState<CheckpointId | null>(() =>
    checkpoints.find(checkpoint => !progress.checkpoints.includes(checkpoint.id))?.id ?? null);

  async function openGuide() {
    setResourceError('');
    try {
      await Linking.openURL('https://github.com/MohdWaid78635-creator/App-Dev_Handbook/tree/master/guide/mobile/capstone');
    } catch {
      setResourceError('Could not open the capstone guide. Look for guide/mobile/capstone in the App Builder’s Handbook repository.');
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: dockAction ? 24 : Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Link href="/" dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
              <Text style={styles.backLabel}>Home</Text>
            </Pressable>
          </Link>
          <Text accessibilityRole="header" style={styles.headerTitle}>Start Here</Text>
          <Link href="/help" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        <Text style={styles.eyebrow}>YOUR FIRST ANDROID BUILD</Text>
        <Text accessibilityRole="header" style={styles.heading}>Get your workshop ready</Text>
        <Text style={styles.body}>Follow the steps on your computer. Check off each one after you see the result on Android.</Text>
        <Text accessibilityLiveRegion="polite" style={styles.progress}>{progress.checkpoints.length} of {checkpoints.length} steps checked</Text>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Setup steps checked"
          accessibilityValue={{ min: 0, max: checkpoints.length, now: progress.checkpoints.length }}>
          <View style={[styles.fill, { width: `${progress.checkpoints.length / checkpoints.length * 100}%` }]} />
        </View>
        {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.secondary, pressed && styles.pressed]} onPress={() => void openGuide()}>
          <Ionicons name="folder-open-outline" size={25} color={colors.ink} importantForAccessibility="no" />
          <Text style={styles.secondaryText}>Habit Check-in files & guide</Text>
          <Ionicons name="open-outline" size={23} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
        {resourceError ? <Text accessibilityRole="alert" style={styles.notice}>{resourceError}</Text> : null}
        {checkpoints.map((checkpoint, index) => {
          const checked = progress.checkpoints.includes(checkpoint.id);
          const open = expanded === checkpoint.id;
          return (
            <View key={checkpoint.id} style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
                accessibilityLabel={`Step ${index + 1}: ${checkpoint.title}${checked ? '. Checked.' : ''}`}
                onPress={() => setExpanded(previous => previous === checkpoint.id ? null : checkpoint.id)}
                style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}>
                <View style={[styles.marker, checked && styles.checkedMarker]} importantForAccessibility="no-hide-descendants">
                  {checked ? <Ionicons name="checkmark" size={23} color={colors.white} />
                    : <Text style={styles.markerText}>{String(index + 1).padStart(2, '0')}</Text>}
                </View>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardTitle}>{checkpoint.title}</Text>
                  {checked ? <Text style={styles.checkedLabel}>Checked</Text> : null}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
              </Pressable>
              {open ? <View style={styles.cardBody}>
              <Text style={styles.body}>{checkpoint.task}</Text>
              {checkpoint.commands ? <View style={styles.codeBlock}>
                {checkpoint.commands.map(command => <Text key={command} selectable style={styles.command}>{command}</Text>)}
              </View> : null}
              {checkpoint.after ? <Text style={styles.body}>{checkpoint.after}</Text> : null}
              <View style={styles.proof}>
                <Ionicons name="eye-outline" size={25} color={colors.success} importantForAccessibility="no" />
                <Text style={styles.proofText}><Text style={styles.strong}>You should see{'\n'}</Text>{checkpoint.proof}</Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${checkpoint.title} verified`}
                onPress={() => toggleCheckpoint(checkpoint.id)}
                style={({ pressed }) => [styles.check, checked && styles.checked, pressed && styles.pressed]}>
                <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={26} color={checked ? colors.success : colors.muted} importantForAccessibility="no" />
                <Text style={styles.checkText}>{checked ? 'Checked' : 'Mark as checked'}</Text>
              </Pressable>
              </View> : null}
            </View>
          );
        })}
        {!dockAction ? <FirstMissionAction bottom={0} /> : null}
      </View>
    </ScrollView>
    {dockAction ? <FirstMissionAction bottom={bottom} /> : null}
    </View>
  );
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  progress: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  track: { height: 12, borderRadius: 8, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.purple, borderRadius: 8 },
  card: { ...clay, backgroundColor: colors.card, borderRadius: 24 },
  disclosure: { minHeight: 60, padding: 16, gap: 10, flexDirection: 'row', alignItems: 'center' },
  marker: { width: 36, minHeight: 36, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  checkedMarker: { backgroundColor: colors.success },
  markerText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  cardHeading: { flex: 1, gap: 4 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 25 },
  checkedLabel: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  codeBlock: { padding: 14, gap: 4, backgroundColor: colors.background, borderRadius: 18 },
  command: { color: colors.ink, fontSize: 16, lineHeight: 24, fontFamily: 'monospace' },
  proof: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.mint },
  proofText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  strong: { fontWeight: '800', fontSize: 17 },
  check: { minHeight: 48, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checked: { backgroundColor: colors.mint },
  pressed: { opacity: 0.75 },
  checkText: { color: colors.ink, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  secondary: { ...clay, minHeight: 56, padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 22 },
  secondaryText: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' },
  primary: { ...clay, minHeight: 54, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple, borderRadius: 24 },
  primaryText: { color: colors.white, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  footer: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 12, paddingHorizontal: 14 },
  footerColumn: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  notice: { color: colors.ink, fontSize: 16, lineHeight: 24, backgroundColor: colors.attentionSurface, padding: 16, borderRadius: 20 },
});
