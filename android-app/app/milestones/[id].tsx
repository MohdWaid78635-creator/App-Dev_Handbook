import Ionicons from '@expo/vector-icons/Ionicons';
import { setStringAsync } from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Link } from '../../src/components/Link';
import { useCallback, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { projectStore } from '../../src/projects/local';
import { planDecisions } from '../../src/projects/plan';
import { maxMilestoneNoteLength, projectMilestones, projectSummary } from '../../src/projects/store';
import type { MilestoneId, Project } from '../../src/projects/store';
import { homeColors as colors } from '../../src/theme';

const cards = missions.flatMap(mission => mission.steps);

function Action({ label, onPress, primary = false, icon }: {
  label: string; onPress: () => void; primary?: boolean; icon?: 'save-outline' | 'trash-outline' | 'share-outline' | 'copy-outline';
}) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    {icon ? <Ionicons name={icon} size={23} color={primary ? colors.white : colors.purple} importantForAccessibility="no" /> : null}
    <Text style={[styles.actionText, primary ? styles.primaryLabel : styles.label]}>{label}</Text>
  </Pressable>;
}

function MilestoneEditor({ project, initialMilestone, onSave }: {
  project: Project;
  initialMilestone?: string;
  onSave: (project: Project) => void;
}) {
  const [open, setOpen] = useState<MilestoneId | undefined>(() =>
    projectMilestones.find(item => String(item.id) === initialMilestone)?.id ??
    projectMilestones.find(item => !project.milestones?.[item.id])?.id);
  const [drafts, setDrafts] = useState<Partial<Record<MilestoneId, string>>>({});
  const [feedback, setFeedback] = useState<{ id: MilestoneId; message: string; error?: boolean }>();
  const [preview, setPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const recorded = projectMilestones.filter(item => project.milestones?.[item.id]).length;
  const dirty = projectMilestones.some(({ id }) => drafts[id] !== undefined && drafts[id].trim() !== (project.milestones?.[id] ?? ''));
  const summary = preview ? projectSummary(project, cards, planDecisions(project.plan ?? {})) : '';

  function saveNote(id: MilestoneId, note: string) {
    try {
      const updated = projectStore.saveMilestone(project.id, id, note);
      onSave(updated);
      setDrafts(current => ({ ...current, [id]: undefined }));
      setFeedback({ id, message: updated.milestones?.[id] ? 'Evidence saved on this device.' : 'Evidence cleared.' });
      Keyboard.dismiss();
    } catch {
      setFeedback({ id, error: true, message: 'Couldn’t save. Your edit is still here. Try saving again.' });
    }
  }

  async function copySummary() {
    try {
      if (await setStringAsync(summary, { android: { isSensitive: true } })) {
        setExportStatus('Project summary copied.');
        return;
      }
    } catch {
      // The preview text is selectable if the clipboard is unavailable.
    }
    setExportStatus('Couldn’t copy. Select the summary text to copy it.');
  }

  async function shareSummary() {
    setExportStatus('');
    try {
      await Share.share({ message: summary }, { dialogTitle: 'Share project summary' });
    } catch {
      setExportStatus('Couldn’t open sharing. You can copy the summary instead.');
    }
  }

  return <>
    <View style={styles.projectLabel}>
      <Ionicons name="folder-outline" size={26} color={colors.success} importantForAccessibility="no" />
      <Text style={styles.projectName}>{project.name}</Text>
    </View>
    <Text accessibilityRole="header" style={styles.title}>Record what you’ve built.</Text>
    <Text style={styles.subtitle}>Keep evidence for the moments that matter.</Text>
    <Text accessibilityLiveRegion="polite" style={styles.progressLabel}>{recorded} of {projectMilestones.length} milestones recorded</Text>
    <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Milestones with saved evidence"
      accessibilityValue={{ min: 0, max: projectMilestones.length, now: recorded }}>
      <View style={[styles.fill, { width: `${recorded / projectMilestones.length * 100}%` }]} />
    </View>
    {projectMilestones.map(({ id, title, prompt }, index) => {
      const saved = project.milestones?.[id] ?? '';
      const note = drafts[id] ?? saved;
      const changed = note.trim() !== saved;
      const expanded = open === id;
      return <View key={id} style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setOpen(expanded ? undefined : id)} style={({ pressed }) => [styles.cardHeading, pressed && styles.pressed]}>
          <View style={[styles.marker, saved && !changed && styles.savedMarker]} importantForAccessibility="no-hide-descendants">
            {saved && !changed ? <Ionicons name="checkmark" size={23} color={colors.white} /> : <Text style={styles.markerText}>{String(index + 1).padStart(2, '0')}</Text>}
          </View>
          <View style={styles.cardIdentity}>
            <Text style={styles.label}>{title}</Text>
            <Text style={[styles.meta, changed && styles.unsaved]}>{changed ? 'Unsaved changes' : saved ? 'Evidence recorded' : 'Evidence needed'}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
        {expanded ? <View style={styles.detail}>
          <Text style={styles.body}>{prompt}</Text>
          <Text style={styles.label}>Your evidence</Text>
          <TextInput accessibilityLabel={`${title} evidence`} value={note} multiline maxLength={maxMilestoneNoteLength}
            placeholder="Enter what you observed" placeholderTextColor={colors.muted} style={styles.input}
            onChangeText={value => { setDrafts(current => ({ ...current, [id]: value })); setFeedback(undefined); setExportStatus(''); }} />
          {changed ? <Action label={note.trim() ? 'Save evidence' : 'Clear saved evidence'} icon={note.trim() ? 'save-outline' : 'trash-outline'} onPress={() => saveNote(id, note)} primary /> : null}
          {feedback?.id === id ? <Text accessibilityRole={feedback.error ? 'alert' : undefined}
            accessibilityLiveRegion="polite" style={[styles.notice, feedback.error && styles.warning]}>{feedback.message}</Text> : null}
          <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), missionId: String(id) } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.toolLink, pressed && styles.pressed]}>
              <Ionicons name="construct-outline" size={25} color={colors.purple} importantForAccessibility="no" />
              <Text style={styles.toolLabel}>Open this mission’s build cards</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.purple} importantForAccessibility="no" />
            </Pressable>
          </Link>
          {id === 11 ? <Link href={{ pathname: '/readiness/[id]', params: { id: String(project.id) } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.toolLink, pressed && styles.pressed]}>
              <Ionicons name="shield-checkmark-outline" size={25} color={colors.purple} importantForAccessibility="no" />
              <Text style={styles.toolLabel}>Open Production Readiness</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.purple} importantForAccessibility="no" />
            </Pressable>
          </Link> : null}
        </View> : null}
      </View>;
    })}
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Export project summary</Text>
      <Text style={styles.body}>Preview the saved plan, milestone notes, and recorded build proof before sharing.</Text>
      {dirty ? <View style={styles.warningRow}>
        <Ionicons name="warning-outline" size={24} color={colors.attention} importantForAccessibility="no" />
        <Text style={styles.warningText}>Save your milestone edits before sharing.</Text>
      </View> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: preview }}
        onPress={() => { setPreview(value => !value); setExportStatus(''); }}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Ionicons name="eye-outline" size={23} color={colors.purple} importantForAccessibility="no" />
        <Text style={styles.actionText}>{preview ? 'Hide summary' : 'Preview saved summary'}</Text>
      </Pressable>
      {preview ? <>
        {!dirty ? <>
          <Action label="Share summary" icon="share-outline" onPress={() => { void shareSummary(); }} primary />
          <Action label="Copy summary" icon="copy-outline" onPress={() => { void copySummary(); }} />
        </> : null}
        {exportStatus ? <Text accessibilityLiveRegion="polite" style={[styles.notice, styles.exportNotice]}>{exportStatus}</Text> : null}
        <Text selectable style={styles.summary}>{summary}</Text>
      </> : null}
    </View>
  </>;
}

