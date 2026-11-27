import Ionicons from '@expo/vector-icons/Ionicons';
import { setStringAsync } from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Link } from '../../src/components/Link';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import groups from '../../src/generated/readiness.json';
import { projectReadinessStore, projectStore } from '../../src/projects/local';
import { auditPrompt, checkPrompt, maxBuildLength, maxEvidenceLength, readinessCounts, readinessStatuses } from '../../src/projects/readiness';
import type { ReadinessStatus, ReleaseReview } from '../../src/projects/readiness';
import type { Project } from '../../src/projects/store';
import { homeColors as colors } from '../../src/theme';

type Group = typeof groups[number];
type Check = Group['checks'][number];
const statusKeys = Object.keys(readinessStatuses) as ReadinessStatus[];
const overviewStatuses: ReadinessStatus[] = ['passed', 'blocked', 'na', 'pending'];
const statusAppearance = {
  passed: { icon: 'checkmark-circle-outline', color: colors.success },
  blocked: { icon: 'warning-outline', color: colors.blocked },
  na: { icon: 'remove-circle-outline', color: colors.muted },
  pending: { icon: 'ellipse-outline', color: colors.purple },
} as const;

function Action({ label, onPress, primary = false, icon }: {
  label: string; onPress: () => void; primary?: boolean; icon?: 'copy-outline' | 'save-outline' | 'cube-outline';
}) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    {icon ? <Ionicons name={icon} size={23} color={primary ? colors.white : colors.purple} importantForAccessibility="no" /> : null}
    <Text style={[styles.actionText, primary ? styles.primaryLabel : styles.label]}>{label}</Text>
  </Pressable>;
}

function Prompt({ text, title, primary = false }: { text: string; title: string; primary?: boolean }) {
  const [preview, setPreview] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function copy() {
    try {
      if (await setStringAsync(text, { android: { isSensitive: true } })) {
        setFeedback('Prompt copied.');
        return;
      }
    } catch {
      // The selectable preview provides a clipboard fallback.
    }
    setPreview(true);
    setFeedback('Couldn’t copy. Select the prompt text to copy it.');
  }

  return <View style={styles.field}>
    <Action label={`Copy ${title}`} icon="copy-outline" primary={primary} onPress={() => { void copy(); }} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: preview }} onPress={() => setPreview(value => !value)}
      style={({ pressed }) => [styles.previewAction, pressed && styles.pressed]}>
      <Ionicons name="eye-outline" size={23} color={colors.purple} importantForAccessibility="no" />
      <Text style={styles.previewLabel}>{preview ? `Hide ${title}` : `Preview ${title}`}</Text>
    </Pressable>
    {feedback ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{feedback}</Text> : null}
    {preview ? <Text selectable style={styles.prompt}>{text}</Text> : null}
  </View>;
}

