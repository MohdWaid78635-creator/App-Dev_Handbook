import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { projectStore } from '../src/projects/local';
import { projectFieldError, projectLimits } from '../src/projects/store';
import type { Project, ProjectBrief } from '../src/projects/store';
import { colors } from '../src/theme';

const fields = [
  { key: 'name', label: 'App name', placeholder: 'e.g. Pocket Budget' },
  { key: 'audience', label: 'Who is it for? (optional)', placeholder: 'e.g. Students on a tight budget' },
  { key: 'goal', label: 'What should it help them do? (optional)', placeholder: 'e.g. Log a purchase and see what’s left to spend this week' },
] as const;

function ProjectEditor({ project, onSaved, onCancel }: {
  project?: Project;
  onSaved: (projects: Project[]) => void;
  onCancel: () => void;
}) {
  const [brief, setBrief] = useState<ProjectBrief>(project ?? { name: '', audience: '', goal: '' });
  const [checkName, setCheckName] = useState(false);
  const [saveError, setSaveError] = useState('');
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);
  const saved = useRef(false);
  const nameError = checkName ? projectFieldError('name', brief.name) : '';

  function save() {
    if (saved.current) return;
    setCheckName(true);
    if (projectFieldError('name', brief.name)) {
      nameInput.current?.focus();
      return;
    }
    let projects: Project[];
    try {
      projects = projectStore.save(brief, project?.id);
    } catch {
      setSaveError('Couldn’t save this project. Your changes are still here. Try saving again.');
      return;
    }
    saved.current = true;
    Keyboard.dismiss();
    onSaved(projects);
  }

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>{project ? 'Edit project' : 'Create a project'}</Text>
      {fields.map(({ key, label, placeholder }) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            ref={key === 'name' ? nameInput : undefined}
            accessibilityLabel={label}
            value={brief[key]}
            onChangeText={value => setBrief(current => ({ ...current, [key]: value }))}
            onBlur={key === 'name' ? () => setCheckName(true) : undefined}
            maxLength={projectLimits[key]}
            multiline={key === 'goal'}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            style={[styles.input, key === 'goal' && styles.multiline]}
          />
          {key === 'name' && nameError ? (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>{nameError}</Text>
          ) : null}
        </View>
      ))}
      {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
      <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
        <Text style={styles.actionLabel}>{project ? 'Save changes' : 'Save project'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryLabel}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function readProjects(): Project[] | null {
  try {
    return projectStore.load();
  } catch {
    return null;
  }
}

export default function ProjectScreen() {
  const { missionId, milestoneId } = useLocalSearchParams<{ missionId?: string; milestoneId?: string }>();
  const { bottom } = useSafeAreaInsets();
  const [projects, setProjects] = useState(readProjects);
  const [editor, setEditor] = useState<{ project?: Project } | null>(null);
  const [status, setStatus] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  function showEditor(project?: Project) {
    setStatus('');
    setEditor({ project });
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>Your projects</Text>
          <Text style={styles.heroBody}>{milestoneId !== undefined ? 'Choose a project to record milestone evidence.'
            : missionId !== undefined ? 'Choose a project for this mission’s build cards.'
            : 'Save your app idea and what its first version should help people do.'}</Text>
        </View>
        {editor ? (
          <ProjectEditor project={editor.project} onCancel={() => setEditor(null)} onSaved={saved => {
            setProjects(saved);
            setEditor(null);
            setStatus(editor.project ? 'Changes saved on this device.' : 'Project saved on this device.');
            scroll.current?.scrollTo({ y: 0, animated: false });
          }} />
        ) : projects === null ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.notice}>Couldn’t load your saved projects.</Text>
            <Pressable accessibilityRole="button" onPress={() => setProjects(readProjects())}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
              <Text style={styles.actionLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {status ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => showEditor()}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
              <Text style={styles.actionLabel}>New project</Text>
            </Pressable>
            {projects.map(project => (
              <View key={project.id} style={styles.card}>
                <Text accessibilityRole="header" style={styles.heading}>{project.name}</Text>
                {project.audience ? <Text style={styles.body}>{project.audience}</Text> : null}
                {project.goal ? <Text numberOfLines={3} style={styles.body}>{project.goal}</Text> : null}
                <Link href={{ pathname: '/plan/[id]', params: { id: String(project.id) } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Open Plan Mode for ${project.name}`}
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                    <Text style={styles.actionLabel}>Open Plan Mode</Text>
                  </Pressable>
                </Link>
                <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), ...(missionId !== undefined ? { missionId } : {}) } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Open Build Workspace for ${project.name}`}
                    style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                    <Text style={styles.secondaryLabel}>Open Build Workspace</Text>
                  </Pressable>
                </Link>
                <Link href={{ pathname: '/milestones/[id]', params: { id: String(project.id), ...(milestoneId !== undefined ? { milestoneId } : {}) } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Open Project Milestones for ${project.name}`}
                    style={({ pressed }) => [milestoneId !== undefined ? styles.action : styles.secondary, pressed && styles.pressed]}>
                    <Text style={milestoneId !== undefined ? styles.actionLabel : styles.secondaryLabel}>Project Milestones</Text>
                  </Pressable>
                </Link>
                <Link href={{ pathname: '/readiness/[id]', params: { id: String(project.id) } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Open Production Readiness for ${project.name}`}
                    style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                    <Text style={styles.secondaryLabel}>Production Readiness</Text>
                  </Pressable>
                </Link>
                <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${project.name}`}
                  onPress={() => showEditor(project)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                  <Text style={styles.secondaryLabel}>Edit project</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { backgroundColor: colors.hero, padding: 22, borderRadius: 24, gap: 8 },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  card: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  heading: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  field: { gap: 6 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, minHeight: 48, padding: 12, color: colors.ink, fontSize: 16 },
  multiline: { minHeight: 94, textAlignVertical: 'top' },
  notice: { backgroundColor: colors.lavender, color: colors.ink, padding: 12, borderRadius: 12, fontSize: 16 },
  action: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.purple },
  actionPressed: { backgroundColor: colors.hero },
  actionLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  secondary: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  secondaryLabel: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  pressed: { backgroundColor: colors.lavender },
});
