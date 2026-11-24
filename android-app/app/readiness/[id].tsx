import { setStringAsync } from 'expo-clipboard';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import groups from '../../src/generated/readiness.json';
import { projectReadinessStore, projectStore } from '../../src/projects/local';
import { auditPrompt, checkPrompt, maxBuildLength, maxEvidenceLength, readinessCounts, readinessStatuses } from '../../src/projects/readiness';
import type { ReadinessStatus, ReleaseReview } from '../../src/projects/readiness';
import type { Project } from '../../src/projects/store';
import { colors } from '../../src/theme';

type Group = typeof groups[number];
type Check = Group['checks'][number];
const statusKeys = Object.keys(readinessStatuses) as ReadinessStatus[];

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

function Prompt({ text, title }: { text: string; title: string }) {
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
    <Action label={`Copy ${title}`} onPress={() => { void copy(); }} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: preview }} onPress={() => setPreview(value => !value)} style={styles.action}>
      <Text style={styles.label}>{preview ? `Hide ${title}` : `Preview ${title}`}</Text>
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
    <Text accessibilityRole="header" style={styles.heading}>{check.title}</Text>
    <Prompt text={checkPrompt(project.name, review.build, group, check)} title="check prompt" />
    <Text style={styles.label}>Status</Text>
    {statusKeys.map(key => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: status === key }}
      onPress={() => { setStatus(key); setFeedback(''); }} style={({ pressed }) => [styles.action, status === key && styles.selected, pressed && styles.pressed]}>
      <Text style={styles.label}>{readinessStatuses[key]}</Text>
    </Pressable>)}
    <Text style={styles.label}>Evidence or reason</Text>
    <TextInput accessibilityLabel="Evidence or reason" value={evidence} multiline maxLength={maxEvidenceLength}
      onChangeText={value => { setEvidence(value); setFeedback(''); }} placeholder="Example: build 12, test result, and a redacted reference"
      placeholderTextColor={colors.muted} style={[styles.input, styles.evidence]} />
    <Action label="Save check" onPress={save} primary />
    {feedback ? <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={styles.notice}>{feedback}</Text> : null}
  </View>;
}

function ReviewWorkspace({ project, initialReviews }: { project: Project; initialReviews: ReleaseReview[] }) {
  const { bottom } = useSafeAreaInsets();
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

  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>{project.name}</Text>
        <Text style={styles.heroBody}>{review ? `Reviewing ${review.build}` : 'Production readiness'}</Text>
        {counts ? <Text accessibilityLiveRegion="polite" style={styles.heroBody}>
          {counts.passed} passed · {counts.blocked} blocked · {counts.na} not applicable · {counts.pending} to check
        </Text> : null}
      </View>
      {!review ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Open a release review</Text>
        <Text style={styles.body}>Choose a build or commit so every result refers to the same release.</Text>
        <Text style={styles.label}>Build number or commit</Text>
        <TextInput accessibilityLabel="Build number or commit" value={build} maxLength={maxBuildLength}
          onChangeText={value => { setBuild(value); setError(''); }} placeholder="Example: Android build 12"
          placeholderTextColor={colors.muted} style={styles.input} />
        <Action label="Open review" onPress={openReview} primary />
        {error ? <Text accessibilityRole="alert" style={styles.notice}>{error}</Text> : null}
        {reviews.length ? <Text accessibilityRole="header" style={styles.heading}>Saved reviews</Text> : null}
        {reviews.map(item => <Action key={item.build} label={item.build} onPress={() => { setReview(item); scrollTop(); }} />)}
      </View> : group ? <>
        <Action label={check ? `Back to ${group.title}` : 'Back to readiness overview'} onPress={() => {
          if (check) setCheck(undefined);
          else setGroup(undefined);
          scrollTop();
        }} />
        {check ? <CheckEditor key={check.id} project={project} review={review} group={group} check={check} onSave={saveReview} /> : <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>{group.title}</Text>
          {group.checks.map(item => <Pressable key={item.id} accessibilityRole="button"
            onPress={() => { setCheck(item); scrollTop(); }} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.label}>{item.title}</Text>
            <Text style={styles.body}>{readinessStatuses[review.items[item.id]?.status ?? 'pending']}</Text>
          </Pressable>)}
          <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), missionId: String(group.missionId) } }} style={styles.link}>
            Open related build cards
          </Link>
          {group.sources.map(([label, url]) => <Link key={url} href={url} style={styles.link}>{label}</Link>)}
        </View>}
      </> : <>
        <Action label="Switch release review" onPress={() => { setReview(undefined); scrollTop(); }} />
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>Read-only audit</Text>
          <Text style={styles.body}>Use the full prompt for an overview, or open a check for help with one item.</Text>
          <Prompt text={auditPrompt(project.name, review.build, groups)} title="audit prompt" />
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>Checklist sections</Text>
          {groups.map(item => {
            const summary = readinessCounts([item], review.items);
            return <Pressable key={item.id} accessibilityRole="button" onPress={() => { setGroup(item); scrollTop(); }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.label}>{item.title}</Text>
              <Text style={styles.body}>{summary.pending} to check · {summary.blocked} blocked</Text>
            </Pressable>;
          })}
        </View>
      </>}
    </View>
  </ScrollView>;
}

export default function ReadinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state] = useState(() => {
    try {
      const project = projectStore.load().find(item => String(item.id) === id);
      return { project, reviews: project ? projectReadinessStore(project.id).load() : [], error: 'Project unavailable' };
    } catch {
      return { project: undefined, reviews: [], error: 'Couldn’t load saved release reviews.' };
    }
  });
  if (state.project) return <ReviewWorkspace project={state.project} initialReviews={state.reviews} />;
  return <View style={styles.screen}>
    <Text accessibilityRole="header" style={styles.heading}>{state.error}</Text>
    <Link href="/project" dismissTo style={styles.link}>Open your projects</Link>
  </View>;
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { padding: 20, borderRadius: 22, backgroundColor: colors.hero, gap: 8 },
  title: { color: colors.card, fontSize: 27, fontWeight: '900' },
  heroBody: { color: colors.mint, fontSize: 16, fontWeight: '700' },
  card: { padding: 15, gap: 10, borderColor: colors.line, borderWidth: 1, borderRadius: 18, backgroundColor: colors.card },
  field: { gap: 8 },
  heading: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  action: { minHeight: 48, padding: 12, gap: 4, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lavender },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  selected: { backgroundColor: colors.mint },
  input: { minHeight: 48, padding: 12, borderColor: colors.muted, borderWidth: 1, borderRadius: 12, color: colors.ink, fontSize: 16 },
  evidence: { minHeight: 96, textAlignVertical: 'top' },
  notice: { padding: 12, borderRadius: 12, backgroundColor: colors.lavender, color: colors.ink, fontSize: 16 },
  prompt: { padding: 12, borderRadius: 12, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 22 },
  link: { minHeight: 48, textAlignVertical: 'center', color: colors.purple, fontSize: 16, fontWeight: '800' },
});