function CheckEditor({ project, review, group, check, onSave }: {
  project: Project; review: ReleaseReview; group: Group; check: Check; onSave: (review: ReleaseReview) => void;
}) {
  const entry = review.items[check.id];
  const [status, setStatus] = useState(entry?.status ?? 'pending');
  const [evidence, setEvidence] = useState(entry?.evidence ?? '');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const { fontScale } = useWindowDimensions();
  const changed = status !== (entry?.status ?? 'pending') || evidence.trim() !== (entry?.evidence ?? '');

  function save() {
    setError(true);
    if (status !== 'pending' && !evidence.trim()) {
      setFeedback('Enter evidence or a reason before saving this status.');
      return;
    }
    try {
      const saved = projectReadinessStore(project.id).saveCheck(review.build, check.id, status, evidence);
      onSave(saved);
      Keyboard.dismiss();
      setError(false);
      setFeedback('Check saved on this device.');
    } catch {
      setFeedback('Couldn’t save the check. Your edits are still here. Try again.');
    }
  }

  return <View style={styles.card}>
    <Text style={styles.kicker}>{group.title.toUpperCase()}</Text>
    <Text accessibilityRole="header" style={styles.heading}>{check.title}</Text>
    <Prompt text={checkPrompt(project.name, review.build, group, check)} title="check prompt" />
    <View style={styles.statusHeading}>
      <Text style={styles.label}>Status</Text>
      {changed ? <Text style={styles.unsaved}>Unsaved changes</Text> : null}
    </View>
    <View style={styles.statusGrid}>
    {statusKeys.map(key => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: status === key }}
      onPress={() => { setStatus(key); setFeedback(''); }}
      style={({ pressed }) => [styles.statusOption, fontScale > 1.2 && styles.fullWidth,
        status === key && styles.selected, status === key && key === 'passed' && styles.passed,
        status === key && key === 'blocked' && styles.blocked, pressed && styles.pressed]}>
      <Ionicons name={statusAppearance[key].icon} size={26} color={statusAppearance[key].color} importantForAccessibility="no" />
      <Text style={[styles.label, styles.actionText]}>{readinessStatuses[key]}</Text>
    </Pressable>)}
    </View>
    <Text style={styles.label}>Evidence or reason</Text>
    <Text style={styles.body}>Use a test result and a redacted reference for this build.</Text>
    <TextInput accessibilityLabel="Evidence or reason" value={evidence} multiline maxLength={maxEvidenceLength}
      onChangeText={value => { setEvidence(value); setFeedback(''); }} placeholder="Example: build 12, test result, and a redacted reference"
      placeholderTextColor={colors.muted} style={[styles.input, styles.evidence, error && Boolean(feedback) && status !== 'pending' && !evidence.trim() && styles.invalidInput]} />
    {feedback ? <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.notice, error && styles.warning]}>{feedback}</Text> : null}
    <Action label="Save check" icon="save-outline" onPress={save} primary />
    <Text style={styles.footnote}>Saved results apply to this build.</Text>
  </View>;
}

