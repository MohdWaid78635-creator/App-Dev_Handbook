import Ionicons from '@expo/vector-icons/Ionicons';
import { setStringAsync } from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Link } from '../../src/components/Link';
import { useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { projectStore } from '../../src/projects/local';
import { buildCardStatus, canSkipBuildCard, maxBuildSkipReasonLength } from '../../src/projects/store';
import type { BuildEvidence, Project } from '../../src/projects/store';
import { homeColors as colors } from '../../src/theme';

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

function Disclosure({ title, summary, icon, children, initiallyOpen = false }: {
  title: string; summary?: string; icon: 'list-outline' | 'checkbox-outline' | 'shield-checkmark-outline'; children: ReactNode; initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={styles.fold}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
      onPress={() => setOpen(value => !value)} style={({ pressed }) => [styles.foldHeading, pressed && styles.pressed]}>
      <Ionicons name={icon} size={23} color={colors.ink} importantForAccessibility="no" />
      <View style={styles.foldTitle}><Text style={styles.label}>{title}</Text>{summary ? <Text style={styles.meta}>{summary}</Text> : null}</View>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.purple} importantForAccessibility="no" />
    </Pressable>
    {open ? <View style={styles.foldBody}>{children}</View> : null}
  </View>;
}

function CardDetail({ card, name, evidence, onProof, onSkip, showPrompt }: {
  card: Card;
  name: string;
  evidence?: BuildEvidence;
  onProof: (proof: string, checked: boolean) => boolean;
  onSkip: (reason: string | null) => boolean;
  showPrompt: boolean;
}) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState(evidence?.skipReason ?? '');
  const prompt = card.prompt.replaceAll('[APP_NAME]', () => name);
  const skipped = Boolean(evidence?.skipReason);

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
    {showPrompt ? <Text selectable style={styles.prompt}>{prompt}</Text> : null}
    <Disclosure title="What to do" icon="list-outline">
      {card.do.map((action, index) => <Text key={index} style={styles.body}>{index + 1}. {action}</Text>)}
    </Disclosure>
    <Disclosure title="Proof checklist" icon="checkbox-outline" initiallyOpen
      summary={`${card.proof.filter(proof => evidence?.checked.includes(proof)).length} of ${card.proof.length} checked`}>
    <Text style={styles.body}>{skipped ? 'Resume this card to update its proof.' : 'Check each item after you see the result in your project.'}</Text>
    {card.proof.map(proof => {
      const checked = evidence?.checked.includes(proof) ?? false;
      return <Pressable key={proof} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: skipped }}
        disabled={skipped} onPress={() => { if (onProof(proof, !checked)) setStatus('Proof saved.'); }}
        style={({ pressed }) => [styles.check, checked && styles.checked, skipped && styles.disabled, pressed && styles.pressed]}>
        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={26} color={checked ? colors.success : colors.muted} importantForAccessibility="no" />
        <Text style={styles.checkText}>{proof}</Text>
      </Pressable>;
    })}
    </Disclosure>
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
    <Disclosure title="Recovery, risk & source" icon="shield-checkmark-outline">
    <Text style={styles.body}><Text style={styles.label}>If stuck. </Text>{card.ifStuck}</Text>
    <Text style={styles.body}><Text style={styles.label}>Risk. </Text>{card.risk}</Text>
    <Text style={styles.body}><Text style={styles.label}>Rollback. </Text>{card.rollback}</Text>
    <Text style={styles.body}><Text style={styles.label}>Cost. </Text>{card.cost}</Text>
    <Link href={card.source.url} style={styles.link}>Open official source</Link>
    <Text style={styles.meta}>Source checked {card.source.checked}</Text>
    </Disclosure>
  </View>;
}

