import { setStringAsync } from 'expo-clipboard';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { projectStore } from '../../src/projects/local';
import { createPlanDraft, foundationPrompt, maxPlanFieldLength, planDecisions, planIssues, planSections, recommendTools } from '../../src/projects/plan';
import type { PlanField, PlanKey } from '../../src/projects/plan';
import type { Project } from '../../src/projects/store';
import { colors } from '../../src/theme';
import { TechnologyIcon } from '../../src/components/TechnologyIcon';

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

function Field({ field, value, suggested, onChange }: {
  field: PlanField; value: string; suggested?: string; onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const chosen = field.options?.find(option => option[0] === value);
  const recommended = field.options?.find(option => option[0] === suggested);

  return <View style={styles.field}>
    <Text accessibilityRole="header" style={styles.label}>{field.label}</Text>
    {field.options ? <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${field.label}, ${chosen?.[1] ?? 'Choose an option'}`}
        accessibilityState={{ expanded }} onPress={() => setExpanded(previous => !previous)}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <View style={styles.choiceTitle}>
          <TechnologyIcon field={field.key} value={value} />
          <Text style={[styles.label, styles.choiceLabel]}>{chosen?.[1] ?? 'Choose an option'}</Text>
        </View>
        {chosen?.[3] ? <Text style={styles.meta}>{chosen[3]}</Text> : null}
      </Pressable>
      {chosen?.[2] && !expanded ? <Text style={styles.body}>{chosen[2]}</Text> : null}
      {recommended && !expanded && suggested !== value ? <Text style={styles.meta}>Recommended · {recommended[1]}</Text> : null}
      {expanded ? field.options.map(([id, label, description, cost, url]) => (
        <View key={id} style={styles.option}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === id }}
            onPress={() => { onChange(id); setExpanded(false); }}
            style={({ pressed }) => [styles.action, value === id && styles.selected, pressed && styles.pressed]}>
            <View style={styles.choiceTitle}>
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
          </Pressable> : null}
        </View>
      )) : null}
      {linkError ? <Text accessibilityRole="alert" style={styles.body}>Couldn’t open the official details.</Text> : null}
    </> : <TextInput accessibilityLabel={field.label} value={value} onChangeText={onChange}
      placeholder={field.example} placeholderTextColor={colors.muted} maxLength={maxPlanFieldLength} multiline style={styles.input} />}
  </View>;
}

function PlanEditor({ project }: { project: Project }) {
  const { bottom } = useSafeAreaInsets();
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

  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>{project.name}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.heroBody}>Step {step + 1} of {planSections.length + 1} · {title}</Text>
      </View>
      {section ? <View style={styles.card} key={title}>
        {step === 1 ? <Text style={styles.body}>Choose a platform and decide if records need to sync. Free local tools run on your computer or device. Hosted free tiers have limits, and publishing costs are separate.</Text> : null}
        {section.fields.map(field => <Field key={field.key} field={field} value={draft[field.key] ?? ''}
          suggested={field.key === 'stack' || field.key === 'data' || field.key === 'auth' ? recommendations[field.key] : undefined}
          onChange={value => edit(field.key, value)} />)}
      </View> : <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.label}>{issues.length ? 'Open decisions' : 'Ready for foundation setup'}</Text>
        {issues.length ? <>
          <Text style={styles.body}>You can generate a draft prompt. It will ask your agent to resolve these items first.</Text>
          {issues.map(issue => <Text key={issue} style={styles.body}>• {issue}</Text>)}
        </> : <Text style={styles.body}>Your prompt includes setup checks, the first working screen, and a way to verify it.</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDecisions }}
          onPress={() => setShowDecisions(previous => !previous)} style={styles.action}>
          <Text style={styles.label}>{showDecisions ? 'Hide recorded decisions' : 'Show recorded decisions'}</Text>
        </Pressable>
        {showDecisions ? <View style={styles.field}>
          {planDecisions(draft).map(decision => <View key={decision.label}>
            <Text style={styles.label}>{decision.label}</Text>
            <Text style={styles.body}>{decision.value}</Text>
          </View>)}
        </View> : null}
        <Action label={prompt ? 'Regenerate foundation prompt' : 'Generate foundation prompt'} onPress={() => save(true)} primary />
        {prompt ? <View style={styles.field}>
          <Action label="Copy foundation prompt" onPress={() => { void copyPrompt(); }} />
        </View> : null}
      </View>}
      {status ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text> : null}
      {!section && prompt ? <Text selectable style={styles.prompt}>{prompt}</Text> : null}
      {section ? <Action label={step === planSections.length - 1 ? 'Review decisions' : 'Next step'} onPress={() => moveTo(step + 1)} primary /> : null}
      <Action label="Save draft" onPress={() => save()} />
      {step > 0 ? <Action label="Previous step" onPress={() => moveTo(step - 1)} /> : null}
      {!section ? <Link href={{ pathname: '/build/[id]', params: { id: String(project.id) } }} asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.label}>Open Build Workspace</Text>
        </Pressable>
      </Link> : null}
    </View>
  </ScrollView>;
}

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const [state] = useState(() => {
    try {
      return { project: projectStore.load().find(project => String(project.id) === id), error: 'Project unavailable' };
    } catch {
      return { project: undefined, error: 'Couldn’t load saved projects' };
    }
  });
  if (state.project) return <PlanEditor project={state.project} />;
  return <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.label}>{state.error}</Text>
      <Link href="/project" dismissTo asChild>
        <Pressable accessibilityRole="link" style={styles.action}><Text style={styles.label}>Open your projects</Text></Pressable>
      </Link>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  choiceTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  choiceLabel: { flex: 1 },
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { backgroundColor: colors.hero, borderRadius: 24, padding: 22, gap: 8 },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.mint, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 18 },
  field: { gap: 8 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  recommended: { color: colors.purple, fontSize: 14, fontWeight: '800' },
  input: { minHeight: 78, textAlignVertical: 'top', borderRadius: 12, borderWidth: 1, borderColor: colors.muted, backgroundColor: colors.background, padding: 12, color: colors.ink, fontSize: 16 },
  option: { borderColor: colors.line, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  action: { minHeight: 48, justifyContent: 'center', gap: 4, padding: 12, borderRadius: 12, backgroundColor: colors.background },
  details: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: colors.card },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  selected: { backgroundColor: colors.mint },
  pressed: { opacity: 0.8 },
  notice: { padding: 12, borderRadius: 12, backgroundColor: colors.lavender, color: colors.ink, fontSize: 16 },
  prompt: { padding: 12, backgroundColor: colors.background, borderRadius: 12, color: colors.ink, fontSize: 15, lineHeight: 22 },
});