function ReviewWorkspace({ project, initialReviews }: { project: Project; initialReviews: ReleaseReview[] }) {
  const { top, bottom } = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const store = projectReadinessStore(project.id);
  const [reviews, setReviews] = useState(initialReviews);
  const [build, setBuild] = useState('');
  const [review, setReview] = useState<ReleaseReview>();
  const [group, setGroup] = useState<Group>();
  const [check, setCheck] = useState<Check>();
  const [error, setError] = useState('');

  function scrollTop() { scroll.current?.scrollTo({ y: 0, animated: false }); }

  function openReview() {
    if (!build.trim()) { setError('Enter a build number or commit.'); return; }
    try {
      const opened = store.open(build);
      setReviews(current => current.some(item => item.build === opened.build) ? current : [...current, opened]);
      setReview(opened);
      setBuild('');
      setError('');
      Keyboard.dismiss();
      scrollTop();
    } catch {
      setError('Couldn’t open this release review. Try again.');
    }
  }

  function saveReview(saved: ReleaseReview) {
    setReview(saved);
    setReviews(current => current.map(item => item.build === saved.build ? saved : item));
  }

  const counts = review ? readinessCounts(group ? [group] : groups, review.items) : undefined;

  return <KeyboardAvoidingView behavior="height" style={[styles.screen, { paddingTop: top }]}>
  <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.header}>
        {group ? <Pressable accessibilityRole="button" onPress={() => {
          if (check) setCheck(undefined); else setGroup(undefined); scrollTop();
        }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" /><Text style={styles.backLabel}>{check ? 'Section' : 'Overview'}</Text>
        </Pressable> : <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" /><Text style={styles.backLabel}>Projects</Text>
          </Pressable>
        </Link>}
        <Text accessibilityRole="header" style={styles.headerTitle}>{check ? 'Readiness check' : 'Readiness'}</Text>
        <Link href={{ pathname: '/help', params: group ? { missionId: String(group.missionId) } : {} }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link>
      </View>
      <View style={styles.projectLabel}><Ionicons name="folder-outline" size={26} color={colors.success} importantForAccessibility="no" /><Text style={styles.projectName}>{project.name}</Text></View>
      {!group ? <>
        <Text accessibilityRole="header" style={styles.title}>Check before you ship.</Text>
        <Text style={styles.body}>Record evidence for this build.</Text>
      </> : null}
      {review ? group ? <View style={styles.buildPill}>
        <Ionicons name="cube-outline" size={24} color={colors.ink} importantForAccessibility="no" /><Text style={styles.label}>{review.build}</Text>
      </View> : <Pressable accessibilityRole="button" accessibilityLabel={`Switch release review, currently ${review.build}`}
        onPress={() => { setReview(undefined); scrollTop(); }} style={({ pressed }) => [styles.buildSelector, pressed && styles.pressed]}>
        <Ionicons name="cube-outline" size={27} color={colors.ink} importantForAccessibility="no" />
        <View style={styles.rowText}><Text style={styles.kicker}>RELEASE REVIEW</Text><Text style={styles.heading}>{review.build}</Text></View>
        <Ionicons name="chevron-down" size={23} color={colors.purple} importantForAccessibility="no" />
      </Pressable> : null}
      {counts && !check ? <View style={styles.countGrid}>
        {overviewStatuses.map(key => <View key={key} style={[styles.countCard, key === 'passed' && styles.passed, key === 'blocked' && styles.blocked]}>
          <Ionicons name={statusAppearance[key].icon} size={27} color={statusAppearance[key].color} importantForAccessibility="no" />
          <Text accessibilityLiveRegion="polite" style={[styles.countText, { color: statusAppearance[key].color }]}>{counts[key]} {readinessStatuses[key]}</Text>
        </View>)}
      </View> : null}
      {!review ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Open a release review</Text>
        <Text style={styles.body}>Choose a build or commit so every result refers to the same release.</Text>
        <Text style={styles.label}>Build number or commit</Text>
        <TextInput accessibilityLabel="Build number or commit" value={build} maxLength={maxBuildLength}
          onChangeText={value => { setBuild(value); setError(''); }} placeholder="Example: Android build 12"
          placeholderTextColor={colors.muted} style={styles.input} />
        <Action label="Open review" onPress={openReview} primary />
        {error ? <Text accessibilityRole="alert" style={[styles.notice, styles.warning]}>{error}</Text> : null}
        {reviews.length ? <Text accessibilityRole="header" style={styles.heading}>Saved reviews</Text> : null}
        {reviews.map(item => <Action key={item.build} label={item.build} icon="cube-outline" onPress={() => { setReview(item); scrollTop(); }} />)}
      </View> : group ? <>
        {check ? <CheckEditor key={check.id} project={project} review={review} group={group} check={check} onSave={saveReview} /> : <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>{group.title}</Text>
          {group.checks.map(item => <Pressable key={item.id} accessibilityRole="button"
            onPress={() => { setCheck(item); scrollTop(); }} style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
            <Ionicons name={statusAppearance[review.items[item.id]?.status ?? 'pending'].icon} size={25}
              color={statusAppearance[review.items[item.id]?.status ?? 'pending'].color} importantForAccessibility="no" />
            <View style={styles.rowText}><Text style={styles.label}>{item.title}</Text>
            <Text style={styles.body}>{readinessStatuses[review.items[item.id]?.status ?? 'pending']}</Text></View>
            <Ionicons name="chevron-forward" size={22} color={colors.purple} importantForAccessibility="no" />
          </Pressable>)}
          <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), missionId: String(group.missionId) } }} style={styles.link}>
            Open related build cards
          </Link>
          {group.sources.map(([label, url]) => <Link key={url} href={url} style={styles.link}>{label}</Link>)}
        </View>}
      </> : <>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>Read-only audit</Text>
          <Text style={styles.body}>Use the full prompt for an overview, or open a check for help with one item.</Text>
          <Prompt text={auditPrompt(project.name, review.build, groups)} title="audit prompt" primary />
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>Checklist sections</Text>
          <Text style={styles.body}>{groups.length} sections · {groups.reduce((total, item) => total + item.checks.length, 0)} checks</Text>
          {groups.map(item => {
            const summary = readinessCounts([item], review.items);
            return <Pressable key={item.id} accessibilityRole="button" onPress={() => { setGroup(item); scrollTop(); }}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
              <Ionicons name={item.id === 'auth' ? 'person-outline' : item.id === 'database' ? 'server-outline' : item.id === 'api' ? 'code-slash-outline' : 'list-outline'} size={26} color={colors.ink} importantForAccessibility="no" />
              <View style={styles.rowText}><Text style={styles.label}>{item.title}</Text>
              <Text style={styles.body}>{summary.pending} to check · {summary.blocked} blocked</Text></View>
              <Ionicons name="chevron-forward" size={22} color={colors.purple} importantForAccessibility="no" />
            </Pressable>;
          })}
        </View>
      </>}
    </View>
  </ScrollView>
  </KeyboardAvoidingView>;
}

