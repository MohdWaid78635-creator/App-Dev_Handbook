import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { Link } from '../src/components/Link';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../src/generated/missions.json';
import { useProgress } from '../src/progress/provider';
import { getReviewQueue } from '../src/progress/store';
import { homeColors as colors } from '../src/theme';
import { WorkshopNavigation } from '../src/components/WorkshopNavigation';

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
          accessibilityLabel={selection === index ? `${option}. ${correct ? 'Correct' : 'Try again'}.` : option}
          disabled={selection !== null}
          onPress={() => setSelection(previous => previous ?? index)}
          style={({ pressed }) => [styles.option, pressed && styles.pressed,
            selection === index && (correct ? styles.selectedCorrect : styles.selectedRetry)]}
        >
          <Text style={styles.optionLabel}>{option}</Text>
          <Ionicons name={selection === index ? correct ? 'checkmark-circle-outline' : 'close-circle-outline' : 'ellipse-outline'}
            size={24} color={selection === index ? correct ? colors.success : colors.attention : colors.muted} importantForAccessibility="no" />
        </Pressable>
      ))}
      {selection !== null ? (
        <>
          <View style={[styles.feedback, correct ? styles.correct : styles.tryAgain]}>
            <Ionicons name={correct ? 'checkmark-circle-outline' : 'sync-outline'} size={28}
              color={correct ? colors.success : colors.attention} importantForAccessibility="no" />
            <Text accessibilityLiveRegion="polite" style={styles.feedbackText}>
              <Text style={styles.emphasis}>{correct ? 'Correct' : 'Try again'}{'\n'}</Text>{question.explanation}
            </Text>
          </View>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            onPress={correct ? onCorrect : () => setSelection(null)}>
            <Text style={styles.actionLabel}>{correct ? 'Continue' : 'Try again'}</Text>
            <Ionicons name={correct ? 'arrow-forward' : 'refresh-outline'} size={22} color={colors.white} importantForAccessibility="no" />
          </Pressable>
        </>
      ) : <Text style={styles.hint}>Tap an answer to see the explanation.</Text>}
    </View>
  );
}

