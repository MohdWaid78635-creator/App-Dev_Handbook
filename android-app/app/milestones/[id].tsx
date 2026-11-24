import { setStringAsync } from 'expo-clipboard';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { projectStore } from '../../src/projects/local';
import { planDecisions } from '../../src/projects/plan';
import { maxMilestoneNoteLength, projectMilestones, projectSummary } from '../../src/projects/store';
import type { MilestoneId, Project } from '../../src/projects/store';
import { colors } from '../../src/theme';

const cards = missions.flatMap(mission => mission.steps);

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
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
    <View style={styles.hero}>
      <Text accessibilityRole="header" style={styles.title}>{project.name}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.heroBody}>{recorded} of {projectMilestones.length} milestones recorded</Text>
    </View>
    {projectMilestones.map(({ id, title, prompt }) => {
      const saved = project.milestones?.[id] ?? '';
      const note = drafts[id] ?? saved;
      const changed = note.trim() !== saved;
      const expanded = open === id;
      return <View key={id} style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setOpen(expanded ? undefined : id)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.label}>{title}</Text>
          <Text style={styles.meta}>{changed ? 'Unsaved changes' : saved ? 'Evidence recorded' : 'Evidence needed'}</Text>
        </Pressable>
        {expanded ? <View style={styles.detail}>
          <Text style={styles.body}>{prompt}</Text>
          <TextInput accessibilityLabel={`${title} evidence`} value={note} multiline maxLength={maxMilestoneNoteLength}
            placeholder="Enter what you observed" placeholderTextColor={colors.muted} style={styles.input}
            onChangeText={value => { setDrafts(current => ({ ...current, [id]: value })); setFeedback(undefined); setExportStatus(''); }} />
          {changed ? <Action label={note.trim() ? 'Save evidence' : 'Clear saved evidence'} onPress={() => saveNote(id, note)} primary /> : null}
          {feedback?.id === id ? <Text accessibilityRole={feedback.error ? 'alert' : undefined}
            accessibilityLiveRegion="polite" style={styles.notice}>{feedback.message}</Text> : null}
          <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), missionId: String(id) } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.label}>Open this mission’s build cards</Text>
            </Pressable>
          </Link>
          {id === 11 ? <Link href={{ pathname: '/readiness/[id]', params: { id: String(project.id) } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.label}>Open Production Readiness</Text>
            </Pressable>
          </Link> : null}
        </View> : null}
      </View>;
    })}
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Export project summary</Text>
      <Text style={styles.body}>{dirty ? 'Save your milestone edits to include them in the export.' : 'Preview the saved plan, milestone notes, and recorded build proof before sharing.'}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: preview }}
        onPress={() => { setPreview(value => !value); setExportStatus(''); }}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Text style={styles.label}>{preview ? 'Hide summary' : 'Preview saved summary'}</Text>
      </Pressable>
      {preview ? <>
        {!dirty ? <>
          <Action label="Share summary" onPress={() => { void shareSummary(); }} primary />
          <Action label="Copy summary" onPress={() => { void copySummary(); }} />
        </> : null}
        {exportStatus ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{exportStatus}</Text> : null}
        <Text selectable style={styles.summary}>{summary}</Text>
      </> : null}
    </View>
  </>;
}

export default function MilestonesScreen() {
  const { id, milestoneId } = useLocalSearchParams<{ id: string; milestoneId?: string }>();
  const { bottom } = useSafeAreaInsets();
  const [state, setState] = useState<{ project?: Project; message: string }>({ message: 'Loading project…' });

  useFocusEffect(useCallback(() => {
    try {
      setState({ project: projectStore.load().find(item => String(item.id) === id), message: 'Project unavailable' });
    } catch {
      setState({ message: 'Couldn’t load saved projects' });
    }
  }, [id]));

  return <ScrollView keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      {state.project ? <MilestoneEditor key={state.project.id} project={state.project} initialMilestone={milestoneId}
        onSave={project => setState({ project, message: '' })} /> : <>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>{state.message}</Text>
        <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={styles.action}><Text style={styles.label}>Open your projects</Text></Pressable>
        </Link>
      </>}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { gap: 8, padding: 22, borderRadius: 24, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.mint, fontSize: 16, fontWeight: '800' },
  card: { padding: 12, gap: 10, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 18 },
  detail: { gap: 10, padding: 4 },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  action: { minHeight: 48, padding: 12, borderRadius: 12, justifyContent: 'center', gap: 4, backgroundColor: colors.lavender },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  input: { minHeight: 110, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, padding: 12, textAlignVertical: 'top', color: colors.ink, fontSize: 16 },
  notice: { padding: 12, borderRadius: 12, backgroundColor: colors.lavender, color: colors.ink, fontSize: 16 },
  summary: { padding: 12, borderRadius: 12, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 22 },
});