function Workspace({ initialProject, initialMission }: { initialProject: Project; initialMission?: string }) {
  const { top, bottom } = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const dockActions = height >= 600 && fontScale <= 1.5;
  const [project, setProject] = useState(initialProject);
  const [mission, setMission] = useState(() => missions.find(item => String(item.id) === initialMission) ??
    missions.find(item => item.steps.some(card => {
      const status = buildCardStatus(card, initialProject.build?.[card.id]);
      return status === 'not-started' || status === 'in-progress';
    })) ?? missions[0]);
  const [choosingMission, setChoosingMission] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(() => mission.steps[0]?.id ?? null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [saveError, setSaveError] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const cardPositions = useRef<Record<string, number>>({});
  const activeCard = mission.steps.find(card => card.id === openCard);
  const activeCardId = useRef<string | undefined>(undefined);
  activeCardId.current = activeCard?.id;
  const statuses = allCards.map(card => buildCardStatus(card, project.build?.[card.id]));
  const verified = statuses.filter(status => status === 'verified').length;
  const skipped = statuses.filter(status => status === 'not-applicable').length;

  function revealPrompt() {
    setShowPrompt(true);
    if (activeCard) scroll.current?.scrollTo({ y: cardPositions.current[activeCard.id] ?? 0, animated: false });
  }

  async function copyPrompt() {
    if (!activeCard) return;
    const cardId = activeCard.id;
    const prompt = activeCard.prompt.replaceAll('[APP_NAME]', () => project.name);
    try {
      const copied = await setStringAsync(prompt, { android: { isSensitive: true } });
      if (activeCardId.current !== cardId) return;
      if (copied) { setCopyStatus('Build prompt copied.'); return; }
    } catch {
      if (activeCardId.current !== cardId) return;
    }
    revealPrompt();
    setCopyStatus('Couldn’t copy. Select the prompt text to copy it.');
  }

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

  const actions = activeCard ? <View style={[styles.footer, { paddingBottom: dockActions ? Math.max(bottom, 12) : 12 }]}>
    <View style={styles.footerColumn}>
      {copyStatus ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{copyStatus}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`Copy build prompt: ${activeCard.title}`}
        onPress={() => { void copyPrompt(); }} style={({ pressed }) => [styles.action, styles.primary, pressed && styles.pressed]}>
        <Ionicons name="copy-outline" size={23} color={colors.white} importantForAccessibility="no" /><Text style={styles.primaryLabel}>Copy build prompt</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showPrompt }}
        onPress={() => { if (showPrompt) setShowPrompt(false); else revealPrompt(); }} style={({ pressed }) => [styles.previewAction, pressed && styles.pressed]}>
        <Ionicons name="eye-outline" size={23} color={colors.purple} importantForAccessibility="no" /><Text style={styles.previewLabel}>{showPrompt ? 'Hide prompt' : 'Preview prompt'}</Text>
      </Pressable>
    </View>
  </View> : null;

  return <KeyboardAvoidingView behavior="height" style={[styles.screen, { paddingTop: top }]}>
  <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.scroll, { paddingBottom: dockActions && activeCard ? 24 : Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.header}>
        <Link href="/project" dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" /><Text style={styles.backLabel}>Projects</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.headerTitle}>Build Workspace</Text>
        <Link href={{ pathname: '/help', params: { missionId: String(mission.id) } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Help with this mission" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link>
      </View>
      <View style={styles.projectLabel}><Ionicons name="folder-outline" size={26} color={colors.success} importantForAccessibility="no" /><Text style={styles.title}>{project.name}</Text></View>
      <View style={styles.progressLabels}>
        <Text accessibilityLiveRegion="polite" style={styles.progressText}>{verified} of {allCards.length} cards with proof</Text>
        <Text style={styles.meta}>{skipped} not applicable</Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Build cards with recorded proof"
        accessibilityValue={{ min: 0, max: allCards.length, now: verified }}>
        <View style={[styles.fill, { width: `${allCards.length ? verified / allCards.length * 100 : 0}%` }]} />
      </View>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: choosingMission }}
          onPress={() => setChoosingMission(value => !value)} style={({ pressed }) => [styles.missionSelector, pressed && styles.pressed]}>
          <View style={styles.missionText}><Text style={styles.meta}>MISSION {mission.id + 1} OF {missions.length}</Text>
          <Text style={styles.label}>{mission.lessonTitle}</Text></View>
          <Ionicons name={choosingMission ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
        {choosingMission ? missions.map(item => (
          <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: item.id === mission.id }}
            onPress={() => {
              setMission(item);
              setOpenCard(item.steps[0]?.id ?? null);
              setShowPrompt(false);
              setCopyStatus('');
              setChoosingMission(false);
              scroll.current?.scrollTo({ y: 0, animated: false });
            }} style={({ pressed }) => [styles.action, item.id === mission.id && styles.checked, pressed && styles.pressed]}>
            <Ionicons name={item.id === mission.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.purple} importantForAccessibility="no" />
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
        const cardStatus = buildCardStatus(card, evidence);
        return <View key={card.id} style={styles.card} onLayout={event => { cardPositions.current[card.id] = event.nativeEvent.layout.y; }}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
            onPress={() => { setOpenCard(expanded ? null : card.id); setSaveError(''); setShowPrompt(false); setCopyStatus(''); }}
            style={({ pressed }) => [styles.cardHeading, pressed && styles.pressed]}>
            <View style={styles.cardIdentity}><Text style={styles.label}>{card.title}</Text>
            <Text style={[styles.badge, cardStatus === 'verified' && styles.checked, cardStatus === 'in-progress' && styles.inProgress]}>{labels[cardStatus]}</Text></View>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
          </Pressable>
          {expanded ? <>
            {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
            <CardDetail card={card} name={project.name} evidence={evidence} showPrompt={showPrompt}
              onProof={(proof, checked) => save(() => projectStore.setBuildProof(project.id, card, proof, checked))}
              onSkip={reason => save(() => projectStore.setBuildSkip(project.id, card, reason))} />
          </> : null}
        </View>;
      })}
      {!dockActions ? actions : null}
    </View>
  </ScrollView>
  {dockActions ? actions : null}
  </KeyboardAvoidingView>;
}

