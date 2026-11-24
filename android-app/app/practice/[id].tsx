import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { appendChoice, evaluateOrder, shuffledIndices, submitMatch } from '../../src/practice/game';
import { colors } from '../../src/theme';

type Mission = typeof missions[number];
type Exercise = Mission['practice'][number];

function Action({ label, onPress, primary = false, disabled = false }: {
  label: string;
  onPress(): void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, primary && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.actionLabel, primary && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

function Feedback({ message, correct }: { message: string; correct: boolean }) {
  if (!message) return null;
  return (
    <View style={[styles.feedback, correct ? styles.correct : styles.incorrect]}>
      <Text accessibilityLiveRegion="polite" style={styles.body}>
        <Text style={styles.strong}>{correct ? 'Correct. ' : 'Try again. '}</Text>{message}
      </Text>
    </View>
  );
}

function MatchGame({ exercise }: { exercise: Exercise }) {
  const [attempt, setAttempt] = useState({ index: 0, message: '', correct: false });
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
        message: result.correct ? 'Choose a match for the next pair.' : 'This pair stays open. Pick a different answer.',
      };
    });
  }

  return (
    <View style={styles.group}>
      {pair ? <>
        <Text style={styles.meta}>Pair {attempt.index + 1} of {exercise.pairs.length}</Text>
        <View style={styles.prompt}><Text accessibilityRole="header" style={styles.itemTitle}>{pair[0]}</Text></View>
        {options.map(option => <Action key={option} label={option} onPress={() => select(option)} />)}
      </> : <Text accessibilityRole="header" style={styles.section}>All pairs matched</Text>}
      <Feedback message={done ? exercise.why : attempt.message} correct={done || attempt.correct} />
      {done ? <Action label="Play again" onPress={() => setAttempt({ index: 0, message: '', correct: false })} /> : null}
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
        <Action label="Previous exercise" disabled={index === 0} onPress={() => setIndex(current => Math.max(0, current - 1))} />
        <Action label="Next exercise" disabled={index + 1 === mission.practice.length}
          onPress={() => setIndex(current => Math.min(mission.practice.length - 1, current + 1))} />
      </View> : null}
      <View style={styles.card} key={exercise.id}>
        <Text style={styles.meta}>{exercise.type === 'match' ? 'MATCH THE PAIRS' : 'PUT IT IN ORDER'}</Text>
        <Text accessibilityRole="header" style={styles.section}>{exercise.question}</Text>
        {exercise.type === 'match' ? <MatchGame exercise={exercise} /> : <OrderGame exercise={exercise} />}
      </View>
      <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} replace asChild>
        <Pressable accessibilityRole="button" style={[styles.action, styles.primary]}>
          <Text style={[styles.actionLabel, styles.primaryLabel]}>Go to knowledge check</Text>
        </Pressable>
      </Link>
    </>
  );
}

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const mission = missions.find(item => String(item.id) === id);
  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        {mission ? <>
          <Link href={{ pathname: '/mission/[id]', params: { id: String(mission.id) } }} dismissTo style={styles.back}>← Lesson</Link>
          <PracticeContent key={mission.id} mission={mission} />
        </> : <>
          <Text accessibilityRole="header" style={styles.heading}>Practice unavailable</Text>
          <Link href="/" dismissTo style={styles.back}>← Mission map</Link>
        </>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  back: { alignSelf: 'flex-start', minHeight: 48, color: colors.purple, fontSize: 16, textAlignVertical: 'center' },
  heading: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  section: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.purple, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  group: { gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 12, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  prompt: { gap: 5, padding: 13, borderRadius: 12, backgroundColor: colors.lavender },
  itemTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  action: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' },
  actionLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  primaryLabel: { color: colors.card },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
  feedback: { padding: 12, borderRadius: 12 },
  correct: { backgroundColor: colors.mint },
  incorrect: { backgroundColor: '#fff0d4' },
  strong: { fontWeight: '800' },
});
