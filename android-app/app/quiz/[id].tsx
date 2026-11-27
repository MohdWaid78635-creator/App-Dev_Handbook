import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Link } from '../../src/components/Link';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { useProgress } from '../../src/progress/provider';
import { homeColors as colors } from '../../src/theme';

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
  const knowledgeCount = mission.quiz.filter(item => item.kind !== 'boss').length;

  function selectAnswer(option: number) {
    if (!question || selection !== null) return;
    if (recordQuizAnswer(question.id, option === question.answer)) setSelection(option);
  }

  return (
    <>
      <Text style={styles.meta}>{mission.lessonTitle.toUpperCase()}</Text>
      <Text accessibilityRole="header" style={styles.heading}>Show what you know</Text>
      <Text style={styles.subtitle}>{knowledgeCount} questions, then a boss challenge.</Text>
      <View style={styles.steps}>
        {mission.quiz.map((step, stepIndex) => {
          const completed = stepIndex < index || (stepIndex === index && correct);
          const current = stepIndex === index;
          const label = step.kind === 'boss' ? 'Boss' : `Question ${stepIndex + 1}`;
          return (
            <View key={step.id} style={styles.step} accessible
              accessibilityLabel={`${label}: ${completed ? 'complete' : current ? 'current' : 'upcoming'}`}>
              {stepIndex + 1 < mission.quiz.length ? <View style={styles.connector} importantForAccessibility="no" /> : null}
              <View style={[styles.stepCircle, completed && styles.completedStep, current && !completed && styles.currentStep]}>
                {completed ? <Ionicons name="checkmark" size={24} color={colors.success} importantForAccessibility="no" />
                  : current ? <View style={styles.currentDot} /> : null}
              </View>
              <Text style={styles.stepLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
      {saveError ? <Text accessibilityRole="alert" style={styles.warning}>{saveError} Try the answer again to save it.</Text> : null}
      {!question ? (
        <View style={styles.complete}>
          <Text style={styles.kicker}>KNOWLEDGE CHECK COMPLETE</Text>
          <Text accessibilityRole="header" style={styles.title}>Boss challenge cleared</Text>
          <Text style={styles.body}>You answered all knowledge questions and the boss challenge correctly.</Text>
          <Link href={resultRoute} replace asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryLabel}>View mission results</Text></Pressable>
          </Link>
          <Pressable accessibilityRole="button" style={styles.option}
            onPress={() => { setIndex(0); setSelection(null); }}>
            <Text style={styles.optionLabel}>Replay knowledge check</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.kicker}>
            {question.kind === 'boss' ? 'BOSS CHALLENGE' : `QUESTION ${index + 1} OF ${knowledgeCount}`}
          </Text>
          <Text accessibilityRole="header" style={styles.title}>{question.prompt}</Text>
          {question.options.map((option, optionIndex) => (
            <Pressable
              key={optionIndex}
              accessibilityRole="button"
              accessibilityState={{ disabled: selection !== null, selected: selection === optionIndex }}
              accessibilityLabel={selection === optionIndex ? `${option}. ${correct ? 'Correct' : 'Not quite'}.` : option}
              disabled={selection !== null}
              style={({ pressed }) => [
                styles.option, pressed && styles.pressed,
                selection === optionIndex && (correct ? styles.selectedRight : styles.selectedWrong),
              ]}
              onPress={() => selectAnswer(optionIndex)}
            >
              <Text style={styles.optionLabel}>{option}</Text>
              <Ionicons name={selection === optionIndex ? correct ? 'checkmark-circle-outline' : 'close-circle-outline' : 'ellipse-outline'}
                size={24} color={selection === optionIndex ? correct ? colors.success : colors.attention : colors.muted} importantForAccessibility="no" />
            </Pressable>
          ))}
          {selection !== null ? (
            <>
              <View style={[styles.feedback, correct ? styles.right : styles.wrong]}>
                <Ionicons name={correct ? 'checkmark-circle-outline' : 'sync-outline'} size={28}
                  color={correct ? colors.success : colors.attention} importantForAccessibility="no" />
                <Text accessibilityLiveRegion="polite" style={styles.feedbackText}>
                  <Text style={styles.feedbackTitle}>{correct ? 'Correct' : 'Not quite'}{'\n'}</Text>{question.explanation}
                </Text>
              </View>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={() => {
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
                <Ionicons name={correct ? 'arrow-forward' : 'refresh-outline'} size={22} color={colors.white} importantForAccessibility="no" />
              </Pressable>
            </>
          ) : null}
        </View>
      )}
      {!saveError ? <View style={styles.saveNotice}>
        <Ionicons name="checkmark-circle-outline" size={22} color={colors.muted} importantForAccessibility="no" />
        <Text style={styles.saveText}>Your answers are saved as you go.</Text>
      </View> : null}
      <Text style={styles.footnote}>Correct answers earn XP once.</Text>
    </>
  );
}

export default function QuizScreen() {
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
              <Text style={styles.backLabel}>{mission ? 'Lesson' : 'Missions'}</Text>
            </Pressable>
          </Link>
          <Text accessibilityRole="header" style={styles.headerTitle}>Knowledge check</Text>
          <Link href={{ pathname: '/help', params: mission ? { missionId: String(mission.id) } : {} }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help with this mission" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        {mission ? <>
          <Quiz key={mission.id} mission={mission} />
        </> : <>
          <Text accessibilityRole="header" style={styles.title}>Knowledge check unavailable</Text>
          <Link href="/missions" dismissTo style={styles.backLabel}>Return to Mission Map</Link>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48, paddingRight: 4 },
  backLabel: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  steps: { flexDirection: 'row', paddingVertical: 8 },
  step: { flex: 1, alignItems: 'center', gap: 8 },
  connector: { position: 'absolute', left: '50%', width: '100%', height: 2, top: 22, backgroundColor: colors.controlLine },
  stepCircle: { width: 44, height: 44, borderRadius: 24, borderWidth: 2, borderColor: colors.controlLine, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  completedStep: { backgroundColor: colors.mint, borderColor: colors.success },
  currentStep: { borderColor: colors.purple },
  currentDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.purple },
  stepLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  card: { ...clay, gap: 16, padding: 20, borderRadius: 28, backgroundColor: colors.card },
  kicker: { color: colors.muted, fontSize: 13, letterSpacing: 0.6, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 23, fontWeight: '900', lineHeight: 31 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  option: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    borderWidth: 2, borderColor: colors.controlLine, borderRadius: 20, backgroundColor: colors.card },
  optionLabel: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  pressed: { opacity: 0.75 },
  right: { backgroundColor: colors.mint },
  wrong: { backgroundColor: colors.attentionSurface },
  selectedRight: { backgroundColor: colors.mint, borderColor: colors.success },
  selectedWrong: { backgroundColor: colors.attentionSurface, borderColor: colors.attention },
  warning: { color: colors.ink, backgroundColor: colors.attentionSurface, padding: 16, borderRadius: 20, fontSize: 16, lineHeight: 24 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22 },
  feedbackText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  feedbackTitle: { fontSize: 19, fontWeight: '800' },
  primary: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  complete: { ...clay, gap: 16, padding: 20, borderRadius: 28, backgroundColor: colors.mint },
  saveNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 4 },
  saveText: { flexShrink: 1, color: colors.muted, fontSize: 14, lineHeight: 21 },
  footnote: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
