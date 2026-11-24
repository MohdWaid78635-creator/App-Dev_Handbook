import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import glossary from '../src/generated/glossary.json';
import missions from '../src/generated/missions.json';
import { studyStore } from '../src/study/local';
import { dailyQuestion, dayKey, dueCards, studyStreak } from '../src/study/store';
import { colors } from '../src/theme';

const questions = missions.flatMap(mission => mission.quiz.filter(question => question.kind === 'question')
  .map(question => ({ ...question, missionId: mission.id, lessonTitle: mission.lessonTitle })));
type Study = ReturnType<typeof studyStore.load>;

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

function DailyPractice({ study, day, onAnswer }: { study: Study; day: string; onAnswer: (id: string, pick: number) => void }) {
  const answer = study.daily.find(item => item.day === day);
  const question = dailyQuestion(questions, day, answer);
  const streak = studyStreak(study.daily, day);
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.heading}>Today’s question</Text>
    <Text accessibilityLiveRegion="polite" style={styles.meta}>{streak} {streak === 1 ? 'day' : 'days'} in a row</Text>
    {question ? <>
      <Text style={styles.label}>{question.prompt}</Text>
      {question.options.map((option, index) => {
        const isCorrect = Boolean(answer) && question.answer === index;
        const selected = answer?.pick === index;
        return <Pressable key={index} accessibilityRole="button" accessibilityState={{ disabled: Boolean(answer), selected }}
          disabled={Boolean(answer)} onPress={() => onAnswer(question.id, index)}
          style={({ pressed }) => [styles.action, isCorrect && styles.correct, pressed && styles.pressed]}>
          <Text style={styles.label}>{option}</Text>
          {isCorrect ? <Text style={styles.meta}>Correct answer</Text> : selected ? <Text style={styles.meta}>Your answer</Text> : null}
        </Pressable>;
      })}
      {answer ? <>
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {answer.pick === question.answer ? 'Correct. ' : 'Not quite. '}{question.explanation}
        </Text>
        <Text style={styles.body}>Today’s practice is complete. Come back tomorrow for another question.</Text>
        <Link href={{ pathname: '/mission/[id]', params: { id: String(question.missionId) } }} style={styles.link}>
          Review {question.lessonTitle}
        </Link>
      </> : null}
    </> : <Text style={styles.body}>{answer ? 'Today’s practice is saved. A new question will be available tomorrow.' : 'No question is available yet.'}</Text>}
  </View>;
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

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.heading}>Glossary flashcards</Text>
    <Text accessibilityLiveRegion="polite" style={styles.meta}>{due.length} due · {learned} of {glossary.length} terms recalled on at least three reviews</Text>
    {card ? <>
      <Text style={styles.body}>Think of the meaning, then reveal it and grade your recall.</Text>
      <View style={styles.flashcard}>
        <Text accessibilityRole="header" style={styles.term}>{card.term}</Text>
        {showingMeaning ? <Text accessibilityLiveRegion="polite" style={styles.body}>{card.meaning}</Text> : null}
      </View>
      {showingMeaning ? <>
        <Action label="I knew it" onPress={() => grade(true)} primary />
        <Action label="Show again" onPress={() => grade(false)} />
      </> : <Action label="Reveal meaning" onPress={() => setRevealed(card.id)} primary />}
    </> : <Text style={styles.body}>You’re caught up. Cards will return when they’re due.</Text>}
  </View>;
}

function loadStudy() {
  try { return studyStore.load(); } catch { return null; }
}

export default function StudyScreen() {
  const { bottom } = useSafeAreaInsets();
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

  return <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Practice room</Text>
        <Text style={styles.heroBody}>Answer one question a day or practise recalling glossary terms.</Text>
      </View>
      <View style={styles.tabs}>
        {(['daily', 'cards'] as const).map(tab => <Pressable key={tab} accessibilityRole="tab"
          accessibilityState={{ selected: mode === tab }} onPress={() => { setMode(tab); setError(''); }}
          style={({ pressed }) => [styles.action, styles.tab, tab === mode && styles.correct, pressed && styles.pressed]}>
          <Text style={styles.label}>{tab === 'daily' ? 'Daily Practice' : 'Flashcards'}</Text>
        </Pressable>)}
      </View>
      {study ? (mode === 'daily' ? <DailyPractice study={study} day={day}
        onAnswer={(id, pick) => save(() => studyStore.saveDaily(day, id, pick))} /> :
        <Flashcards key={day} study={study} day={day} onGrade={(id, knew) => save(() => studyStore.gradeCard(id, knew, day))} />)
        : <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.body}>Couldn’t load saved practice.</Text>
          <Action label="Try again" onPress={() => setStudy(loadStudy())} />
        </View>}
      {error ? <Text accessibilityRole="alert" style={styles.feedback}>{error}</Text> : null}
      <Link href="/review" dismissTo style={styles.link}>Back to Review room</Link>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { padding: 20, borderRadius: 22, gap: 8, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  tabs: { gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
  tab: { flexGrow: 1 },
  card: { padding: 16, gap: 10, borderColor: colors.line, borderWidth: 1, borderRadius: 18, backgroundColor: colors.card },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  action: { minHeight: 48, padding: 12, justifyContent: 'center', gap: 4, borderRadius: 12, backgroundColor: colors.lavender },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  correct: { backgroundColor: colors.mint },
  feedback: { padding: 12, borderRadius: 12, backgroundColor: colors.lavender, color: colors.ink, fontSize: 16, lineHeight: 23 },
  flashcard: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: colors.background },
  term: { color: colors.purple, fontSize: 24, fontWeight: '900' },
  link: { minHeight: 48, color: colors.purple, fontSize: 16, fontWeight: '800', textAlignVertical: 'center' },
});
