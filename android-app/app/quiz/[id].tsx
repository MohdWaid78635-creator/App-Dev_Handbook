import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { useProgress } from '../../src/progress/provider';
import { colors } from '../../src/theme';

type Mission = typeof missions[number];

function Quiz({ mission }: { mission: Mission }) {
  const router = useRouter();
  const resultRoute = { pathname: '/result/[id]', params: { id: String(mission.id) } } as const;
  const { progress, recordQuizAnswer, saveError } = useProgress();
  const [index, setIndex] = useState(() => {
    const firstUnanswered = mission.quiz.findIndex(question => !progress.quizResults.some(
      result => result.id === question.id && result.firstCorrectAt !== null,
    ));
    return firstUnanswered < 0 ? mission.quiz.length : firstUnanswered;
  });
  const [selection, setSelection] = useState<number | null>(null);
  const question = mission.quiz[index];
  const correct = selection === question?.answer;

  function selectAnswer(option: number) {
    if (!question || selection !== null) return;
    if (recordQuizAnswer(question.id, option === question.answer)) setSelection(option);
  }

  return (
    <>
      {saveError ? <Text accessibilityRole="alert" style={styles.warning}>{saveError} Try the answer again to save it.</Text> : null}
      {!question ? (
        <View style={styles.complete}>
          <Text style={styles.kicker}>KNOWLEDGE CHECK COMPLETE</Text>
          <Text accessibilityRole="header" style={styles.title}>Boss challenge cleared</Text>
          <Text style={styles.body}>You answered both knowledge questions and the boss question correctly.</Text>
          <Link href={resultRoute} replace asChild>
            <Pressable accessibilityRole="link" style={styles.primary}><Text style={styles.primaryLabel}>View mission results</Text></Pressable>
          </Link>
          <Pressable accessibilityRole="button" style={styles.option}
            onPress={() => { setIndex(0); setSelection(null); }}>
            <Text style={styles.optionLabel}>Replay knowledge check</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, question.kind === 'boss' && styles.boss]}>
          <Text style={[styles.kicker, question.kind === 'boss' && styles.bossKicker]}>
            {question.kind === 'boss' ? 'BOSS CHALLENGE' : `QUESTION ${index + 1} OF 2`}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, question.kind === 'boss' && styles.bossTitle]}>{question.prompt}</Text>
          {question.options.map((option, optionIndex) => (
            <Pressable
              key={optionIndex}
              accessibilityRole="button"
              accessibilityState={{ disabled: selection !== null, selected: selection === optionIndex }}
              disabled={selection !== null}
              style={({ pressed }) => [
                styles.option, pressed && styles.pressed,
                selection === optionIndex && (correct ? styles.right : styles.wrong),
              ]}
              onPress={() => selectAnswer(optionIndex)}
            >
              <Text style={styles.optionLabel}>{option}</Text>
            </Pressable>
          ))}
          {selection !== null ? (
            <View style={[styles.feedback, correct ? styles.right : styles.wrong]}>
              <Text accessibilityLiveRegion="polite" style={styles.body}>
                <Text style={styles.strong}>{correct ? 'Correct. ' : 'Not quite. '}</Text>{question.explanation}
              </Text>
              <Pressable accessibilityRole="button" style={styles.primary} onPress={() => {
                if (correct && index + 1 === mission.quiz.length) {
                  router.replace(resultRoute);
                  return;
                }
                if (correct) setIndex(index + 1);
                setSelection(null);
              }}>
                <Text style={styles.primaryLabel}>
                  {correct ? (index + 1 === mission.quiz.length ? 'See results' : 'Next question') : 'Try again'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </>
  );
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const mission = missions.find(item => String(item.id) === id);
  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        {mission ? <>
          <Link href={{ pathname: '/mission/[id]', params: { id: String(mission.id) } }} dismissTo style={styles.back}>← Lesson</Link>
          <Text style={styles.meta}>{mission.lessonTitle}</Text>
          <Quiz key={mission.id} mission={mission} />
        </> : <>
          <Text accessibilityRole="header" style={styles.title}>Knowledge check unavailable</Text>
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
  meta: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  card: { gap: 12, padding: 16, borderRadius: 18, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  boss: { backgroundColor: colors.hero, borderColor: colors.hero },
  kicker: { color: colors.purple, fontSize: 13, letterSpacing: 1.2, fontWeight: '800' },
  bossKicker: { color: colors.mint },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  bossTitle: { color: colors.card },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  option: { minHeight: 48, padding: 13, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.card },
  optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  pressed: { backgroundColor: colors.lavender },
  right: { backgroundColor: colors.mint },
  wrong: { backgroundColor: '#fff0d4' },
  warning: { color: colors.ink, backgroundColor: '#fff0d4', padding: 12, borderRadius: 12 },
  feedback: { gap: 12, padding: 12, borderRadius: 12 },
  strong: { fontWeight: '800' },
  primary: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  complete: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.mint },
});
