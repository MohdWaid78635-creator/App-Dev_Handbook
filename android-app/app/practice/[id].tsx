import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { appendChoice, evaluateOrder, shuffledIndices, submitMatch } from '../../src/practice/game';
import { homeColors as colors } from '../../src/theme';

type Mission = typeof missions[number];
type Exercise = Mission['practice'][number];

function Action({ label, onPress, primary = false, disabled = false, choice = false, retry = false }: {
  label: string;
  onPress(): void;
  primary?: boolean;
  disabled?: boolean;
  choice?: boolean;
  retry?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={retry ? `${label}. Incorrect. Choose another answer.` : label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, primary && styles.primary, retry && styles.retryChoice, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.actionLabel, primary && styles.primaryLabel]}>{label}</Text>
      {choice ? <Ionicons name={retry ? 'close-circle-outline' : 'ellipse-outline'} size={24}
        color={retry ? colors.attention : colors.muted} importantForAccessibility="no" /> : null}
    </Pressable>
  );
}

function Feedback({ message, correct }: { message: string; correct: boolean }) {
  if (!message) return null;
  return (
    <View style={[styles.feedback, correct ? styles.correct : styles.incorrect]}>
      <Ionicons name={correct ? 'checkmark-circle-outline' : 'sync-outline'} size={28}
        color={correct ? colors.ink : colors.attention} importantForAccessibility="no" />
      <Text accessibilityLiveRegion="polite" style={styles.feedbackText}>
        <Text style={styles.feedbackTitle}>{correct ? 'Correct' : 'Try again'}{'\n'}</Text>{message}
      </Text>
    </View>
  );
}

function MatchGame({ exercise }: { exercise: Exercise }) {
  const [attempt, setAttempt] = useState({ index: 0, message: '', correct: false, retryChoice: '' });
  const [options] = useState(() => {
    const unique = [...new Set(exercise.pairs.map(([, right]) => right))];
    return shuffledIndices(unique.length).map(index => unique[index]);
  });
  const pair = exercise.pairs[attempt.index];
  const done = !pair;

  function select(choice: string) {
    setAttempt(current => {
      if (current.index !== attempt.index) return current;
      const result = submitMatch(exercise.pairs.map(([, right]) => right), current.index, choice);
      return {
        index: result.next,
        correct: result.correct,
        retryChoice: result.correct ? '' : choice,
        message: result.correct ? 'Choose a match for the next pair.' : 'This pair stays open. Pick a different answer.',
      };
    });
  }

  return (
    <View style={styles.group}>
      {pair ? <Text style={styles.meta}>Pair {attempt.index + 1} of {exercise.pairs.length}</Text> : null}
      <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Pairs matched"
        accessibilityValue={{ min: 0, max: exercise.pairs.length, now: attempt.index }}>
        <View style={[styles.fill, { width: `${exercise.pairs.length ? attempt.index / exercise.pairs.length * 100 : 0}%` }]} />
      </View>
      {pair ? <>
        <View style={styles.prompt}><Text accessibilityRole="header" style={styles.itemTitle}>{pair[0]}</Text></View>
        <Text style={styles.body}>Choose the matching answer</Text>
        {options.map(option => <Action key={option} label={option} choice retry={attempt.retryChoice === option} onPress={() => select(option)} />)}
      </> : <Text accessibilityRole="header" style={styles.section}>All pairs matched</Text>}
      <Feedback message={done ? exercise.why : attempt.message} correct={done || attempt.correct} />
      {done ? <Action label="Play again" onPress={() => setAttempt({ index: 0, message: '', correct: false, retryChoice: '' })} /> : null}
    </View>
  );
}

