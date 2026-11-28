import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Link } from '../src/components/Link';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../src/generated/missions.json';
import { homeColors as c } from '../src/theme';
import { useProgress } from '../src/progress/provider';
import { createHomeSummary } from '../src/progress/home';
import { WorkshopNavigation } from '../src/components/WorkshopNavigation';

function showOptions() {
  Alert.alert('Your workshop', 'Setup, resources, and saved data', [
    { text: 'Find my starting point', onPress: () => router.push('/start') },
    { text: 'Help and Resource Library', onPress: () => router.push('/help') },
    { text: 'Backup and Restore', onPress: () => router.push('/backup') },
  ], { cancelable: true });
}

export default function Home() {
  const { top } = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { progress, saveError } = useProgress();
  const home = createHomeSummary(missions, progress);
  const stacked = width < 380 || fontScale > 1.2;
  const primaryHref = home.mode === 'new' ? '/start' : home.mission
    ? { pathname: '/mission/[id]' as const, params: { id: String(home.mission.id) } } : '/review';
  const headline = home.mode === 'new' ? 'Your first app starts here.' : home.mode === 'complete'
    ? 'Look how far you’ve come.' : home.mode === 'mastered' ? 'One mission stronger.' : 'Welcome back, builder.';

  return (
    <View style={[s.screen, { paddingTop: top }]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.column}>
          <View style={s.header}>
            <View style={s.brand}>
              <Image source={require('../assets/clay-mark.png')} style={s.logo} accessible={false} />
              <Text style={s.wordmark}>BuildWisp</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Workshop options: setup, help, and backup" onPress={showOptions}
              style={({ pressed }) => [s.options, pressed && s.pressed]}>
              <Ionicons name="settings-outline" size={28} color={c.ink} importantForAccessibility="no" />
            </Pressable>
          </View>
          <View style={s.intro}>
            <Text accessibilityRole="header" style={s.heading}>{headline}</Text>
            <Text style={s.body}>{home.mode === 'new' ? 'Learn by building your first Android app.' : 'One mission closer to your first app.'}</Text>
          </View>
          {saveError ? <Text accessibilityRole="alert" style={s.notice}>{saveError}</Text> : null}
          <View style={s.progressSection}>
            <View style={s.progressLabels}>
              <Text style={s.progressLabel}>{home.masteredCount} of {missions.length} mastered</Text>
              <Text style={s.progressLabel}>{home.totalXp} XP</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityLabel="Missions mastered"
              accessibilityValue={{ min: 0, max: missions.length, now: home.masteredCount }} style={s.track}>
              <View style={[s.fill, { width: `${missions.length ? home.masteredCount / missions.length * 100 : 0}%` }]} />
            </View>
          </View>
          <View style={s.missionCard}>
            <Text style={s.eyebrow}>{home.mode === 'complete' ? 'ALL MISSIONS MASTERED' : home.mode === 'new' ? 'START HERE' : 'YOUR NEXT MISSION'}</Text>
            <View style={[s.missionContent, stacked && s.stacked]}>
              <View style={s.missionText}>
                <Text accessibilityRole="header" style={s.missionTitle}>{home.mode === 'new' ? 'Build from where you are' : home.mission?.lessonTitle ?? 'Keep your skills fresh'}</Text>
                <Text style={s.body}>{home.mode === 'new'
                  ? 'Start a new app or find the next step for an app you already have.'
                  : home.mode === 'complete' ? 'Revisit what you learned in the Review room.'
                    : `${home.mission?.steps.length ?? 0} build cards to explore, practise, and put to work.`}</Text>
              </View>
              <Image source={require('../assets/clay-workshop.png')} style={[s.art, stacked && s.stackedArt]} accessible={false} />
            </View>
            <Link href={primaryHref} asChild>
              <Pressable accessibilityRole="button" style={({ pressed }) => [s.primary, pressed && s.pressed]}>
                <Text style={s.primaryText}>{home.mode === 'new' ? 'Start Here' : home.mode === 'complete' ? 'Open Review room' : 'Continue learning'}</Text>
                <Ionicons name="arrow-forward" size={24} color={c.white} importantForAccessibility="no" />
              </Pressable>
            </Link>
          </View>
          <Text accessibilityRole="header" style={s.section}>Your workshop</Text>
          <Link href="/start" style={s.linkText}>Find my app’s next step →</Link>
          <View style={[s.workshop, stacked && s.stacked]}>
            <Link href="/project" asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [s.toolCard, s.mintCard, pressed && s.pressed]}>
                <Ionicons name="folder-outline" size={30} color={c.ink} importantForAccessibility="no" />
                <Text style={s.toolTitle}>Your projects</Text><Text style={s.caption}>Build your app idea</Text>
              </Pressable>
            </Link>
            <Link href="/review" asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [s.toolCard, s.lilacCard, pressed && s.pressed]}>
                <Ionicons name="albums-outline" size={30} color={c.ink} importantForAccessibility="no" />
                <Text style={s.toolTitle}>Review room</Text><Text style={s.caption}>Keep it fresh</Text>
              </Pressable>
            </Link>
          </View>
          <Link href="/missions" asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [s.missionsLink, pressed && s.pressed]}>
              <Ionicons name="compass-outline" size={28} color={c.ink} importantForAccessibility="no" />
              <Text style={s.linkText}>Explore all {missions.length} missions</Text>
              <Ionicons name="chevron-forward" size={22} color={c.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
          <Link href="/help" asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [s.help, pressed && s.pressed]}>
              <Text style={s.helpText}>Help & resources</Text>
              <Ionicons name="chevron-forward" size={20} color={c.muted} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
      </ScrollView>
      <WorkshopNavigation selected="Home" />
    </View>
  );
}

