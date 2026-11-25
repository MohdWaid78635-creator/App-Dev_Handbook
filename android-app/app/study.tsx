import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import glossary from '../src/generated/glossary.json';
import missions from '../src/generated/missions.json';
import { studyStore } from '../src/study/local';
import { dailyQuestion, dayKey, dueCards, studyStreak } from '../src/study/store';
import { homeColors as colors } from '../src/theme';

const questions = missions.flatMap(mission => mission.quiz.filter(question => question.kind === 'question')
  .map(question => ({ ...question, missionId: mission.id, lessonTitle: mission.lessonTitle })));
type Study = ReturnType<typeof studyStore.load>;

function Action({ label, onPress, primary = false, icon }: {
  label: string; onPress: () => void; primary?: boolean; icon?: 'checkmark' | 'sync-outline' | 'eye-outline';
}) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    {icon ? <Ionicons name={icon} size={24} color={primary ? colors.white : colors.ink} importantForAccessibility="no" /> : null}
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

function DailyPractice({ study, day, onAnswer }: { study: Study; day: string; onAnswer: (id: string, pick: number) => void }) {
  const answer = study.daily.find(item => item.day === day);
  const question = dailyQuestion(questions, day, answer);
  const streak = studyStreak(study.daily, day);
  return <>
    <Text accessibilityRole="header" style={styles.title}>One question. Every day.</Text>
    <View style={styles.countPill}>
      <Ionicons name="calendar-outline" size={23} color={colors.success} importantForAccessibility="no" />
      <Text accessibilityLiveRegion="polite" style={styles.count}>{streak} {streak === 1 ? 'day' : 'days'} in a row</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.kicker}>TODAY’S QUESTION</Text>
      {question ? <>
      <Text style={styles.meta}>{question.lessonTitle}</Text>
      <Text accessibilityRole="header" style={styles.heading}>{question.prompt}</Text>
      {question.options.map((option, index) => {
        const isCorrect = Boolean(answer) && question.answer === index;
        const selected = answer?.pick === index;
        return <Pressable key={index} accessibilityRole="button" accessibilityState={{ disabled: Boolean(answer), selected }}
          disabled={Boolean(answer)} onPress={() => onAnswer(question.id, index)}
          accessibilityLabel={`${option}${isCorrect ? '. Correct answer.' : selected ? '. Your answer.' : ''}`}
          style={({ pressed }) => [styles.option, isCorrect && styles.selectedCorrect, selected && !isCorrect && styles.selectedWrong, pressed && styles.pressed]}>
          <View style={styles.optionText}>
            <Text style={styles.label}>{option}</Text>
            {isCorrect ? <Text style={styles.correctLabel}>Correct answer</Text> : selected ? <Text style={styles.wrongLabel}>Your answer</Text> : null}
          </View>
          <Ionicons name={isCorrect ? 'checkmark-circle-outline' : selected ? 'close-circle-outline' : 'ellipse-outline'}
            size={24} color={isCorrect ? colors.success : selected ? colors.attention : colors.muted} importantForAccessibility="no" />
        </Pressable>;
      })}
      {answer ? <View style={[styles.feedback, answer.pick === question.answer ? styles.correct : styles.wrong]}>
        <Ionicons name={answer.pick === question.answer ? 'checkmark-circle-outline' : 'information-circle-outline'} size={28}
          color={answer.pick === question.answer ? colors.success : colors.attention} importantForAccessibility="no" />
        <Text accessibilityLiveRegion="polite" style={styles.feedbackText}>
          <Text style={styles.feedbackTitle}>{answer.pick === question.answer ? 'Correct' : 'Not quite'}{'\n'}</Text>{question.explanation}
        </Text>
      </View> : <Text style={styles.hint}>Tap an answer to see the explanation.</Text>}
    </> : <Text style={styles.body}>{answer ? 'Today’s practice is saved. A new question will be available tomorrow.' : 'No question is available yet.'}</Text>}
    </View>
    {answer && question ? <>
      <View style={styles.completion}>
        <Text accessibilityRole="header" style={styles.completionTitle}>Today’s practice is complete</Text>
        <Text style={styles.hint}>Come back tomorrow for another question.</Text>
      </View>
      <Link href={{ pathname: '/mission/[id]', params: { id: String(question.missionId) } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Review this lesson: ${question.lessonTitle}`}
          style={({ pressed }) => [styles.action, styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryLabel}>Review this lesson</Text>
          <Ionicons name="arrow-forward" size={23} color={colors.white} importantForAccessibility="no" />
        </Pressable>
      </Link>
      <Text style={styles.hint}>Your first answer is saved for today.</Text>
    </> : null}
  </>;
}

function Flashcards({ study, day, onGrade }: { study: Study; day: string; onGrade: (id: string, knew: boolean) => boolean }) {
  const [deferred, setDeferred] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string>();
  const due = dueCards(glossary, study.cards, day, deferred);
  const card = due[0];
  const levels = new Map(study.cards.map(item => [item.id, item.level]));
  const learned = glossary.filter(item => (levels.get(item.id) ?? 0) >= 3).length;
  const showingMeaning = card?.id === revealed;

  function grade(knew: boolean) {
    if (!card || !onGrade(card.id, knew)) return;
    if (!knew) setDeferred(current => [...current.filter(id => id !== card.id), card.id]);
    setRevealed(undefined);
  }

  return <>
    <Text accessibilityRole="header" style={styles.title}>Make the words stick</Text>
    <Text style={styles.subtitle}>Recall it. Reveal it. Review it.</Text>
    <View style={styles.countPill}>
      <Ionicons name="albums-outline" size={23} color={colors.success} importantForAccessibility="no" />
      <Text accessibilityLiveRegion="polite" style={styles.count}>{due.length} {due.length === 1 ? 'card' : 'cards'} due</Text>
    </View>
    <View style={styles.progressSection}>
      <Text accessibilityLiveRegion="polite" style={styles.progressLabel}>{learned} of {glossary.length} terms recalled</Text>
      <Text style={styles.meta}>On at least three reviews</Text>
      <View accessibilityRole="progressbar" accessibilityLabel="Terms recalled on at least three reviews"
        accessibilityValue={{ min: 0, max: glossary.length, now: learned }} style={styles.track}>
        <View style={[styles.fill, { width: `${glossary.length ? learned / glossary.length * 100 : 0}%` }]} />
      </View>
    </View>
    {card ? <>
      <View style={styles.stack}>
        <View style={styles.backCardFar} pointerEvents="none" importantForAccessibility="no-hide-descendants" />
        <View style={styles.backCard} pointerEvents="none" importantForAccessibility="no-hide-descendants" />
        <View style={styles.flashcard}>
          <Text style={styles.kicker}>GLOSSARY TERM</Text>
          <Text accessibilityRole="header" style={styles.term}>{card.term}</Text>
          {showingMeaning ? <>
            <View style={styles.meaning}>
              <Text style={styles.meaningLabel}>Meaning</Text>
              <Text accessibilityLiveRegion="polite" style={styles.definition}>{card.meaning}</Text>
            </View>
            <Text style={styles.hint}>Meaning revealed</Text>
          </> : <Text style={styles.hint}>Think of the meaning before you reveal it.</Text>}
        </View>
      </View>
      {showingMeaning ? <>
        <Text accessibilityRole="header" style={styles.recallTitle}>How well did you remember?</Text>
        <Action label="I knew it" icon="checkmark" onPress={() => grade(true)} primary />
        <Action label="Show again" icon="sync-outline" onPress={() => grade(false)} />
        <Text style={styles.hint}>Show again brings this term back in today’s queue.</Text>
      </> : <Action label="Reveal meaning" icon="eye-outline" onPress={() => setRevealed(card.id)} primary />}
    </> : <View style={[styles.card, styles.correct]}>
      <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} importantForAccessibility="no" />
      <Text accessibilityRole="header" style={styles.heading}>You’re caught up</Text>
      <Text style={styles.body}>Cards will return when they’re due.</Text>
    </View>}
  </>;
}

function loadStudy() {
  try { return studyStore.load(); } catch { return null; }
}

export default function StudyScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [mode, setMode] = useState<'daily' | 'cards'>('daily');
  const [study, setStudy] = useState(loadStudy);
  const [day, setDay] = useState(() => dayKey());
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    const refresh = () => setDay(dayKey());
    refresh();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const timer = setInterval(refresh, 30_000);
    return () => { sub.remove(); clearInterval(timer); };
  }, []));

  function save(update: () => Study) {
    const current = dayKey();
    setError('');
    if (current !== day) { setDay(current); return false; }
    try {
      setStudy(update());
      return true;
    } catch {
      setError('Couldn’t save this answer. Try again.');
      return false;
    }
  }

  return <View style={[styles.screen, { paddingTop: top }]}>
  <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.header}>
        <Link href="/review" dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
            <Text style={styles.backLabel}>Review</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.headerTitle}>Practice room</Text>
        <Link href="/help" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link>
      </View>
      <View style={styles.tabs}>
        {(['daily', 'cards'] as const).map(tab => <Pressable key={tab} accessibilityRole="tab"
          accessibilityState={{ selected: mode === tab }} onPress={() => { setMode(tab); setError(''); }}
          style={({ pressed }) => [styles.tab, tab === mode && styles.primary, pressed && styles.pressed]}>
          <Text style={tab === mode ? styles.primaryLabel : styles.label}>{tab === 'daily' ? 'Daily Practice' : 'Flashcards'}</Text>
        </Pressable>)}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.warning}>{error}</Text> : null}
      {study ? (mode === 'daily' ? <DailyPractice study={study} day={day}
        onAnswer={(id, pick) => save(() => studyStore.saveDaily(day, id, pick))} /> :
        <Flashcards key={day} study={study} day={day} onGrade={(id, knew) => save(() => studyStore.gradeCard(id, knew, day))} />)
        : <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.body}>Couldn’t load saved practice.</Text>
          <Action label="Try again" onPress={() => setStudy(loadStudy())} />
        </View>}
    </View>
  </ScrollView>
  </View>;
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 48 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  help: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  tabs: { ...clay, padding: 5, gap: 6, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 24, backgroundColor: colors.card },
  tab: { flexGrow: 1, flexBasis: 130, minHeight: 52, padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  card: { ...clay, padding: 20, gap: 16, borderRadius: 28, backgroundColor: colors.card },
  kicker: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  heading: { color: colors.ink, fontSize: 23, fontWeight: '800', lineHeight: 31 },
  label: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  countPill: { ...clay, alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 24, backgroundColor: colors.mint },
  count: { color: colors.success, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  action: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.controlLine },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: 0.75 },
  option: { ...clay, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, borderWidth: 2, borderColor: colors.controlLine, backgroundColor: colors.card },
  optionText: { flex: 1, gap: 4 },
  selectedCorrect: { borderColor: colors.success, backgroundColor: colors.mint },
  selectedWrong: { borderColor: colors.attention, backgroundColor: colors.attentionSurface },
  correctLabel: { color: colors.success, fontSize: 14, lineHeight: 21 },
  wrongLabel: { color: colors.attention, fontSize: 14, lineHeight: 21 },
  correct: { backgroundColor: colors.mint },
  wrong: { backgroundColor: colors.attentionSurface },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22 },
  feedbackText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  feedbackTitle: { fontSize: 19, fontWeight: '800' },
  completion: { gap: 8, paddingVertical: 6 },
  completionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  progressSection: { gap: 8 },
  progressLabel: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  track: { height: 12, backgroundColor: colors.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.purple, borderRadius: 8 },
  stack: { marginBottom: 12 },
  backCardFar: { ...clay, position: 'absolute', top: 20, bottom: -12, left: 14, right: 14, borderRadius: 28, backgroundColor: colors.background },
  backCard: { ...clay, position: 'absolute', top: 10, bottom: -6, left: 7, right: 7, borderRadius: 28, backgroundColor: colors.background },
  flashcard: { ...clay, minHeight: 240, padding: 24, gap: 20, borderRadius: 28, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  term: { color: colors.purple, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  meaning: { width: '100%', gap: 12, borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 16 },
  meaningLabel: { color: colors.muted, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  definition: { color: colors.ink, fontSize: 19, fontWeight: '600', lineHeight: 29, textAlign: 'center' },
  recallTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  warning: { color: colors.ink, backgroundColor: colors.attentionSurface, fontSize: 16, lineHeight: 24, padding: 16, borderRadius: 20 },
});