function OrderGame({ exercise }: { exercise: Exercise }) {
  const [choices, setChoices] = useState(() => shuffledIndices(exercise.items.length));
  const [order, setOrder] = useState<readonly number[]>([]);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const done = result === 'correct';

  function reset() {
    setOrder([]);
    setResult(null);
    setChoices(shuffledIndices(exercise.items.length));
  }

  return (
    <View style={styles.group}>
      <Text style={styles.body}>Tap items in the order you think they belong.</Text>
      <Text style={styles.meta}>{order.length} of {exercise.items.length} steps placed</Text>
      <Text accessibilityRole="header" style={styles.section}>Your order</Text>
      <View style={styles.prompt}>
        {order.length > 0 ? order.map((value, index) => (
          <Text key={value} style={styles.body}><Text style={styles.strong}>{index + 1}. </Text>{exercise.items[value]}</Text>
        )) : <Text style={styles.body}>Your choices appear here.</Text>}
      </View>
      {!done ? <>
        {choices.filter(value => !order.includes(value)).map(value => (
          <Action key={value} label={exercise.items[value]} onPress={() => {
            setOrder(previous => appendChoice(previous, value, exercise.items.length));
            setResult(null);
          }} />
        ))}
        <View style={styles.actions}>
          <Action label="Undo last" disabled={order.length === 0} onPress={() => {
            setOrder(previous => previous.slice(0, -1));
            setResult(null);
          }} />
          <Action label="Check order" primary disabled={order.length !== exercise.items.length} onPress={() => {
            const outcome = evaluateOrder(order, exercise.items.length);
            if (outcome !== 'incomplete') setResult(outcome);
          }} />
        </View>
      </> : <Text accessibilityRole="header" style={styles.section}>Order complete</Text>}
      {result ? <Feedback correct={done} message={done ? exercise.why : 'That order needs another look. Undo a choice or start over.'} /> : null}
      {result ? <Action label={done ? 'Play again' : 'Start over'} onPress={reset} /> : null}
    </View>
  );
}

function PracticeContent({ mission }: { mission: Mission }) {
  const [index, setIndex] = useState(0);
  const exercise = mission.practice[index];
  return (
    <>
      <Text style={styles.meta}>EXERCISE {index + 1} OF {mission.practice.length}</Text>
      <Text accessibilityRole="header" style={styles.heading}>{mission.lessonTitle}</Text>
      {mission.practice.length > 1 ? <View style={styles.actions}>
        <Action label="Previous" disabled={index === 0} onPress={() => setIndex(current => Math.max(0, current - 1))} />
        <Action label="Next exercise" disabled={index + 1 === mission.practice.length}
          onPress={() => setIndex(current => Math.min(mission.practice.length - 1, current + 1))} />
      </View> : null}
      <View style={styles.card} key={exercise.id}>
        <Text style={styles.meta}>{exercise.type === 'match' ? 'MATCH THE PAIRS' : 'PUT IT IN ORDER'}</Text>
        <Text accessibilityRole="header" style={styles.section}>{exercise.question}</Text>
        {exercise.type === 'match' ? <MatchGame exercise={exercise} /> : <OrderGame exercise={exercise} />}
      </View>
      <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} replace asChild>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.quizLink, pressed && styles.pressed]}>
          <Text style={styles.quizText}>Go to knowledge check</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
      </Link>
      <Text style={styles.footnote}>Practise freely. XP comes from knowledge checks.</Text>
    </>
  );
}

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const mission = missions.find(item => String(item.id) === id);
  return (
    <View style={[styles.screen, { paddingTop: top }]}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Link href={mission ? { pathname: '/mission/[id]', params: { id: String(mission.id) } } : '/missions'} dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
              <Text style={styles.backText}>{mission ? 'Lesson' : 'Missions'}</Text>
            </Pressable>
          </Link>
          <Text accessibilityRole="header" style={styles.headerTitle}>Practice</Text>
          <Link href={{ pathname: '/help', params: mission ? { missionId: String(mission.id) } : {} }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help with this mission" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        {mission ? <>
          <PracticeContent key={mission.id} mission={mission} />
        </> : <>
          <Text accessibilityRole="header" style={styles.heading}>Practice unavailable</Text>
          <Link href="/missions" dismissTo style={styles.quizText}>Return to Mission Map</Link>
        </>}
      </View>
    </ScrollView>
    </View>
  );
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 16 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  backText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center' },
  help: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  section: { color: colors.ink, fontSize: 21, fontWeight: '800', lineHeight: 29 },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  group: { gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: { ...clay, gap: 16, borderRadius: 28, padding: 20, backgroundColor: colors.card },
  prompt: { ...clay, gap: 8, padding: 18, minHeight: 76, borderRadius: 22, backgroundColor: colors.background, justifyContent: 'center' },
  itemTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  track: { height: 10, backgroundColor: colors.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.purple, borderRadius: 8 },
  action: { ...clay, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.controlLine,
    backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, maxWidth: '100%' },
  actionLabel: { color: colors.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  primaryLabel: { color: colors.white },
  retryChoice: { backgroundColor: colors.attentionSurface, borderColor: colors.attention, borderWidth: 2 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  feedback: { padding: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedbackText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  feedbackTitle: { fontSize: 19, fontWeight: '800' },
  correct: { backgroundColor: colors.mint },
  incorrect: { backgroundColor: colors.attentionSurface },
  strong: { fontWeight: '800', color: colors.ink },
  quizLink: { minHeight: 48, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  quizText: { color: colors.purple, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  footnote: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
