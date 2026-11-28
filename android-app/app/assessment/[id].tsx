import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from '../../src/components/Link';
import { TechnologyIcon } from '../../src/components/TechnologyIcon';
import { projectStore } from '../../src/projects/local';
import type { Project } from '../../src/projects/store';
import { planSections } from '../../src/projects/plan';
import { appGoals, appStages, canSkipCapability, capabilityLabels, newAssessment, recommendProject } from '../../src/projects/assessment';
import type { Assessment, Capability, CheckAnswer } from '../../src/projects/assessment';
import { homeColors as c } from '../../src/theme';

const stackOptions = planSections.flatMap(section => section.fields).find(field => field.key === 'stack')!.options!;
const accountOptions = { private: 'Yes, data belongs to signed-in users', local: 'No, local or public data only', unknown: 'I’m not sure' } as const;
const answerLabels: Record<CheckAnswer, string> = { yes: 'Works & checked', no: 'Needs work', unsure: 'Not sure', na: 'Not needed' };

function Choices({ label, options, value, onChange, stack = false, compact = false }: {
  label: string; options: readonly (readonly [string, string])[]; value: string; onChange(value: string): void; stack?: boolean; compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = options.length > 5;
  return <View style={s.field}>
    <Text accessibilityRole="header" style={s.label}>{label}</Text>
    {collapsible ? <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${options.find(([id]) => id === value)?.[1] ?? 'Choose an option'}`}
      accessibilityState={{ expanded }} onPress={() => setExpanded(previous => !previous)} style={({ pressed }) => [s.choice, pressed && s.pressed]}>
      {stack ? <TechnologyIcon field="stack" value={value} /> : null}
      <Text style={s.choiceLabel}>{options.find(([id]) => id === value)?.[1] ?? 'Choose an option'}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={23} color={c.purple} importantForAccessibility="no" />
    </Pressable> : null}
    {!collapsible || expanded ? <View accessibilityRole="radiogroup" accessibilityLabel={label} style={compact ? s.answers : s.options}>
      {options.map(([id, title]) => <Pressable key={id} accessibilityRole="radio" accessibilityLabel={`${label}: ${title}`}
        accessibilityState={{ checked: id === value }} onPress={() => { onChange(id); setExpanded(false); }}
        style={({ pressed }) => [s.choice, compact && s.answer, id === value && s.selected, pressed && s.pressed]}>
        <Ionicons name={id === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={c.purple} importantForAccessibility="no" />
        {stack ? <TechnologyIcon field="stack" value={id} /> : null}<Text style={s.choiceLabel}>{title}</Text>
      </Pressable>)}
    </View> : null}
  </View>;
}

function Editor({ project, onSaved }: { project: Project; onSaved(project: Project): void }) {
  const { top, bottom } = useSafeAreaInsets();
  const [assessment, setAssessment] = useState<Assessment>(() => project.assessment ?? newAssessment());
  const [stack, setStack] = useState(project.plan?.stack ?? 'undecided');
  const [step, setStep] = useState<1 | 2 | 3>(project.assessment ? 3 : 1);
  const [error, setError] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const guidance = recommendProject({ ...project, assessment, plan: { ...project.plan, stack } })!;

  function move(next: 1 | 2 | 3) { setError(''); setStep(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  useFocusEffect(useCallback(() => {
    if (step !== 2) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { move(1); return true; });
    return () => subscription.remove();
  }, [step]));

  function save() {
    setError('');
    try {
      const saved = projectStore.saveAssessment(project.id, assessment, { stack });
      onSaved(saved); move(3);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save the assessment. Your previous answers are unchanged.'); }
  }
  const update = <K extends keyof Assessment>(key: K, value: Assessment[K]) => setAssessment(previous => ({ ...previous, [key]: value }));

  return <ScrollView ref={scroll} style={[s.screen, { paddingTop: top }]} contentContainerStyle={[s.content, { paddingBottom: Math.max(bottom, 24) }]}>
    <View style={s.column}>
      {step === 2 ? <Pressable accessibilityRole="button" onPress={() => move(1)} style={s.back}><Text style={s.link}>← Back</Text></Pressable>
        : <Link href="/project" style={s.back}><Text style={s.link}>← Your projects</Text></Link>}
      <Text style={s.eyebrow}>{step === 3 ? 'BASED ON YOUR ANSWERS' : `STEP ${step} OF 2`}</Text>
      <Text accessibilityRole="header" style={s.title}>{step === 1 ? 'Tell us about your app.' : step === 2 ? 'What have you checked?' : 'Your next move.'}</Text>
      <Text style={s.body}>{project.name}{step === 3 ? ` · ${guidance.stage}` : ''}</Text>
      {step === 1 ? <>
        <Text style={s.body}>We’ll use these details to suggest useful guidance. Your code is not scanned.</Text>
        <Choices label="What do you have today?" options={Object.entries(appStages)} value={assessment.stage} onChange={value => update('stage', value as Assessment['stage'])} />
        <Choices label="What do you need right now?" options={Object.entries(appGoals)} value={assessment.goal} onChange={value => update('goal', value as Assessment['goal'])} />
        <Choices label="What is it built with?" options={stackOptions.map(([id, label]) => [id, label] as const)} value={stack} onChange={setStack} stack />
        <Text style={s.meta}>Uses your saved Plan Mode choice. Changing it here updates that choice when you save.</Text>
        <Choices label="Does it have private cloud data?" options={Object.entries(accountOptions)} value={assessment.accounts} onChange={value => update('accounts', value as Assessment['accounts'])} />
        <Pressable accessibilityRole="button" onPress={() => move(2)} style={({ pressed }) => [s.primary, pressed && s.pressed]}><Text style={s.primaryLabel}>Continue →</Text></Pressable>
      </> : step === 2 ? <>
        <Text style={s.body}>“Not sure” is useful. We’ll suggest a way to verify it. Answers are saved when you tap Find my next move.</Text>
        {(Object.entries(capabilityLabels) as [Capability, string][]).filter(([key]) => key !== 'access' || assessment.accounts !== 'local').map(([key, label]) =>
          <View key={key} style={s.card}><Choices label={label} compact value={assessment.checks[key]}
            options={(Object.entries(answerLabels) as [CheckAnswer, string][]).filter(([answer]) => answer !== 'na' || canSkipCapability(key))}
            onChange={value => update('checks', { ...assessment.checks, [key]: value as CheckAnswer })} /></View>)}
        <Text style={s.meta}>This won’t mark missions complete, award XP, or approve a release.</Text>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [s.primary, pressed && s.pressed]}><Text style={s.primaryLabel}>Find my next move →</Text></Pressable>
      </> : <>
        <View style={[s.card, s.mint]}><Text style={s.eyebrow}>SUGGESTED FOCUS</Text><Text accessibilityRole="header" style={s.heading}>{guidance.title}</Text>
          <Text style={s.body}>{guidance.task}</Text>
          <Link href={{ pathname: '/help', params: { projectId: String(project.id) } }} asChild><Pressable accessibilityRole="link" style={({ pressed }) => [s.primary, pressed && s.pressed]}><Text style={s.primaryLabel}>Open resources for my app →</Text></Pressable></Link>
        </View>
        <Text accessibilityRole="header" style={s.heading}>Why start here?</Text><Text style={s.body}>{guidance.reason}</Text>
        {assessment.stage === 'live' ? <Text style={s.body}>Being live does not mean every capability has been checked.</Text> : null}
        {guidance.generalOnly ? <View style={s.card}><Text style={s.body}>We’re showing general handbook guidance. The guided missions use Expo and TypeScript; a matching lab for your selected tools may not be available.</Text></View>
          : <Link href={guidance.startHere ? '/getting-started' : { pathname: '/mission/[id]', params: { id: String(guidance.missionId) } }} style={s.linkAction}>{guidance.startHere ? 'Open the starter and local lab →' : 'Open the related mission →'}</Link>}
        <Link href={{ pathname: '/plan/[id]', params: { id: String(project.id) } }} style={s.linkAction}>Review my tools and project requirements →</Link>
        <Pressable accessibilityRole="button" onPress={() => move(1)} style={s.linkAction}><Text style={s.link}>Update my answers</Text></Pressable>
        <Link href="/help" style={s.linkAction}>Browse all resources →</Link>
        <Text style={s.meta}>Saved on this device for this project. Suggestions come from your answers, not a code inspection or safety certification.</Text>
      </>}
    </View>
  </ScrollView>;
}

export default function AssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project>();
  const [error, setError] = useState('');
  const { top } = useSafeAreaInsets();
  const load = useCallback(() => {
    try {
      const found = projectStore.load().find(item => String(item.id) === id);
      setProject(found); setError(found ? '' : 'This project could not be found. Choose a saved project.');
    } catch { setProject(undefined); setError('Couldn’t read your saved project. Your data has not been changed.'); }
  }, [id]);
  useFocusEffect(load);
  if (!project) return <View style={[s.screen, s.content, { paddingTop: top + 24 }]}><Text accessibilityRole="alert" style={s.body}>{error || 'Opening your project…'}</Text>
    <Pressable accessibilityRole="button" onPress={load} style={s.back}><Text style={s.link}>Try again</Text></Pressable><Link href="/project" style={s.linkAction}>Choose a project →</Link></View>;
  return <Editor key={`${id}:${JSON.stringify([project.plan, project.assessment])}`} project={project} onSaved={setProject} />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, content: { padding: 24 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 18 },
  title: { color: c.ink, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }, heading: { color: c.ink, fontSize: 24, fontWeight: '800' },
  eyebrow: { color: c.purple, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, body: { color: c.muted, fontSize: 16, lineHeight: 25 },
  meta: { color: c.muted, fontSize: 14, lineHeight: 22 }, label: { color: c.ink, fontSize: 16, fontWeight: '700' },
  field: { gap: 12 }, options: { gap: 10 }, answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { minHeight: 54, backgroundColor: '#F5EFFC', borderWidth: 1, borderColor: c.controlLine, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  choiceLabel: { color: c.ink, fontSize: 16, flex: 1, flexShrink: 1 }, selected: { backgroundColor: '#DED0F3', borderColor: c.purple, borderWidth: 2 },
  answer: { flexGrow: 1, flexBasis: '45%', minWidth: 100 },
  card: { padding: 20, borderRadius: 24, backgroundColor: '#F5EFFC', gap: 14, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 12, color: '#39205B18' }] },
  mint: { backgroundColor: c.mint }, primary: { minHeight: 54, borderRadius: 18, backgroundColor: c.purple, padding: 16, justifyContent: 'center', alignItems: 'center' },
  primaryLabel: { color: c.white, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  back: { minHeight: 48, paddingVertical: 12 }, linkAction: { minHeight: 48, paddingVertical: 12, color: c.purple, fontSize: 16, fontWeight: '700' },
  link: { color: c.purple, fontSize: 16, fontWeight: '700' }, error: { color: c.blocked, fontSize: 16 }, pressed: { opacity: 0.75 },
});
