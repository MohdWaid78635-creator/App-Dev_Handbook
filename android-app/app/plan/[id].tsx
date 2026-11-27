import Ionicons from '@expo/vector-icons/Ionicons';
import { setStringAsync } from 'expo-clipboard';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { projectStore } from '../../src/projects/local';
import { createPlanDraft, foundationPrompt, maxPlanFieldLength, planDecisions, planIssues, planSections, recommendTools } from '../../src/projects/plan';
import type { PlanField, PlanKey } from '../../src/projects/plan';
import type { Project } from '../../src/projects/store';
import { homeColors as colors } from '../../src/theme';
import { TechnologyIcon } from '../../src/components/TechnologyIcon';

function Action({ label, onPress, primary = false, icon }: {
  label: string; onPress: () => void; primary?: boolean; icon?: 'arrow-forward' | 'arrow-back' | 'save-outline' | 'copy-outline';
}) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    {icon ? <Ionicons name={icon} size={22} color={primary ? colors.white : colors.purple} importantForAccessibility="no" /> : null}
    <Text style={primary ? styles.primaryLabel : styles.actionLabel}>{label}</Text>
  </Pressable>;
}

function Field({ field, value, suggested, onChange, half = false }: {
  field: PlanField; value: string; suggested?: string; onChange: (value: string) => void; half?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const chosen = field.options?.find(option => option[0] === value);
  const recommended = field.options?.find(option => option[0] === suggested);

  return <View style={[styles.field, styles.formField, half && styles.halfField]}>
    <Text accessibilityRole="header" style={styles.label}>{field.label}</Text>
    {field.options ? <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${field.label}, ${chosen?.[1] ?? 'Choose an option'}`}
        accessibilityState={{ expanded }} onPress={() => setExpanded(previous => !previous)}
        style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
        <View style={styles.choiceTitle}>
          <TechnologyIcon field={field.key} value={value} />
          <Text style={[styles.label, styles.choiceLabel]}>{chosen?.[1] ?? 'Choose an option'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.purple} importantForAccessibility="no" />
        </View>
        {chosen?.[3] ? <Text style={styles.meta}>{chosen[3]}</Text> : null}
      </Pressable>
      {chosen?.[2] && !expanded ? <Text style={styles.body}>{chosen[2]}</Text> : null}
      {recommended && !expanded && suggested !== value ? <Text style={styles.meta}>Recommended · {recommended[1]}</Text> : null}
      {expanded ? field.options.map(([id, label, description, cost, url]) => (
        <View key={id} style={styles.option}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === id }}
            onPress={() => { onChange(id); setExpanded(false); }}
            style={({ pressed }) => [styles.optionChoice, value === id && styles.selected, pressed && styles.pressed]}>
            <View style={styles.choiceTitle}>
              <Ionicons name={value === id ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.purple} importantForAccessibility="no" />
              <TechnologyIcon field={field.key} value={id} />
              <Text style={[styles.label, styles.choiceLabel]}>{label}</Text>
            </View>
            {id === suggested ? <Text style={styles.recommended}>Recommended</Text> : null}
            {cost ? <Text style={styles.meta}>{cost}</Text> : null}
            {description ? <Text style={styles.body}>{description}</Text> : null}
          </Pressable>
          {url ? <Pressable accessibilityRole="link" accessibilityLabel={`Official details for ${label}`}
            onPress={() => { setLinkError(false); void Linking.openURL(url).catch(() => setLinkError(true)); }} style={styles.details}>
            <Text style={styles.recommended}>Official details</Text>
            <Ionicons name="open-outline" size={19} color={colors.purple} importantForAccessibility="no" />
          </Pressable> : null}
        </View>
      )) : null}
      {linkError ? <Text accessibilityRole="alert" style={styles.linkError}>Couldn’t open the official details.</Text> : null}
    </> : <TextInput accessibilityLabel={field.label} value={value} onChangeText={onChange}
      placeholder={field.example} placeholderTextColor={colors.muted} maxLength={maxPlanFieldLength} multiline style={styles.input} />}
  </View>;
}

function PlanEditor({ project }: { project: Project }) {
  const { top, bottom } = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const dockActions = height >= 600 && fontScale <= 1.5;
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [draft, setDraft] = useState(() => createPlanDraft(project));
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('');
  const [prompt, setPrompt] = useState('');
  const [showDecisions, setShowDecisions] = useState(false);
  const section = planSections[step];
  const recommendations = recommendTools(draft);
  const issues = planIssues(draft);
  const title = section?.title ?? 'Review your plan';
  const stepLabels = ['Idea', 'Tools', 'Security', 'Review'];

  function moveTo(index: number) {
    Keyboard.dismiss();
    setStep(index);
    setStatus('');
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function edit(key: PlanKey, value: string) {
    setDraft(current => ({ ...current, [key]: value }));
    setPrompt('');
    setStatus('');
  }

  function save(generate = false) {
    try {
      projectStore.savePlan(project.id, draft);
      Keyboard.dismiss();
      if (generate) setPrompt(foundationPrompt(project, draft));
      setStatus(generate ? 'Foundation prompt ready. Draft saved.' : 'Draft saved on this device.');
    } catch {
      setStatus('Couldn’t save your draft. Your edits are still here. Try saving again.');
    }
  }

  async function copyPrompt() {
    try {
      const copied = await setStringAsync(prompt, { android: { isSensitive: true } });
      setStatus(copied ? 'Foundation prompt copied.' : 'Couldn’t copy. Select the prompt text to copy it.');
    } catch {
      setStatus('Couldn’t copy. Select the prompt text to copy it.');
    }
  }

  const actions = <View style={[styles.footer, { paddingBottom: dockActions ? Math.max(bottom, 12) : 12 }]}>
    <View style={styles.footerColumn}>
      {status ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text> : null}
      {section ? <Action label={step === 0 ? 'Next: choose tools' : step === 1 ? 'Next: security & setup' : 'Review decisions'}
        icon="arrow-forward" onPress={() => moveTo(step + 1)} primary /> : null}
      <View style={styles.footerLinks}>
        {step > 0 ? <Action label="Previous step" icon="arrow-back" onPress={() => moveTo(step - 1)} /> : null}
        <Action label="Save draft" icon="save-outline" onPress={() => save()} />
      </View>
    </View>
  </View>;

  return <KeyboardAvoidingView behavior="height" style={[styles.screen, { paddingTop: top }]}>
  <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.scroll, { paddingBottom: dockActions ? 24 : Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.header}>
        <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" /><Text style={styles.backLabel}>Projects</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.headerTitle}>Plan Mode</Text>
        <Link href="/help" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link>
      </View>
      <View style={styles.projectLabel}>
        <Ionicons name="folder-outline" size={26} color={colors.success} importantForAccessibility="no" /><Text style={styles.projectName}>{project.name}</Text>
      </View>
      <View style={styles.steps}>
        {stepLabels.map((label, index) => <View key={label} style={styles.step} accessible
          accessibilityLabel={`Step ${index + 1}, ${label}${step === index ? ', current' : ''}`}>
          {index + 1 < stepLabels.length ? <View style={styles.connector} importantForAccessibility="no" /> : null}
          <View style={[styles.stepCircle, index === step && styles.activeStep]}><Text style={[styles.stepNumber, index === step && styles.activeStepNumber]}>{index + 1}</Text></View>
          <Text style={styles.stepLabel}>{label}</Text>
        </View>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.kicker}>STEP {step + 1} OF {planSections.length + 1}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {section ? <Text style={styles.subtitle}>{step === 0 ? 'Give your first build a clear, small goal.'
        : step === 1 ? 'Pick a platform, then compare your options.' : 'Decide how your app will handle data and setup.'}</Text> : null}
      {section ? <View style={styles.card} key={title}>
        {step === 1 ? <Text style={styles.body}>Choose a platform and decide if records need to sync. Free local tools run on your computer or device. Hosted free tiers have limits, and publishing costs are separate.</Text> : null}
        <View style={styles.formFields}>
        {section.fields.map(field => <Field key={field.key} field={field} value={draft[field.key] ?? ''}
          half={step === 1 && (field.key === 'target' || field.key === 'computer') && width >= 400 && fontScale <= 1.2}
          suggested={field.key === 'stack' || field.key === 'data' || field.key === 'auth' ? recommendations[field.key] : undefined}
          onChange={value => edit(field.key, value)} />)}
        </View>
      </View> : <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.label}>{issues.length ? 'Open decisions' : 'Ready for foundation setup'}</Text>
        {issues.length ? <>
          <Text style={styles.body}>You can generate a draft prompt. It will ask your agent to resolve these items first.</Text>
          {issues.map(issue => <Text key={issue} style={styles.body}>• {issue}</Text>)}
        </> : <Text style={styles.body}>Your prompt includes setup checks, the first working screen, and a way to verify it.</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDecisions }}
          onPress={() => setShowDecisions(previous => !previous)} style={[styles.dropdown, styles.reviewToggle]}>
          <Text style={[styles.label, styles.choiceLabel]}>{showDecisions ? 'Hide recorded decisions' : 'Show recorded decisions'}</Text>
          <Ionicons name={showDecisions ? 'chevron-up' : 'chevron-down'} size={22} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
        {showDecisions ? <View style={styles.field}>
          {planDecisions(draft).map(decision => <View key={decision.label}>
            <Text style={styles.label}>{decision.label}</Text>
            <Text style={styles.body}>{decision.value}</Text>
          </View>)}
        </View> : null}
        <Action label={prompt ? 'Regenerate foundation prompt' : 'Generate foundation prompt'} onPress={() => save(true)} primary />
        {prompt ? <View style={styles.field}>
          <Action label="Copy foundation prompt" icon="copy-outline" onPress={() => { void copyPrompt(); }} />
        </View> : null}
      </View>}
      {!section && prompt ? <Text selectable style={styles.prompt}>{prompt}</Text> : null}
      {!section ? <Link href={{ pathname: '/build/[id]', params: { id: String(project.id) } }} asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.label}>Open Build Workspace</Text>
        </Pressable>
      </Link> : null}
      {!dockActions ? actions : null}
    </View>
  </ScrollView>
  {dockActions ? actions : null}
  </KeyboardAvoidingView>;
}

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const [state] = useState(() => {
    try {
      return { project: projectStore.load().find(project => String(project.id) === id), error: 'Project unavailable' };
    } catch {
      return { project: undefined, error: 'Couldn’t load saved projects' };
    }
  });
  if (state.project) return <PlanEditor project={state.project} />;
  return <View style={[styles.screen, { paddingTop: top }]}><ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.label}>{state.error}</Text>
      <Link href="/project" dismissTo asChild>
        <Pressable accessibilityRole="link" style={styles.action}><Text style={styles.label}>Open your projects</Text></Pressable>
      </Link>
    </View>
  </ScrollView></View>;
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
  projectName: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800' },
  steps: { flexDirection: 'row', paddingVertical: 8 },
  step: { flex: 1, alignItems: 'center', gap: 8 },
  connector: { position: 'absolute', left: '50%', width: '100%', top: 20, height: 2, backgroundColor: colors.track },
  stepCircle: { ...clay, width: 40, minHeight: 40, paddingVertical: 7, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  activeStep: { backgroundColor: colors.purple },
  stepNumber: { color: colors.muted, fontSize: 17, fontWeight: '800' },
  activeStepNumber: { color: colors.white },
  stepLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  kicker: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  card: { ...clay, backgroundColor: colors.card, borderRadius: 28, padding: 20, gap: 18 },
  formFields: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 },
  field: { gap: 10 },
  formField: { width: '100%' },
  halfField: { width: '47%' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 24 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  recommended: { color: colors.purple, fontSize: 14, fontWeight: '800', lineHeight: 21 },
  input: { minHeight: 66, textAlignVertical: 'top', borderRadius: 18, borderWidth: 1, borderColor: colors.controlLine, backgroundColor: colors.background, padding: 14, color: colors.ink, fontSize: 16, lineHeight: 24 },
  dropdown: { minHeight: 54, gap: 8, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.controlLine, backgroundColor: colors.background },
  choiceTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  choiceLabel: { flex: 1 },
  reviewToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  option: { borderColor: colors.track, borderWidth: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card },
  optionChoice: { minHeight: 54, gap: 10, padding: 14, borderRadius: 18 },
  action: { ...clay, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 22, backgroundColor: colors.card, maxWidth: '100%' },
  actionLabel: { color: colors.purple, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  details: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.card },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  selected: { backgroundColor: colors.mint },
  pressed: { opacity: 0.75 },
  notice: { padding: 14, borderRadius: 18, backgroundColor: colors.card, color: colors.ink, fontSize: 16, lineHeight: 24 },
  linkError: { color: colors.ink, backgroundColor: colors.attentionSurface, padding: 12, borderRadius: 16, fontSize: 16, lineHeight: 24 },
  prompt: { padding: 16, backgroundColor: colors.card, borderRadius: 22, color: colors.ink, fontSize: 15, lineHeight: 23 },
  footer: { paddingHorizontal: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.track, backgroundColor: colors.background },
  footerColumn: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 8 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
});
