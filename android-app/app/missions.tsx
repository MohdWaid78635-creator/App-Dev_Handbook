import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from '../src/components/Link';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../src/generated/missions.json';
import { homeColors as c } from '../src/theme';
import { useProgress } from '../src/progress/provider';
import { createHomeSummary } from '../src/progress/home';
import { createLearningResults } from '../src/progress/results';
import { WorkshopNavigation } from '../src/components/WorkshopNavigation';

export default function MissionMap() {
  const { top } = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { progress, saveError } = useProgress();
  const home = createHomeSummary(missions, progress);
  const results = createLearningResults(missions, progress.quizResults);
  const stacked = width < 400 || fontScale > 1.2;

  return (
    <View style={[s.screen, { paddingTop: top }]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.column}>
          <View style={s.header}>
            <View style={s.brand}>
              <Image source={require('../assets/clay-mark.png')} style={s.logo} accessible={false} />
              <Text style={s.wordmark}>BuildWisp</Text>
            </View>
            <Link href="/help" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Help and Resource Library"
                style={({ pressed }) => [s.help, pressed && s.pressed]}>
                <Ionicons name="help-circle-outline" size={30} color={c.ink} importantForAccessibility="no" />
              </Pressable>
            </Link>
          </View>
          <View style={s.intro}>
            <Text accessibilityRole="header" style={s.heading}>Your builder journey</Text>
            <Text style={s.body}>{missions.length} missions. One app you can be proud of.</Text>
          </View>
          {saveError ? <Text accessibilityRole="alert" style={s.notice}>{saveError}</Text> : null}
          <View style={s.progressSection}>
            <View style={s.progressLabels}>
              <Text style={s.progressLabel}>{home.masteredCount} of {missions.length} mastered</Text>
              <Text style={s.progressLabel}>{home.totalXp} XP</Text>
            </View>
            <View style={s.track} accessibilityRole="progressbar" accessibilityLabel="Missions mastered"
              accessibilityValue={{ min: 0, max: missions.length, now: home.masteredCount }}>
              <View style={[s.fill, { width: `${missions.length ? home.masteredCount / missions.length * 100 : 0}%` }]} />
            </View>
          </View>
          {home.mode === 'new' ? (
            <Link href="/getting-started" asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [s.setup, pressed && s.pressed]}>
                <Text style={s.setupText}>Start Here · {progress.checkpoints.length} of 4 setup checkpoints checked</Text>
                <Ionicons name="chevron-forward" size={22} color={c.ink} importantForAccessibility="no" />
              </Pressable>
            </Link>
          ) : null}
          {home.mode === 'complete' ? (
            <Link href="/review" asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [s.setup, pressed && s.pressed]}>
                <Text style={s.setupText}>All missions mastered. Visit the Review room.</Text>
                <Ionicons name="chevron-forward" size={22} color={c.ink} importantForAccessibility="no" />
              </Pressable>
            </Link>
          ) : null}
          <View>
            {missions.map((mission, index) => {
              const mastered = results.forMission(mission.quiz).mastered;
              const current = home.mission?.id === mission.id;
              const opened = progress.openedMissions.includes(mission.id);
              const href = { pathname: '/mission/[id]' as const, params: { id: String(mission.id) } };
              return (
                <View key={mission.id} style={s.row}>
                  <View style={s.markerColumn} importantForAccessibility="no-hide-descendants">
                    <View style={[s.rail, index === 0 && s.firstRail, index === missions.length - 1 && s.lastRail]} />
                    <View style={[s.marker, mastered && s.masteredMarker, current && s.currentMarker]}>
                      {mastered ? <Ionicons name="checkmark" size={25} color={c.ink} />
                        : <Text style={[s.markerText, current && s.currentMarkerText]}>{String(index + 1).padStart(2, '0')}</Text>}
                    </View>
                  </View>
                  <View style={s.cardColumn}>
                    {current ? (
                      <View style={[s.card, s.currentCard]}>
                        <Text style={s.eyebrow}>{home.mode === 'new' ? 'START YOUR JOURNEY' : 'CONTINUE YOUR JOURNEY'}</Text>
                        <View style={[s.currentContent, stacked && s.stacked]}>
                          <View style={s.currentText}>
                            <Text accessibilityRole="header" style={s.currentTitle}>{mission.lessonTitle}</Text>
                            <Text style={s.body}>{mission.steps.length} build cards</Text>
                          </View>
                          <Image source={require('../assets/clay-workshop.png')} style={[s.art, stacked && s.stackedArt]} accessible={false} />
                        </View>
                        <Link href={href} asChild>
                          <Pressable accessibilityRole="button" accessibilityLabel={`${opened ? 'Continue' : 'Start'} mission ${index + 1}: ${mission.lessonTitle}`}
                            style={({ pressed }) => [s.primary, pressed && s.pressed]}>
                            <Text style={s.primaryText}>{opened ? 'Continue mission' : 'Start mission'}</Text>
                            <Ionicons name="arrow-forward" size={22} color={c.white} importantForAccessibility="no" />
                          </Pressable>
                        </Link>
                      </View>
                    ) : (
                      <Link href={href} asChild>
                        <Pressable accessibilityRole="link"
                          accessibilityLabel={`Mission ${index + 1}: ${mission.lessonTitle}. ${mastered ? 'Mastered. Revisit mission.' : `${mission.steps.length} build cards.${opened ? ' Opened.' : ''}`}`}
                          style={({ pressed }) => [s.card, s.compactCard, pressed && s.pressed]}>
                          <View style={s.cardText}>
                            <Text style={s.cardTitle}>{mission.lessonTitle}</Text>
                            {mastered ? <View style={s.badge}>
                              <Ionicons name="checkmark" size={16} color={c.ink} importantForAccessibility="no" />
                              <Text style={s.badgeText}>Mastered</Text>
                            </View> : <Text style={s.meta}>{mission.steps.length} build cards{opened ? ' · Opened' : ''}</Text>}
                          </View>
                          <Ionicons name="chevron-forward" size={22} color={c.ink} importantForAccessibility="no" />
                        </Pressable>
                      </Link>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <WorkshopNavigation selected="Missions" />
    </View>
  );
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 12, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 52, height: 60, resizeMode: 'contain' },
  wordmark: { color: c.ink, fontSize: 25, fontWeight: '900', flexShrink: 1, letterSpacing: -1 },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  intro: { gap: 6, marginTop: 6 },
  heading: { color: c.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  body: { color: c.muted, fontSize: 16, lineHeight: 24 },
  progressSection: { gap: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  progressLabel: { color: c.ink, fontSize: 15, fontWeight: '700' },
  track: { height: 12, backgroundColor: c.track, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.purple, borderRadius: 8 },
  setup: { ...clay, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 56, backgroundColor: c.mint, borderRadius: 20 },
  setupText: { flex: 1, color: c.ink, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  markerColumn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rail: { position: 'absolute', width: 3, top: 0, bottom: 0, backgroundColor: '#B9A5D3' },
  firstRail: { top: '50%' },
  lastRail: { bottom: '50%' },
  marker: { ...clay, width: 40, minHeight: 40, paddingVertical: 8, backgroundColor: c.background, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  masteredMarker: { backgroundColor: c.mint },
  currentMarker: { backgroundColor: c.purple },
  markerText: { color: c.ink, fontSize: 17, fontWeight: '800' },
  currentMarkerText: { color: c.white },
  cardColumn: { flex: 1, paddingVertical: 8 },
  card: { ...clay, minHeight: 80, borderRadius: 24, padding: 16, backgroundColor: c.card },
  compactCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardText: { flex: 1, gap: 8 },
  cardTitle: { color: c.ink, fontSize: 18, fontWeight: '800' },
  meta: { color: c.muted, fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.mint },
  badgeText: { color: c.ink, fontSize: 13, fontWeight: '700' },
  currentCard: { gap: 12, padding: 18 },
  eyebrow: { color: c.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  currentContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currentText: { flex: 1, gap: 8 },
  currentTitle: { color: c.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.6 },
  art: { width: 92, height: 120, resizeMode: 'contain' },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  stackedArt: { width: 124, height: 108, alignSelf: 'center' },
  primary: { ...clay, minHeight: 52, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 22, backgroundColor: c.purple },
  primaryText: { color: c.white, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  notice: { color: c.ink, backgroundColor: c.mint, padding: 14, borderRadius: 16, fontSize: 16 },
  pressed: { opacity: 0.65 },
});
