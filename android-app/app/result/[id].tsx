import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { Link } from '../../src/components/Link';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { useProgress } from '../../src/progress/provider';
import { createLearningResults } from '../../src/progress/results';
import { projectMilestones } from '../../src/projects/store';
import { homeColors as c } from '../../src/theme';

function ResultRow({ label, complete }: { label: string; complete: boolean }) {
  return (
    <View style={[s.resultRow, complete && s.resultComplete]}>
      <Ionicons name={complete ? 'checkmark-circle-outline' : 'ellipse-outline'} size={27}
        color={complete ? c.success : c.muted} importantForAccessibility="no" />
      <Text style={s.resultText}>{label}</Text>
    </View>
  );
}

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { progress } = useProgress();
  const index = missions.findIndex(mission => String(mission.id) === id);
  const mission = missions[index];
  const nextMission = missions[index + 1];
  const results = createLearningResults(missions, progress.quizResults);
  const result = mission && results.forMission(mission.quiz);
  const masteredCount = missions.filter(item => results.forMission(item.quiz).mastered).length;

  return (
    <View style={[s.screen, { paddingTop: top }]}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
        <View style={s.column}>
          <View style={s.header}>
            <Link href={mission ? { pathname: '/mission/[id]', params: { id: String(mission.id) } } : '/missions'} dismissTo asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [s.back, pressed && s.pressed]}>
                <Ionicons name="arrow-back" size={25} color={c.ink} importantForAccessibility="no" />
                <Text style={s.backLabel}>{mission ? 'Lesson' : 'Missions'}</Text>
              </Pressable>
            </Link>
            <Text accessibilityRole="header" style={s.headerTitle}>Results</Text>
            <Link href={{ pathname: '/help', params: mission ? { missionId: String(mission.id) } : {} }} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Help with this mission" style={({ pressed }) => [s.help, pressed && s.pressed]}>
                <Ionicons name="help-circle-outline" size={29} color={c.ink} importantForAccessibility="no" />
              </Pressable>
            </Link>
          </View>
          {mission && result ? <>
            <View style={s.hero}>
              {result.mastered ? <Image source={require('../../assets/clay-trophy.png')} style={s.trophy} accessible={false} />
                : <Ionicons name="school-outline" size={60} color={c.purple} importantForAccessibility="no" />}
              <Text accessibilityRole="header" style={s.title}>{result.mastered ? 'Mission mastered' : 'Knowledge check in progress'}</Text>
              <Text style={s.mission}>{mission.lessonTitle}</Text>
              <View style={s.xpPill}><Text style={s.points}>{result.xp} XP</Text></View>
              <Text style={s.caption}>Earned in this mission</Text>
            </View>
            <View style={s.card}>
              <ResultRow complete={result.knowledgeCorrect === result.knowledgeTotal}
                label={`${result.knowledgeCorrect} of ${result.knowledgeTotal} knowledge questions correct`} />
              <ResultRow complete={result.bossCleared} label={result.bossCleared ? 'Boss challenge cleared' : 'Boss challenge pending'} />
              <Text style={s.total}>{results.totalXp} XP across all missions</Text>
            </View>
            <View style={s.progressSection}>
              <Text style={s.progressLabel}>{masteredCount} of {missions.length} missions mastered</Text>
              <View style={s.track} accessibilityRole="progressbar" accessibilityLabel="Missions mastered"
                accessibilityValue={{ min: 0, max: missions.length, now: masteredCount }}>
                <View style={[s.fill, { width: `${missions.length ? masteredCount / missions.length * 100 : 0}%` }]} />
              </View>
            </View>
            {!result.mastered ? (
              <View style={s.card}>
                <Text style={s.kicker}>KEEP GOING</Text>
                <Text accessibilityRole="header" style={s.heading}>Finish your knowledge check</Text>
                <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} replace asChild>
                  <Pressable accessibilityRole="link" style={({ pressed }) => [s.primary, pressed && s.pressed]}>
                    <Text style={s.primaryLabel}>Continue knowledge check</Text>
                    <Ionicons name="arrow-forward" size={22} color={c.white} importantForAccessibility="no" />
                  </Pressable>
                </Link>
              </View>
            ) : nextMission ? (
              <View style={s.card}>
                <Text style={s.kicker}>UP NEXT</Text>
                <Text accessibilityRole="header" style={s.heading}>{nextMission.lessonTitle}</Text>
                <Link href={{ pathname: '/mission/[id]', params: { id: String(nextMission.id) } }} replace asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Next mission: ${nextMission.lessonTitle}`} style={({ pressed }) => [s.primary, pressed && s.pressed]}>
                    <Text style={s.primaryLabel}>Next mission</Text>
                    <Ionicons name="arrow-forward" size={22} color={c.white} importantForAccessibility="no" />
                  </Pressable>
                </Link>
              </View>
            ) : null}
            <View style={s.links}>
              <Link href={{ pathname: '/review', params: { missionId: String(mission.id) } }} asChild>
                <Pressable accessibilityRole="link" style={({ pressed }) => [s.secondary, pressed && s.pressed]}>
                  <Ionicons name="book-outline" size={25} color={c.ink} importantForAccessibility="no" />
                  <Text style={s.secondaryLabel}>Review this mission</Text>
                  <Ionicons name="chevron-forward" size={22} color={c.muted} importantForAccessibility="no" />
                </Pressable>
              </Link>
              {result.mastered && projectMilestones.some(item => item.id === mission.id) ? (
                <Link href={{ pathname: '/project', params: { milestoneId: String(mission.id) } }} asChild>
                  <Pressable accessibilityRole="link" style={({ pressed }) => [s.secondary, s.milestone, pressed && s.pressed]}>
                    <Ionicons name="flag-outline" size={25} color={c.ink} importantForAccessibility="no" />
                    <Text style={s.secondaryLabel}>Record project milestone</Text>
                    <Ionicons name="chevron-forward" size={22} color={c.muted} importantForAccessibility="no" />
                  </Pressable>
                </Link>
              ) : null}
            </View>
          </> : <Text accessibilityRole="header" style={s.heading}>Results unavailable</Text>}
          <Link href="/missions" dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [result?.mastered && !nextMission ? s.primary : s.mapLink, pressed && s.pressed]}>
              <Text style={result?.mastered && !nextMission ? s.primaryLabel : s.mapLabel}>Return to Mission Map</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  backLabel: { color: c.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: c.ink, fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center' },
  help: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  trophy: { width: 106, height: 106, resizeMode: 'contain' },
  title: { color: c.ink, fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6 },
  mission: { color: c.muted, fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  xpPill: { ...clay, borderRadius: 24, paddingVertical: 8, paddingHorizontal: 24, backgroundColor: c.mint },
  points: { color: c.ink, fontSize: 28, fontWeight: '900' },
  caption: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  card: { ...clay, gap: 12, padding: 16, borderRadius: 26, backgroundColor: c.card },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, padding: 12, borderRadius: 20, backgroundColor: c.background },
  resultComplete: { backgroundColor: c.mint },
  resultText: { flex: 1, color: c.ink, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  total: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', borderTopWidth: 1, borderTopColor: c.track, paddingTop: 12 },
  progressSection: { gap: 10 },
  progressLabel: { color: c.ink, fontSize: 15, fontWeight: '700' },
  track: { height: 10, backgroundColor: c.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.purple, borderRadius: 8 },
  kicker: { color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  heading: { color: c.ink, fontSize: 22, fontWeight: '800' },
  primary: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 22, backgroundColor: c.purple },
  primaryLabel: { color: c.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  links: { ...clay, paddingHorizontal: 16, borderRadius: 24, backgroundColor: c.card },
  secondary: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  secondaryLabel: { flex: 1, color: c.ink, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  milestone: { borderTopWidth: 1, borderTopColor: c.track },
  mapLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  mapLabel: { color: c.muted, fontSize: 16, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline' },
  pressed: { opacity: 0.75 },
});