export default function BuildScreen() {
  const { id, missionId } = useLocalSearchParams<{ id: string; missionId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const [state] = useState(() => {
    try {
      return { project: projectStore.load().find(item => String(item.id) === id), error: 'Project unavailable' };
    } catch {
      return { project: undefined, error: 'Couldn’t load saved projects' };
    }
  });
  if (state.project) return <Workspace initialProject={state.project} initialMission={missionId} />;
  return <View style={[styles.screen, { paddingTop: top }]}><ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.heading}>{state.error}</Text>
      <Link href="/project" dismissTo style={styles.link}>Open your projects</Link>
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'center' },
  help: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  projectLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: colors.ink, fontSize: 23, fontWeight: '800', flex: 1 },
  progressLabels: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  track: { height: 12, backgroundColor: colors.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.purple, borderRadius: 8 },
  missionSelector: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  missionText: { flex: 1, gap: 6 },
  heading: { color: colors.ink, fontSize: 23, fontWeight: '800' },
  card: { ...clay, padding: 16, gap: 14, backgroundColor: colors.card, borderRadius: 26 },
  cardHeading: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIdentity: { flex: 1, gap: 8 },
  badge: { alignSelf: 'flex-start', color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: colors.background },
  inProgress: { color: colors.attention, backgroundColor: colors.attentionSurface },
  detail: { gap: 14 },
  label: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: '800', flexShrink: 1 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  fold: { borderWidth: 1, borderColor: colors.controlLine, borderRadius: 20, backgroundColor: colors.background },
  foldHeading: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  foldTitle: { flex: 1, gap: 4 },
  foldBody: { gap: 12, padding: 12, paddingTop: 0 },
  action: { ...clay, minHeight: 52, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  pressed: { opacity: 0.75 },
  prompt: { padding: 14, borderRadius: 18, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 23 },
  check: { minHeight: 52, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16 },
  checked: { backgroundColor: colors.mint },
  disabled: { opacity: 0.5 },
  checkText: { color: colors.ink, flex: 1, fontSize: 15, lineHeight: 23 },
  input: { minHeight: 80, borderWidth: 1, borderColor: colors.controlLine, backgroundColor: colors.background, borderRadius: 18, padding: 14, textAlignVertical: 'top', color: colors.ink, fontSize: 16, lineHeight: 24 },
  notice: { padding: 14, borderRadius: 18, color: colors.ink, backgroundColor: colors.card, fontSize: 16, lineHeight: 24 },
  link: { minHeight: 48, textAlignVertical: 'center', color: colors.purple, fontSize: 16, fontWeight: '800', lineHeight: 24 },
  footer: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.track, paddingHorizontal: 14, paddingTop: 12 },
  footerColumn: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 8 },
  previewAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  previewLabel: { color: colors.purple, fontSize: 16, fontWeight: '800', flexShrink: 1 },
});
