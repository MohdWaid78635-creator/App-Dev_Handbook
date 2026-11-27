import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { Link } from '../../src/components/Link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { homeColors as colors } from '../../src/theme';
import { useProgress } from '../../src/progress/provider';

type Mission = typeof missions[number];

function Disclosure({ title, children, initiallyOpen = false, variant = 'concept' }: {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  variant?: 'concept' | 'example' | 'ai';
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={[styles.card, variant === 'example' && styles.example, variant === 'ai' && styles.aiCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(value => !value)}
        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
      >
        {variant !== 'concept' ? <Ionicons name={variant === 'example' ? 'bulb-outline' : 'shield-checkmark-outline'}
          size={24} color={colors.ink} importantForAccessibility="no" /> : null}
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
      </Pressable>
      {open ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

function LessonContent({ mission }: { mission: Mission }) {
  return (
    <>
      <Text style={styles.stage}>MISSION {mission.id + 1} OF {missions.length}</Text>
      <Text accessibilityRole="header" style={styles.heading}>{mission.lessonTitle}</Text>
      <Text style={styles.body}>Read the concepts, then explain what you would do in your own app.</Text>
      {mission.lessons.map((lesson, lessonIndex) => (
        <View key={lesson.id} style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>{lesson.title}</Text>
          {lesson.cards.map((card, index) => (
            <Disclosure key={card.h} title={card.h} initiallyOpen={lessonIndex === 0 && index === 0}>
              <Text style={styles.body}>{card.body}</Text>
              {card.ex ? <Disclosure title="See an example" variant="example">
                <Text style={styles.body}>{card.ex}</Text>
              </Disclosure> : null}
              {card.terms?.map(([term, meaning]) => (
                <Text key={term} style={styles.body}><Text style={styles.strong}>{term}. </Text>{meaning}</Text>
              ))}
              {card.note ? <Text style={styles.body}>{card.note}</Text> : null}
              {card.sourceUrl ? <Link href={card.sourceUrl} style={styles.back}>Open official documentation</Link> : null}
            </Disclosure>
          ))}
          {lesson.ai.length > 0 ? <Disclosure title="Check the AI’s work" variant="ai">
            {lesson.ai.map(tip => <Text key={tip} style={styles.body}>{tip}</Text>)}
          </Disclosure> : null}
          <View style={styles.reflection}>
            <Text accessibilityRole="header" style={styles.section}>Explain it back</Text>
            <Text style={styles.body}>{lesson.explain}</Text>
            <Text style={styles.body}>Try answering in your own words before moving on.</Text>
          </View>
          <Text style={styles.source}>Lesson source: {lesson.source}</Text>
        </View>
      ))}
      <Text accessibilityRole="header" style={styles.section}>Apply it to your app</Text>
      <Text style={styles.body}>{mission.description}</Text>
      <Link href={{ pathname: '/help', params: { missionId: String(mission.id) } }} style={styles.back}>Troubleshoot this mission</Link>
      <Link href={{ pathname: '/project', params: { missionId: String(mission.id) } }} asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.buildAction, pressed && styles.pressed]}>
          <Text style={styles.buildLabel}>Record proof in Build Workspace</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
      </Link>
      {mission.steps.map(step => (
        <Disclosure key={step.id} title={step.title}>
          <Text style={styles.body}>{step.why}</Text>
          <Text style={styles.label}>What to do</Text>
          {step.do.map((action, index) => <Text key={index} style={styles.body}>{index + 1}. {action}</Text>)}
          <Text style={styles.label}>What you should see</Text>
          {step.proof.map(proof => <Text key={proof} style={styles.body}>• {proof}</Text>)}
          <Link href={step.source.url} style={styles.back}>Open official source ↗</Link>
          <Text style={styles.source}>Checked {step.source.checked}</Text>
        </Disclosure>
      ))}
    </>
  );
}

function LessonActions({ mission, bottom }: { mission: Mission; bottom: number }) {
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(bottom, 12) }]}>
      <View style={styles.footerColumn}>
        <Link href={{ pathname: '/practice/[id]', params: { id: String(mission.id) } }} asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.practice, pressed && styles.pressed]}>
            <Text style={styles.practiceLabel}>Start practice</Text>
            <Ionicons name="arrow-forward" size={23} color={colors.white} importantForAccessibility="no" />
          </Pressable>
        </Link>
        <Text style={styles.footerCaption}>{mission.practice.length} {mission.practice.length === 1 ? 'exercise' : 'exercises'} · Retry as often as you like</Text>
        <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.quiz, pressed && styles.pressed]}>
            <Text style={styles.quizLabel}>Knowledge check</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function MissionLesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const dockActions = height >= 600 && fontScale <= 1.5;
  const mission = missions.find(item => String(item.id) === id);
  const { openMission, saveError } = useProgress();
  const missionId = mission?.id;
  useEffect(() => {
    if (missionId !== undefined) openMission(missionId);
  }, [missionId, openMission]);
  return (
    <View style={[styles.screen, { paddingTop: top }]}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: mission && dockActions ? 24 : Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Link href="/missions" dismissTo asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
              <Text style={styles.backLabel}>Missions</Text>
            </Pressable>
          </Link>
          <Text accessibilityRole="header" style={styles.headerTitle}>Lesson</Text>
          <Link href={{ pathname: '/help', params: mission ? { missionId: String(mission.id) } : {} }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Help with this mission" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
              <Ionicons name="help-circle-outline" size={29} color={colors.ink} importantForAccessibility="no" />
            </Pressable>
          </Link>
        </View>
        {saveError ? <Text accessibilityRole="alert" style={styles.warning}>{saveError}</Text> : null}
        {mission ? <LessonContent key={mission.id} mission={mission} /> :
          <Text accessibilityRole="header" style={styles.heading}>Mission unavailable</Text>}
        {mission && !dockActions ? <LessonActions mission={mission} bottom={0} /> : null}
      </View>
    </ScrollView>
    {mission && dockActions ? <LessonActions mission={mission} bottom={bottom} /> : null}
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
  backButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  help: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.purple, fontSize: 16, lineHeight: 24, minHeight: 48, textAlignVertical: 'center', alignSelf: 'flex-start' },
  stage: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  heading: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  group: { gap: 12 },
  section: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 6 },
  card: { ...clay, borderRadius: 24, backgroundColor: colors.card },
  disclosure: { minHeight: 56, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  pressed: { opacity: 0.75 },
  cardTitle: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 26 },
  cardBody: { gap: 14, paddingHorizontal: 16, paddingBottom: 16 },
  label: { color: colors.purple, fontWeight: '800', fontSize: 15 },
  strong: { color: colors.ink, fontWeight: '800' },
  example: { borderRadius: 18, backgroundColor: colors.mint, boxShadow: [] },
  aiCard: { backgroundColor: colors.background },
  reflection: { ...clay, gap: 8, padding: 18, borderRadius: 24, backgroundColor: colors.mint },
  practice: { ...clay, minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.purple, borderRadius: 24 },
  practiceLabel: { color: colors.white, fontWeight: '800', fontSize: 18, flexShrink: 1 },
  quiz: { minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center' },
  quizLabel: { color: colors.purple, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  footer: { backgroundColor: colors.background, paddingTop: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.track },
  footerColumn: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 6 },
  footerCaption: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  buildAction: { ...clay, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 22, backgroundColor: colors.card },
  buildLabel: { color: colors.purple, fontSize: 16, fontWeight: '800', flex: 1 },
  source: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  warning: { color: colors.ink, backgroundColor: colors.attentionSurface, padding: 16, borderRadius: 20, fontSize: 16, lineHeight: 24 },
});
