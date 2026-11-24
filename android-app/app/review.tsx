import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../src/generated/missions.json';
import { useProgress } from '../src/progress/provider';
import { getReviewQueue } from '../src/progress/store';
import { colors } from '../src/theme';

type Question = typeof missions[number]['quiz'][number];

function ReviewQuestion({ question, lessonTitle, onCorrect }: {
  question: Question;
  lessonTitle: string;
  onCorrect: () => void;
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const correct = selection === question.answer;

  return (
    <View style={styles.card}>
      <Text style={styles.meta}>{lessonTitle}{question.kind === 'boss' ? ' · Boss challenge' : ''}</Text>
      <Text accessibilityRole="header" style={styles.heading}>{question.prompt}</Text>
      {question.options.map((option, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityState={{ disabled: selection !== null, selected: selection === index }}
          disabled={selection !== null}
          onPress={() => setSelection(previous => previous ?? index)}
          style={({ pressed }) => [styles.option, pressed && styles.pressed,
            selection === index && (correct ? styles.correct : styles.tryAgain)]}
        >
          <Text style={styles.optionLabel}>{option}</Text>
        </Pressable>
      ))}
      {selection !== null ? (
        <View style={[styles.feedback, correct ? styles.correct : styles.tryAgain]}>
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            <Text style={styles.emphasis}>{correct ? 'Correct. ' : 'Try again. '}</Text>{question.explanation}
          </Text>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            onPress={correct ? onCorrect : () => setSelection(null)}>
            <Text style={styles.actionLabel}>{correct ? 'Continue' : 'Try again'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function ReviewScreen() {
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const { bottom } = useSafeAreaInsets();
  const { progress, saveError, recordReviewSuccess } = useProgress();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const scopedMissions = missionId === undefined ? missions : missions.filter(mission => String(mission.id) === missionId);
  const queue = getReviewQueue(scopedMissions, progress.quizResults);
  const current = queue[0];
  const returnRoute = missionId !== undefined && scopedMissions.length > 0
    ? { pathname: '/result/[id]', params: { id: missionId } } as const
    : '/';

  return (
    <ScrollView ref={scroll} contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>
            {missionId !== undefined && scopedMissions.length === 0 ? 'Mission unavailable' : 'Review room'}
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.count}>
            {current ? `${queue.length} ${queue.length === 1 ? 'question' : 'questions'} ready` : 'No questions due'}
          </Text>
          {scopedMissions.length > 0 ? <Text style={styles.heroBody}>
            {current ? 'Try the question again, then read the explanation.' : 'Misses appear here right away. Correct answers come back after 24 hours.'}
          </Text> : null}
        </View>
        {missionId === undefined ? <Link href="/study" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <Text style={styles.optionLabel}>Daily Practice and Flashcards</Text>
          </Pressable>
        </Link> : null}
        {saveError ? <Text accessibilityRole="alert" style={[styles.body, styles.feedback, styles.tryAgain]}>{saveError}</Text> : null}
        {current ? <ReviewQuestion key={current.question.id} question={current.question} lessonTitle={current.lessonTitle}
          onCorrect={() => {
            if (recordReviewSuccess(current.question.id)) scroll.current?.scrollTo({ y: 0, animated: false });
          }} /> : null}
        <Link href={returnRoute} dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [current ? styles.option : styles.action,
            pressed && (current ? styles.pressed : styles.actionPressed)]}>
            <Text style={current ? styles.optionLabel : styles.actionLabel}>
              {returnRoute === '/' ? 'Return to mission map' : 'Return to mission results'}
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { gap: 8, padding: 20, borderRadius: 22, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  count: { color: colors.mint, fontSize: 20, fontWeight: '800' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  card: { gap: 10, padding: 16, borderRadius: 18, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  meta: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  option: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  pressed: { backgroundColor: colors.lavender },
  correct: { backgroundColor: colors.mint },
  tryAgain: { backgroundColor: colors.lavender },
  feedback: { gap: 10, padding: 12, borderRadius: 12 },
  emphasis: { fontWeight: '800' },
  action: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.purple },
  actionPressed: { backgroundColor: colors.hero },
  actionLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
});
