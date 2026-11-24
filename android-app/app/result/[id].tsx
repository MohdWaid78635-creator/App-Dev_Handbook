import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { useProgress } from '../../src/progress/provider';
import { createLearningResults } from '../../src/progress/results';
import { projectMilestones } from '../../src/projects/store';
import { colors } from '../../src/theme';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { progress } = useProgress();
  const index = missions.findIndex(mission => String(mission.id) === id);
  const mission = missions[index];
  const nextMission = missions[index + 1];
  const results = createLearningResults(missions, progress.quizResults);
  const result = mission && results.forMission(mission.quiz);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        {mission && result ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.mission}>{mission.lessonTitle}</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {result.mastered ? 'Mission mastered' : 'Knowledge check in progress'}
              </Text>
              <Text style={styles.points}>{result.xp} XP</Text>
              <Text style={styles.heroBody}>Earned in this mission · {results.totalXp} XP across all missions</Text>
            </View>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.heading}>Your results</Text>
              <Text style={styles.body}>{result.knowledgeCorrect} of {result.knowledgeTotal} knowledge questions correct</Text>
              <Text style={styles.body}>{result.bossCleared ? 'Boss challenge cleared' : 'Boss challenge pending'}</Text>
            </View>
            {!result.mastered ? (
              <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} replace asChild>
                <Pressable accessibilityRole="link" style={styles.primary}>
                  <Text style={styles.primaryLabel}>Continue knowledge check</Text>
                </Pressable>
              </Link>
            ) : nextMission ? (
              <Link href={{ pathname: '/mission/[id]', params: { id: String(nextMission.id) } }} replace asChild>
                <Pressable accessibilityRole="link" style={styles.primary}>
                  <Text style={styles.primaryLabel}>Next mission · {nextMission.lessonTitle}</Text>
                </Pressable>
              </Link>
            ) : null}
            <Link href={{ pathname: '/review', params: { missionId: String(mission.id) } }} asChild>
              <Pressable accessibilityRole="link" style={styles.secondary}>
                <Text style={styles.secondaryLabel}>Review this mission</Text>
              </Pressable>
            </Link>
            {result.mastered && projectMilestones.some(item => item.id === mission.id) ? (
              <Link href={{ pathname: '/project', params: { milestoneId: String(mission.id) } }} asChild>
                <Pressable accessibilityRole="link" style={styles.secondary}>
                  <Text style={styles.secondaryLabel}>Record project milestone</Text>
                </Pressable>
              </Link>
            ) : null}
          </>
        ) : <Text accessibilityRole="header" style={styles.heading}>Results unavailable</Text>}
        <Link href="/" dismissTo asChild>
          <Pressable accessibilityRole="link" style={result?.mastered && !nextMission ? styles.primary : styles.secondary}>
            <Text style={result?.mastered && !nextMission ? styles.primaryLabel : styles.secondaryLabel}>Return to mission map</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { gap: 8, padding: 22, borderRadius: 24, backgroundColor: colors.hero },
  mission: { color: colors.lavender, fontSize: 16, fontWeight: '700' },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  points: { color: colors.mint, fontSize: 42, fontWeight: '900' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  card: { gap: 8, padding: 16, borderRadius: 18, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  heading: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  primary: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  secondary: { minHeight: 48, padding: 13, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lavender },
  secondaryLabel: { color: colors.purple, fontSize: 16, fontWeight: '800' },
});