const clay = {
  boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 12, color: '#39205B18' },
    { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }],
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 52, height: 60, resizeMode: 'contain' },
  wordmark: { color: c.ink, fontSize: 25, fontWeight: '900', flexShrink: 1, letterSpacing: -1 },
  options: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  intro: { gap: 6, marginTop: 6 },
  heading: { color: c.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  body: { color: c.muted, fontSize: 16, lineHeight: 24 },
  progressSection: { gap: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  progressLabel: { color: c.ink, fontSize: 15, fontWeight: '700' },
  track: { height: 12, backgroundColor: c.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.purple, borderRadius: 8 },
  missionCard: { ...clay, backgroundColor: c.card, padding: 20, borderRadius: 28, gap: 14 },
  eyebrow: { color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  missionContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  missionText: { flex: 1, gap: 8 },
  missionTitle: { color: c.ink, fontWeight: '900', fontSize: 25, letterSpacing: -0.6 },
  art: { width: 116, height: 142, resizeMode: 'contain' },
  stackedArt: { width: 144, height: 128, alignSelf: 'center' },
  primary: { ...clay, backgroundColor: c.purple, borderRadius: 24, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { color: c.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  section: { color: c.ink, fontSize: 23, fontWeight: '900', marginTop: 2 },
  workshop: { flexDirection: 'row', gap: 12 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  toolCard: { ...clay, flex: 1, padding: 18, borderRadius: 24, gap: 8 },
  mintCard: { backgroundColor: c.mint },
  lilacCard: { backgroundColor: c.background },
  toolTitle: { color: c.ink, fontSize: 18, fontWeight: '800' },
  caption: { color: c.muted, fontSize: 14, lineHeight: 20 },
  missionsLink: { ...clay, minHeight: 60, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, backgroundColor: c.card },
  linkText: { color: c.ink, fontSize: 16, fontWeight: '700', flex: 1 },
  help: { minHeight: 48, paddingHorizontal: 4, gap: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helpText: { color: c.muted, fontSize: 16, flex: 1 },
  pressed: { opacity: 0.65 },
  notice: { backgroundColor: c.mint, color: c.ink, padding: 14, borderRadius: 16, fontSize: 16 },
});