export default function MilestonesScreen() {
  const { id, milestoneId } = useLocalSearchParams<{ id: string; milestoneId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const [state, setState] = useState<{ project?: Project; message: string }>({ message: 'Loading project…' });

  useFocusEffect(useCallback(() => {
    try {
      setState({ project: projectStore.load().find(item => String(item.id) === id), message: 'Project unavailable' });
    } catch {
      setState({ message: 'Couldn’t load saved projects' });
    }
  }, [id]));

  return <KeyboardAvoidingView behavior="height" style={[styles.screen, { paddingTop: top }]}>
  <ScrollView keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.header}>
        <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" /><Text style={styles.backLabel}>Projects</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.headerTitle}>Milestones</Text>
        <Link href="/help" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link>
      </View>
      {state.project ? <MilestoneEditor key={state.project.id} project={state.project} initialMilestone={milestoneId}
        onSave={project => setState({ project, message: '' })} /> : <>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>{state.message}</Text>
        <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={styles.action}><Text style={styles.label}>Open your projects</Text></Pressable>
        </Link>
      </>}
    </View>
  </ScrollView>
  </KeyboardAvoidingView>;
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  projectLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectName: { flex: 1, color: colors.ink, fontSize: 21, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  progressLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  track: { height: 12, borderRadius: 8, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colors.purple },
  card: { ...clay, padding: 16, gap: 16, backgroundColor: colors.card, borderRadius: 26 },
  cardHeading: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  marker: { width: 36, minHeight: 36, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  savedMarker: { backgroundColor: colors.success },
  cardIdentity: { flex: 1, gap: 6 },
  unsaved: { alignSelf: 'flex-start', color: colors.attention, backgroundColor: colors.attentionSurface, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  detail: { gap: 14 },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 25 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  action: { ...clay, minHeight: 54, padding: 14, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.controlLine },
  actionText: { color: colors.purple, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  input: { minHeight: 120, borderWidth: 1, borderColor: colors.controlLine, backgroundColor: colors.background, borderRadius: 18, padding: 14, textAlignVertical: 'top', color: colors.ink, fontSize: 16, lineHeight: 24 },
  toolLink: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.track },
  toolLabel: { flex: 1, color: colors.purple, fontSize: 16, fontWeight: '800', lineHeight: 24 },
  notice: { padding: 14, borderRadius: 18, backgroundColor: colors.mint, color: colors.ink, fontSize: 16, lineHeight: 24 },
  exportNotice: { backgroundColor: colors.background },
  warning: { backgroundColor: colors.attentionSurface },
  warningRow: { padding: 14, borderRadius: 18, backgroundColor: colors.attentionSurface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  warningText: { flex: 1, color: colors.attention, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  summary: { padding: 14, borderRadius: 18, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 23 },
});