export default function ReadinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const [state] = useState(() => {
    try {
      const project = projectStore.load().find(item => String(item.id) === id);
      return { project, reviews: project ? projectReadinessStore(project.id).load() : [], error: 'Project unavailable' };
    } catch {
      return { project: undefined, reviews: [], error: 'Couldn’t load saved release reviews.' };
    }
  });
  if (state.project) return <ReviewWorkspace project={state.project} initialReviews={state.reviews} />;
  return <View style={[styles.screen, styles.scroll, { paddingTop: top + 16 }]}>
    <Text accessibilityRole="header" style={styles.heading}>{state.error}</Text>
    <Link href="/project" dismissTo style={styles.link}>Open your projects</Link>
  </View>;
}

const clay = { boxShadow: [
  { offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true },
] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  help: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  projectLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectName: { flex: 1, color: colors.ink, fontSize: 21, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 24, flexShrink: 1 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  kicker: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  buildSelector: { ...clay, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.card },
  buildPill: { ...clay, maxWidth: '100%', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 22, backgroundColor: colors.card },
  rowText: { flex: 1, gap: 6 },
  countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  countCard: { ...clay, flexGrow: 1, flexBasis: '45%', minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 22, backgroundColor: colors.card },
  countText: { flex: 1, fontSize: 17, fontWeight: '800', lineHeight: 25 },
  passed: { backgroundColor: colors.mint },
  blocked: { backgroundColor: colors.blockedSurface },
  card: { ...clay, padding: 20, gap: 16, borderRadius: 28, backgroundColor: colors.card },
  field: { gap: 10 },
  action: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.controlLine, backgroundColor: colors.card },
  actionText: { flexShrink: 1 },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800' },
  previewAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewLabel: { color: colors.purple, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  statusHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unsaved: { color: colors.attention, fontSize: 13, fontWeight: '700', backgroundColor: colors.attentionSurface, padding: 8, borderRadius: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusOption: { ...clay, flexGrow: 1, flexBasis: '46%', minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: colors.controlLine, borderRadius: 20, backgroundColor: colors.card },
  fullWidth: { flexBasis: '100%' },
  selected: { backgroundColor: colors.background, borderColor: colors.purple, borderWidth: 2 },
  input: { minHeight: 54, padding: 14, borderColor: colors.controlLine, borderWidth: 1, borderRadius: 18, backgroundColor: colors.background, color: colors.ink, fontSize: 16, lineHeight: 24 },
  evidence: { minHeight: 130, textAlignVertical: 'top' },
  invalidInput: { borderColor: colors.attention, borderWidth: 2 },
  notice: { padding: 14, borderRadius: 18, backgroundColor: colors.background, color: colors.ink, fontSize: 16, lineHeight: 24 },
  warning: { backgroundColor: colors.attentionSurface },
  prompt: { padding: 14, borderRadius: 18, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 23 },
  checkRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.track, paddingVertical: 14 },
  link: { minHeight: 48, textAlignVertical: 'center', color: colors.purple, fontSize: 16, fontWeight: '800', lineHeight: 24 },
  footnote: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.8 },
});
