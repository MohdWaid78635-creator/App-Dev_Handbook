import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import missions from '../../src/generated/missions.json';
import { colors } from '../../src/theme';
import { useProgress } from '../../src/progress/provider';

type Mission = typeof missions[number];

function Disclosure({ title, children, initiallyOpen = false }: {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(value => !value)}
        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <Text importantForAccessibility="no" style={styles.indicator}>{open ? '−' : '+'}</Text>
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
              {card.ex ? <View style={styles.example}>
                <Text style={styles.label}>Example</Text>
                <Text style={styles.body}>{card.ex}</Text>
              </View> : null}
              {card.terms?.map(([term, meaning]) => (
                <Text key={term} style={styles.body}><Text style={styles.strong}>{term}. </Text>{meaning}</Text>
              ))}
              {card.note ? <Text style={styles.body}>{card.note}</Text> : null}
              {card.sourceUrl ? <Link href={card.sourceUrl} style={styles.back}>Open official documentation</Link> : null}
            </Disclosure>
          ))}
          {lesson.ai.length > 0 ? <Disclosure title="Check the AI’s work">
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
      <Link href={{ pathname: '/practice/[id]', params: { id: String(mission.id) } }} asChild>
        <Pressable accessibilityRole="button" style={styles.practice}>
          <Text style={styles.practiceLabel}>Start practice · {mission.practice.length} {mission.practice.length === 1 ? 'exercise' : 'exercises'}</Text>
        </Pressable>
      </Link>
      <Link href={{ pathname: '/quiz/[id]', params: { id: String(mission.id) } }} asChild>
        <Pressable accessibilityRole="button" style={styles.quiz}>
          <Text style={styles.quizLabel}>Knowledge check · 2 questions + boss</Text>
        </Pressable>
      </Link>
      <Text accessibilityRole="header" style={styles.section}>Apply it to your app</Text>
      <Text style={styles.body}>{mission.description}</Text>
      <Link href={{ pathname: '/help', params: { missionId: String(mission.id) } }} style={styles.back}>Troubleshoot this mission</Link>
      <Link href={{ pathname: '/project', params: { missionId: String(mission.id) } }} asChild>
        <Pressable accessibilityRole="link" style={styles.practice}>
          <Text style={styles.practiceLabel}>Record proof in Build Workspace</Text>
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

export default function MissionLesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const mission = missions.find(item => String(item.id) === id);
  const { openMission, saveError } = useProgress();
  const missionId = mission?.id;
  useEffect(() => {
    if (missionId !== undefined) openMission(missionId);
  }, [missionId, openMission]);
  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
      <View style={styles.column}>
        <Link href="/" dismissTo style={styles.back}>← Mission map</Link>
        {saveError ? <Text accessibilityRole="alert" style={styles.body}>{saveError}</Text> : null}
        {mission ? <LessonContent key={mission.id} mission={mission} /> :
          <Text accessibilityRole="header" style={styles.heading}>Mission unavailable</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  back: { color: colors.purple, fontSize: 16, minHeight: 48, textAlignVertical: 'center', alignSelf: 'flex-start' },
  stage: { color: colors.purple, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  group: { gap: 10 },
  section: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: 'hidden' },
  disclosure: { minHeight: 52, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  pressed: { backgroundColor: colors.lavender },
  cardTitle: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '800' },
  indicator: { color: colors.purple, fontSize: 21, fontWeight: '800' },
  cardBody: { gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  label: { color: colors.purple, fontWeight: '800', fontSize: 15 },
  strong: { color: colors.ink, fontWeight: '800' },
  example: { gap: 4, padding: 11, borderRadius: 10, backgroundColor: colors.lavender },
  reflection: { gap: 5, padding: 14, borderRadius: 14, backgroundColor: colors.mint },
  practice: { minHeight: 48, padding: 14, justifyContent: 'center', backgroundColor: colors.purple, borderRadius: 12 },
  practiceLabel: { color: colors.card, fontWeight: '800', fontSize: 16 },
  quiz: { minHeight: 48, padding: 14, justifyContent: 'center', backgroundColor: colors.lavender, borderRadius: 12 },
  quizLabel: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  source: { color: colors.muted, fontSize: 13 },
});