export default function ReviewScreen() {
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { progress, saveError, recordReviewSuccess } = useProgress();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const scopedMissions = missionId === undefined ? missions : missions.filter(mission => String(mission.id) === missionId);
  const queue = getReviewQueue(scopedMissions, progress.quizResults);
  const current = queue[0];
  const returnRoute = missionId !== undefined && scopedMissions.length > 0
    ? { pathname: '/result/[id]', params: { id: missionId } } as const
    : '/missions';

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
    <ScrollView ref={scroll} contentContainerStyle={[styles.scroll, { paddingBottom: missionId === undefined ? 16 : Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          {missionId === undefined ? <View style={styles.brand}>
            <Image source={require('../assets/clay-mark.png')} style={styles.logo} accessible={false} />
            <Text style={styles.wordmark}>BuildWisp</Text>
          </View> : <Link href={returnRoute} dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
              <Text style={styles.backLabel}>{returnRoute === '/missions' ? 'Missions' : 'Results'}</Text>
            </Pressable>
          </Link>}
          <Link href={{ pathname: '/help', params: scopedMissions.length === 1 ? { missionId: String(scopedMissions[0].id) } : {} }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>
            {missionId !== undefined && scopedMissions.length === 0 ? 'Mission unavailable' : 'Keep what you’ve learned'}
          </Text>
          {scopedMissions.length > 0 ? <Text style={styles.heroBody}>
            {missionId === undefined ? 'A little review helps it stick.' : scopedMissions[0].lessonTitle}
          </Text> : null}
        </View>
        {scopedMissions.length > 0 ? <View style={styles.countRow}>
          <View style={styles.countPill}>
            <Ionicons name="sync-outline" size={23} color={colors.ink} importantForAccessibility="no" />
            <Text accessibilityLiveRegion="polite" style={styles.count}>
              {current ? `${queue.length} ${queue.length === 1 ? 'question' : 'questions'} ready` : 'No questions due'}
            </Text>
          </View>
          {current ? <Text style={styles.meta}>Missed and due questions</Text> : null}
        </View> : null}
        {saveError ? <Text accessibilityRole="alert" style={styles.warning}>{saveError}</Text> : null}
        {current ? <ReviewQuestion key={current.question.id} question={current.question} lessonTitle={current.lessonTitle}
          onCorrect={() => {
            if (recordReviewSuccess(current.question.id)) scroll.current?.scrollTo({ y: 0, animated: false });
          }} /> : null}
        {!current && scopedMissions.length > 0 ? <View style={[styles.card, styles.correct]}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} importantForAccessibility="no" />
          <Text accessibilityRole="header" style={styles.heading}>You’re caught up</Text>
          <Text style={styles.body}>Misses appear here right away. Correct answers come back after 24 hours.</Text>
        </View> : null}
        {missionId === undefined ? <Link href="/study" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.study, pressed && styles.pressed]}>
            <Ionicons name="calendar-outline" size={30} color={colors.ink} importantForAccessibility="no" />
            <View style={styles.studyText}>
              <Text style={styles.studyTitle}>Daily Practice & Flashcards</Text>
              <Text style={styles.studyBody}>One daily question, plus glossary review</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.ink} importantForAccessibility="no" />
          </Pressable>
        </Link> : null}
        {scopedMissions.length > 0 ? <View style={styles.notes}>
          <Text style={styles.hint}>Correct answers return after 24 hours.</Text>
          <Text style={styles.hint}>Known answers do not earn extra XP.</Text>
        </View> : null}
        {missionId !== undefined || !current ? <Link href={returnRoute} dismissTo asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [current ? styles.option : styles.action,
            pressed && (current ? styles.pressed : styles.actionPressed)]}>
            <Text style={current ? styles.optionLabel : styles.actionLabel}>
              {returnRoute === '/missions' ? 'Return to Mission Map' : 'Return to mission results'}
            </Text>
          </Pressable>
        </Link> : null}
      </View>
    </ScrollView>
    {missionId === undefined ? <WorkshopNavigation selected="Review" /> : null}
    </View>
  );
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 52, height: 60, resizeMode: 'contain' },
  wordmark: { color: colors.ink, fontSize: 25, fontWeight: '900', flexShrink: 1, letterSpacing: -1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: 8, paddingTop: 6 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  countPill: { ...clay, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.mint, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, maxWidth: '100%' },
  count: { color: colors.ink, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  heroBody: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  card: { ...clay, gap: 16, padding: 20, borderRadius: 28, backgroundColor: colors.card },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  heading: { color: colors.ink, fontSize: 23, fontWeight: '800', lineHeight: 31 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  option: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    borderRadius: 20, borderWidth: 2, borderColor: colors.controlLine, backgroundColor: colors.card },
  optionLabel: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  pressed: { opacity: 0.75 },
  correct: { backgroundColor: colors.mint },
  tryAgain: { backgroundColor: colors.attentionSurface },
  selectedCorrect: { backgroundColor: colors.mint, borderColor: colors.success },
  selectedRetry: { backgroundColor: colors.attentionSurface, borderColor: colors.attention },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22 },
  feedbackText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 23 },
  emphasis: { fontWeight: '800', fontSize: 19 },
  action: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 22, backgroundColor: colors.purple },
  actionPressed: { opacity: 0.75 },
  actionLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  study: { ...clay, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 24, backgroundColor: colors.mint },
  studyText: { flex: 1, gap: 4 },
  studyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  studyBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  notes: { gap: 4 },
  warning: { color: colors.ink, fontSize: 16, lineHeight: 24, padding: 16, borderRadius: 20, backgroundColor: colors.attentionSurface },
});
