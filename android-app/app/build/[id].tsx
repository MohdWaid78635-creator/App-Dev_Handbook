import { setStringAsync } from 'expo-clipboard';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { projectStore } from '../../src/projects/local';
import { buildCardStatus, canSkipBuildCard, maxBuildSkipReasonLength } from '../../src/projects/store';
import type { BuildEvidence, Project } from '../../src/projects/store';
import { colors } from '../../src/theme';

type Mission = typeof missions[number];
type Card = Mission['steps'][number];
const allCards = missions.flatMap(mission => mission.steps);
const labels = { verified: 'Proof recorded', 'not-applicable': 'Not applicable', 'in-progress': 'In progress', 'not-started': 'Not started' };

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

function CardDetail({ card, name, evidence, onProof, onSkip }: {
  card: Card;
  name: string;
  evidence?: BuildEvidence;
  onProof: (proof: string, checked: boolean) => boolean;
  onSkip: (reason: string | null) => boolean;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState(evidence?.skipReason ?? '');
  const prompt = card.prompt.replaceAll('[APP_NAME]', () => name);
  const skipped = Boolean(evidence?.skipReason);

  async function copyPrompt() {
    try {
      if (await setStringAsync(prompt, { android: { isSensitive: true } })) {
        setCopyStatus('Build prompt copied.');
        return;
      }
    } catch {
      // Selectable text is available if the clipboard is unavailable.
    }
    setShowPrompt(true);
    setCopyStatus('Couldn’t copy. Select the prompt text to copy it.');
  }

  function saveReason() {
    if (!reason.trim()) {
      setStatus('Enter a reason before marking this card not applicable.');
      return;
    }
    if (onSkip(reason)) {
      Keyboard.dismiss();
      setStatus('Reason saved.');
    }
  }

  return <View style={styles.detail}>
    <Text style={styles.body}>{card.why}</Text>
    <Text accessibilityRole="header" style={styles.label}>What to do</Text>
    {card.do.map((action, index) => <Text key={index} style={styles.body}>{index + 1}. {action}</Text>)}
    <Action label="Copy build prompt" onPress={() => { void copyPrompt(); }} primary />
    {copyStatus ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{copyStatus}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showPrompt }}
      onPress={() => setShowPrompt(value => !value)} style={styles.action}>
      <Text style={styles.label}>{showPrompt ? 'Hide prompt' : 'Preview prompt'}</Text>
    </Pressable>
    {showPrompt ? <Text selectable style={styles.prompt}>{prompt}</Text> : null}
    <Text accessibilityRole="header" style={styles.label}>Proof checklist</Text>
    <Text style={styles.body}>{skipped ? 'Resume this card to update its proof.' : 'Check each item after you see the result in your project.'}</Text>
    {card.proof.map(proof => {
      const checked = evidence?.checked.includes(proof) ?? false;
      return <Pressable key={proof} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: skipped }}
        disabled={skipped} onPress={() => { if (onProof(proof, !checked)) setStatus('Proof saved.'); }}
        style={({ pressed }) => [styles.check, checked && styles.checked, pressed && styles.pressed]}>
        <Text importantForAccessibility="no" style={styles.mark}>{checked ? '✓' : '□'}</Text>
        <Text style={styles.checkText}>{proof}</Text>
      </Pressable>;
    })}
    {canSkipBuildCard(card) ? <View style={styles.detail}>
      <Text style={styles.label}>Why is this optional card not applicable?</Text>
      <TextInput accessibilityLabel="Reason this card is not applicable" value={reason} onChangeText={setReason}
        maxLength={maxBuildSkipReasonLength} placeholder="Example: This app has no purchases" placeholderTextColor={colors.muted}
        multiline style={styles.input} />
      <Action label={skipped ? 'Update reason' : 'Mark not applicable'} onPress={saveReason} />
      {skipped ? <Action label="Resume card" onPress={() => {
        if (onSkip(null)) { setReason(''); setStatus('Card resumed.'); }
      }} /> : null}
    </View> : null}
    {status ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text> : null}
    <Text style={styles.body}><Text style={styles.label}>If stuck. </Text>{card.ifStuck}</Text>
    <Text style={styles.body}><Text style={styles.label}>Risk. </Text>{card.risk}</Text>
    <Text style={styles.body}><Text style={styles.label}>Rollback. </Text>{card.rollback}</Text>
    <Text style={styles.body}><Text style={styles.label}>Cost. </Text>{card.cost}</Text>
    <Link href={card.source.url} style={styles.link}>Open official source</Link>
    <Text style={styles.meta}>Source checked {card.source.checked}</Text>
  </View>;
}

