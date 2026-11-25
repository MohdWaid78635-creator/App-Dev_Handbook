import { Link } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../src/generated/missions.json';
import { colors } from '../src/theme';
import { useProgress } from '../src/progress/provider';
import { createLearningResults } from '../src/progress/results';

export default function MissionMap() {
  const { bottom } = useSafeAreaInsets();
  const { progress, saveError } = useProgress();
  const results = createLearningResults(missions, progress.quizResults);
  const mastered = new Set(missions.filter(mission => results.forMission(mission.quiz).mastered).map(mission => mission.id));
  const lastMission = missions.find(mission => mission.id === progress.openedMissions.at(-1));
  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <ImageBackground source={require('../assets/workshop.webp')} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroText}>
            <Text accessibilityRole="header" style={styles.title}>Learn by building.</Text>
            <Text style={styles.heroBody}>Play through 13 missions. Turn one idea into your first Android app.</Text>
            <Link href={lastMission
              ? { pathname: '/mission/[id]', params: { id: String(lastMission.id) } }
              : '/getting-started'} asChild>
              <Pressable accessibilityRole="button" style={styles.start}><Text style={styles.startText}>{lastMission ? 'Resume mission' : 'Start Here'}</Text></Pressable>
            </Link>
          </View>
        </ImageBackground>
        {saveError ? <Text accessibilityRole="alert" style={styles.notice}>{saveError}</Text> : null}
        <Link href="/getting-started" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Get your workshop ready</Text>
              <Text style={styles.meta}>{progress.checkpoints.length} of 4 setup checkpoints checked</Text>
            </View>
            <Text style={styles.chevron} importantForAccessibility="no">›</Text>
          </Pressable>
        </Link>
        <Link href="/review" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Review room</Text>
              <Text style={styles.meta}>Retry missed questions and practise what you learned</Text>
            </View>
            <Text style={styles.chevron} importantForAccessibility="no">›</Text>
          </Pressable>
        </Link>
        <Link href="/project" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Your projects</Text>
              <Text style={styles.meta}>Create or reopen an app idea</Text>
            </View>
            <Text style={styles.chevron} importantForAccessibility="no">›</Text>
          </Pressable>
        </Link>
        <Link href="/help" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Help and Resource Library</Text>
              <Text style={styles.meta}>Search lessons, glossary terms, fixes, and prompts</Text>
            </View>
            <Text style={styles.chevron} importantForAccessibility="no">›</Text>
          </Pressable>
        </Link>
        <Link href="/backup" asChild>
          <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Backup and Restore</Text>
              <Text style={styles.meta}>Save or restore a copy of your progress and projects</Text>
            </View>
            <Text style={styles.chevron} importantForAccessibility="no">›</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.section}>Mission map</Text>
        <Text style={styles.meta}>{mastered.size} of {missions.length} missions mastered · {results.totalXp} total XP</Text>
        {missions.map(mission => (
          <Link key={mission.id} href={{ pathname: '/mission/[id]', params: { id: String(mission.id) } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.tile} accessible={false}><Text style={styles.tileText}>{String(mission.id + 1).padStart(2, '0')}</Text></View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{mission.lessonTitle}</Text>
                <Text style={styles.meta}>{mission.steps.length} build cards{mastered.has(mission.id) ? ' · Mastered' : progress.openedMissions.includes(mission.id) ? ' · Opened' : ''}</Text>
              </View>
              <Text style={styles.chevron} importantForAccessibility="no">›</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 11 },
  hero: { backgroundColor: colors.hero, minHeight: 252, overflow: 'hidden', borderRadius: 24, justifyContent: 'flex-end' },
  heroImage: { opacity: 0.45 },
  heroText: { padding: 22, gap: 10 },
  title: { color: colors.card, fontWeight: '900', fontSize: 34 },
  heroBody: { color: colors.card, fontSize: 16, lineHeight: 23, maxWidth: 250 },
  start: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 16, backgroundColor: colors.mint, borderRadius: 14, justifyContent: 'center' },
  startText: { color: '#173b33', fontWeight: '800', fontSize: 16 },
  section: { color: colors.ink, fontWeight: '800', fontSize: 24, marginTop: 12 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 12 },
  pressed: { backgroundColor: colors.lavender },
  tile: { width: 44, height: 44, backgroundColor: colors.lavender, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: colors.purple, fontWeight: '800' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14 },
  chevron: { color: colors.purple, fontSize: 24 },
  notice: { color: colors.ink, backgroundColor: '#fff0d4', padding: 12, borderRadius: 12 },
});
