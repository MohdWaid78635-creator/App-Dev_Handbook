import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { BackHandler, Image, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { projectStore } from '../src/projects/local';
import { projectFieldError, projectLimits } from '../src/projects/store';
import type { Project, ProjectBrief } from '../src/projects/store';
import { homeColors as c } from '../src/theme';
import { WorkshopNavigation } from '../src/components/WorkshopNavigation';
import { TechnologyIcon } from '../src/components/TechnologyIcon';

const fields = [
  { key: 'name', label: 'App name', placeholder: 'e.g. Pocket Budget' },
  { key: 'audience', label: 'Who is it for?', placeholder: 'e.g. Students on a tight budget' },
  { key: 'goal', label: 'What should it help them do?', placeholder: 'e.g. Log a purchase and see what’s left to spend this week' },
] as const;

function ProjectEditor({ project, onSaved, onCancel }: {
  project?: Project; onSaved: (projects: Project[]) => void; onCancel: () => void;
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
    if (projectFieldError('name', brief.name)) { nameInput.current?.focus(); return; }
    let projects: Project[];
    try { projects = projectStore.save(brief, project?.id); }
    catch { setSaveError('Couldn’t save this project. Your changes are still here. Try saving again.'); return; }
    saved.current = true;
    Keyboard.dismiss();
    onSaved(projects);
  }

  return <>
    <Text accessibilityRole="header" style={s.title}>{project ? 'Shape your idea.' : 'Give your idea a home.'}</Text>
    <Text style={s.body}>Start with a name. Add the details you know.</Text>
    <View style={s.card}>
      {fields.map(({ key, label, placeholder }) => (
        <View key={key} style={s.field}>
          <View style={s.fieldHeading}>
            <Text style={s.fieldLabel}>{label}</Text>
            <Text style={s.meta}>{key === 'name' ? 'Required' : 'Optional'}</Text>
          </View>
          <TextInput ref={key === 'name' ? nameInput : undefined}
            accessibilityLabel={`${label}, ${key === 'name' ? 'required' : 'optional'}`}
            value={brief[key]} onChangeText={value => setBrief(current => ({ ...current, [key]: value }))}
            onBlur={key === 'name' ? () => setCheckName(true) : undefined} maxLength={projectLimits[key]}
            multiline={key === 'goal'} placeholder={placeholder} placeholderTextColor={c.muted}
            style={[s.input, key === 'goal' && s.multiline, key === 'name' && Boolean(nameError) && s.invalidInput]} />
          {key === 'name' && nameError ? <Text accessibilityLiveRegion="polite" style={s.error}>{nameError}</Text> : null}
        </View>
      ))}
      <View style={s.tip}>
        <Ionicons name="bulb-outline" size={25} color={c.success} importantForAccessibility="no" />
        <Text style={s.tipText}>You can change these details later.</Text>
      </View>
    </View>
    <View style={s.deviceNotice}>
      <Ionicons name="phone-portrait-outline" size={22} color={c.muted} importantForAccessibility="no" />
      <Text style={s.meta}>Projects are saved on this device.</Text>
    </View>
    {saveError ? <Text accessibilityRole="alert" style={s.error}>{saveError}</Text> : null}
    <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [s.action, pressed && s.pressed]}>
      <Ionicons name="checkmark" size={24} color={c.white} importantForAccessibility="no" />
      <Text style={s.actionLabel}>{project ? 'Save changes' : 'Save project'}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [s.cancel, pressed && s.pressed]}>
      <Text style={s.cancelLabel}>Cancel</Text>
    </Pressable>
  </>;
}