function Workspace({ initialProject, initialMission }: { initialProject: Project; initialMission?: string }) {
  const { bottom } = useSafeAreaInsets();
  const [project, setProject] = useState(initialProject);
  const [mission, setMission] = useState(() => missions.find(item => String(item.id) === initialMission) ??
    missions.find(item => item.steps.some(card => {
      const status = buildCardStatus(card, initialProject.build?.[card.id]);
      return status === 'not-started' || status === 'in-progress';
    })) ?? missions[0]);
  const [choosingMission, setChoosingMission] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const statuses = allCards.map(card => buildCardStatus(card, project.build?.[card.id]));
  const verified = statuses.filter(status => status === 'verified').length;
  const skipped = statuses.filter(status => status === 'not-applicable').length;

  function save(update: () => Project) {
    try {
      setProject(update());
      setSaveError('');
      return true;
    } catch {
      setSaveError('Couldn’t save this change. Your previous proof is still saved. Try again.');
      return false;
    }
  }

  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>{project.name}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.heroBody}>{verified} of {allCards.length} cards with proof · {skipped} not applicable</Text>
      </View>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: choosingMission }}
          onPress={() => setChoosingMission(value => !value)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.label}>Choose mission</Text>
          <Text style={styles.meta}>Mission {mission.id + 1} of {missions.length} · {mission.lessonTitle}</Text>
        </Pressable>
        {choosingMission ? missions.map(item => (
          <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === mission.id }}
            onPress={() => {
              setMission(item);
              setOpenCard(null);
              setChoosingMission(false);
              scroll.current?.scrollTo({ y: 0, animated: false });
            }} style={({ pressed }) => [styles.action, item.id === mission.id && styles.checked, pressed && styles.pressed]}>
            <Text style={styles.label}>{item.id + 1}. {item.lessonTitle}</Text>
          </Pressable>
        )) : null}
      </View>
      <Text accessibilityRole="header" style={styles.heading}>Build cards</Text>
      <Text style={styles.body}>{mission.description}</Text>
      {saveError && !openCard ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
      {mission.steps.map(card => {
        const evidence = project.build?.[card.id];
        const expanded = openCard === card.id;
        return <View key={card.id} style={styles.card}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
            onPress={() => { setOpenCard(expanded ? null : card.id); setSaveError(''); }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.label}>{card.title}</Text>
            <Text style={styles.meta}>{labels[buildCardStatus(card, evidence)]}</Text>
          </Pressable>
          {expanded ? <>
            {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
            <CardDetail card={card} name={project.name} evidence={evidence}
              onProof={(proof, checked) => save(() => projectStore.setBuildProof(project.id, card, proof, checked))}
              onSkip={reason => save(() => projectStore.setBuildSkip(project.id, card, reason))} />
          </> : null}
        </View>;
      })}
    </View>
  </ScrollView>;
}

export default function BuildScreen() {
  const { id, missionId } = useLocalSearchParams<{ id: string; missionId?: string }>();
  const [state] = useState(() => {
    try {
      return { project: projectStore.load().find(item => String(item.id) === id), error: 'Project unavailable' };
    } catch {
      return { project: undefined, error: 'Couldn’t load saved projects' };
    }
  });
  if (state.project) return <Workspace initialProject={state.project} initialMission={missionId} />;
  return <ScrollView contentContainerStyle={styles.screen}>
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.heading}>{state.error}</Text>
      <Link href="/project" dismissTo style={styles.link}>Open your projects</Link>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { gap: 8, padding: 22, borderRadius: 24, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.mint, fontSize: 16, fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  card: { padding: 12, gap: 8, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 18 },
  detail: { gap: 10, padding: 4 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  action: { minHeight: 48, borderRadius: 12, padding: 12, justifyContent: 'center', gap: 4, backgroundColor: colors.lavender },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  prompt: { padding: 12, borderRadius: 12, backgroundColor: colors.background, color: colors.ink, fontSize: 16, lineHeight: 23 },
  check: { minHeight: 48, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.background, borderRadius: 12 },
  checked: { backgroundColor: colors.mint },
  mark: { color: colors.purple, fontSize: 20, fontWeight: '800' },
  checkText: { color: colors.ink, flex: 1, fontSize: 16, lineHeight: 23 },
  input: { minHeight: 72, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, padding: 12, textAlignVertical: 'top', color: colors.ink, fontSize: 16 },
  notice: { padding: 12, borderRadius: 12, color: colors.ink, backgroundColor: colors.lavender, fontSize: 16 },
  link: { minHeight: 48, textAlignVertical: 'center', color: colors.purple, fontSize: 16, fontWeight: '800' },
});