function ProjectCard({ project, initiallyOpen, missionId, milestoneId, onEdit }: {
  project: Project; initiallyOpen: boolean; missionId?: string; milestoneId?: string; onEdit: () => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const platform = project.plan?.target;
  return <View style={s.card}>
    <View style={s.projectHeader}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${project.name}, project tools`}
        onPress={() => setOpen(value => !value)} style={({ pressed }) => [s.projectToggle, pressed && s.pressed]}>
        <View style={s.projectIcon}>
          {platform && platform !== 'undecided' ? <TechnologyIcon field="target" value={platform} size={29} />
            : <Ionicons name="folder-outline" size={29} color={c.ink} importantForAccessibility="no" />}
        </View>
        <Text style={s.projectName}>{project.name}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={c.purple} importantForAccessibility="no" />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${project.name}`} onPress={onEdit}
        style={({ pressed }) => [s.edit, pressed && s.pressed]}>
        <Ionicons name="pencil-outline" size={20} color={c.ink} importantForAccessibility="no" /><Text style={s.editLabel}>Edit</Text>
      </Pressable>
    </View>
    {open ? <>
      {project.audience ? <Text style={s.body}>{project.audience}</Text> : null}
      {project.goal ? <Text style={s.body}>{project.goal}</Text> : null}
      <Link href={{ pathname: '/plan/[id]', params: { id: String(project.id) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open Plan Mode for ${project.name}`}
          style={({ pressed }) => [s.action, pressed && s.pressed]}>
          <Ionicons name="map-outline" size={23} color={c.white} importantForAccessibility="no" />
          <Text style={s.actionLabel}>Open Plan Mode</Text>
          <Ionicons name="arrow-forward" size={22} color={c.white} importantForAccessibility="no" />
        </Pressable>
      </Link>
      <Link href={{ pathname: '/build/[id]', params: { id: String(project.id), ...(missionId !== undefined ? { missionId } : {}) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open Build Workspace for ${project.name}`} style={({ pressed }) => [s.tool, pressed && s.pressed]}>
          <Ionicons name="construct-outline" size={25} color={c.ink} importantForAccessibility="no" />
          <Text style={s.toolLabel}>Build Workspace</Text><Ionicons name="chevron-forward" size={22} color={c.muted} importantForAccessibility="no" />
        </Pressable>
      </Link>
      <Link href={{ pathname: '/milestones/[id]', params: { id: String(project.id), ...(milestoneId !== undefined ? { milestoneId } : {}) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open Project Milestones for ${project.name}`}
          style={({ pressed }) => [s.tool, milestoneId !== undefined && s.milestoneTarget, pressed && s.pressed]}>
          <Ionicons name="flag-outline" size={25} color={c.ink} importantForAccessibility="no" />
          <Text style={s.toolLabel}>Project Milestones</Text><Ionicons name="chevron-forward" size={22} color={c.muted} importantForAccessibility="no" />
        </Pressable>
      </Link>
      <Link href={{ pathname: '/readiness/[id]', params: { id: String(project.id) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Open Production Readiness for ${project.name}`} style={({ pressed }) => [s.tool, pressed && s.pressed]}>
          <Ionicons name="shield-checkmark-outline" size={25} color={c.ink} importantForAccessibility="no" />
          <Text style={s.toolLabel}>Production Readiness</Text><Ionicons name="chevron-forward" size={22} color={c.muted} importantForAccessibility="no" />
        </Pressable>
      </Link>
    </> : project.goal ? <Text numberOfLines={2} style={s.meta}>{project.goal}</Text> : null}
  </View>;
}

function readProjects(): Project[] | null {
  try { return projectStore.load(); } catch { return null; }
}

export default function ProjectScreen() {
  const { missionId, milestoneId } = useLocalSearchParams<{ missionId?: string; milestoneId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const [projects, setProjects] = useState(readProjects);
  const [editor, setEditor] = useState<{ project?: Project } | null>(null);
  const [status, setStatus] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const globalList = !editor && missionId === undefined && milestoneId === undefined;
  const returnRoute = milestoneId !== undefined ? { pathname: '/result/[id]' as const, params: { id: milestoneId } }
    : missionId !== undefined ? { pathname: '/mission/[id]' as const, params: { id: missionId } } : '/';

  function cancelEditor() { Keyboard.dismiss(); setEditor(null); }
  useFocusEffect(useCallback(() => {
    if (!editor) { setProjects(readProjects()); return; }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss(); setEditor(null); return true;
    });
    return () => subscription.remove();
  }, [editor]));

  function showEditor(project?: Project) {
    setStatus(''); setEditor({ project });
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  return <KeyboardAvoidingView behavior="height" style={[s.screen, { paddingTop: top }]}>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.scroll, { paddingBottom: globalList ? 20 : Math.max(bottom, 20) }]}>
      <View style={s.column}>
        <View style={s.header}>
          {editor ? <Pressable accessibilityRole="button" onPress={cancelEditor} style={({ pressed }) => [s.back, pressed && s.pressed]}>
            <Ionicons name="arrow-back" size={25} color={c.ink} importantForAccessibility="no" /><Text style={s.backLabel}>Projects</Text>
          </Pressable> : globalList ? <View style={s.brand}>
            <Image source={require('../assets/clay-mark.png')} style={s.logo} accessible={false} /><Text style={s.wordmark}>BuildWisp</Text>
          </View> : <Link href={returnRoute} dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [s.back, pressed && s.pressed]}>
              <Ionicons name="arrow-back" size={25} color={c.ink} importantForAccessibility="no" />
              <Text style={s.backLabel}>{milestoneId !== undefined ? 'Results' : 'Lesson'}</Text>
            </Pressable>
          </Link>}
          {editor || !globalList ? <Text accessibilityRole="header" style={s.headerTitle}>{editor ? editor.project ? 'Edit project' : 'New project' : 'Choose project'}</Text> : null}
          <Link href="/help" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [s.help, pressed && s.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={c.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        {editor ? <ProjectEditor project={editor.project} onCancel={cancelEditor} onSaved={savedProjects => {
          setProjects(savedProjects); setEditor(null);
          setStatus(editor.project ? 'Changes saved on this device.' : 'Project saved on this device.');
          scroll.current?.scrollTo({ y: 0, animated: false });
        }} /> : <>
          <Text accessibilityRole="header" style={s.title}>Your ideas, taking shape.</Text>
          <Text style={s.body}>{milestoneId !== undefined ? 'Choose a project to record milestone evidence.'
            : missionId !== undefined ? 'Choose a project for this mission’s build cards.' : 'Save your app idea and build its first version.'}</Text>
          {projects === null ? <View style={s.card}>
            <Text accessibilityRole="alert" style={s.error}>Couldn’t load your saved projects.</Text>
            <Pressable accessibilityRole="button" onPress={() => setProjects(readProjects())} style={({ pressed }) => [s.action, pressed && s.pressed]}>
              <Text style={s.actionLabel}>Try again</Text>
            </Pressable>
          </View> : <>
            {status ? <Text accessibilityLiveRegion="polite" style={s.success}>{status}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => showEditor()} style={({ pressed }) => [s.action, pressed && s.pressed]}>
              <Ionicons name="add" size={25} color={c.white} importantForAccessibility="no" /><Text style={s.actionLabel}>New project</Text>
            </Pressable>
            <View style={s.deviceNotice}>
              <Ionicons name="phone-portrait-outline" size={22} color={c.muted} importantForAccessibility="no" /><Text style={s.meta}>Saved on this device</Text>
            </View>
            {projects.length === 0 ? <View style={s.card}><Text style={s.heading}>Your first project starts here.</Text><Text style={s.body}>Tap New project to save an app idea.</Text></View> : null}
            {projects.map((project, index) => <ProjectCard key={project.id} project={project} initiallyOpen={index === 0}
              missionId={missionId} milestoneId={milestoneId} onEdit={() => showEditor(project)} />)}
          </>}
        </>}
      </View>
    </ScrollView>
    {globalList ? <WorkshopNavigation selected="Projects" /> : null}
  </KeyboardAvoidingView>;
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 52, height: 60, resizeMode: 'contain' },
  wordmark: { color: c.ink, fontSize: 25, fontWeight: '900', flexShrink: 1, letterSpacing: -1 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: c.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, color: c.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  title: { color: c.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  heading: { color: c.ink, fontSize: 21, fontWeight: '800' },
  body: { color: c.muted, fontSize: 16, lineHeight: 24 },
  meta: { color: c.muted, fontSize: 14, lineHeight: 21 },
  card: { ...clay, padding: 18, gap: 16, backgroundColor: c.card, borderRadius: 26 },
  projectHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  projectToggle: { flex: 1, flexBasis: 180, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  projectName: { flex: 1, color: c.ink, fontSize: 21, fontWeight: '800' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48, paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.background },
  editLabel: { color: c.ink, fontSize: 15, fontWeight: '700' },
  action: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 24, backgroundColor: c.purple },
  actionLabel: { color: c.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  tool: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.track },
  toolLabel: { flex: 1, color: c.ink, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  milestoneTarget: { backgroundColor: c.mint, borderRadius: 16, paddingHorizontal: 10 },
  field: { gap: 8 },
  fieldHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fieldLabel: { color: c.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  input: { color: c.ink, backgroundColor: c.background, borderWidth: 1, borderColor: c.controlLine, borderRadius: 18, minHeight: 54, padding: 14, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  invalidInput: { borderColor: c.attention, borderWidth: 2 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { flex: 1, color: c.muted, fontSize: 14, lineHeight: 21 },
  deviceNotice: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },
  cancelLabel: { color: c.muted, fontSize: 17, fontWeight: '700' },
  error: { backgroundColor: c.attentionSurface, color: c.ink, fontSize: 16, lineHeight: 24, padding: 14, borderRadius: 18 },
  success: { backgroundColor: c.mint, color: c.ink, fontSize: 16, lineHeight: 24, padding: 14, borderRadius: 18 },
  pressed: { opacity: 0.75 },
});
