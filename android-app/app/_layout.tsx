import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme';
import { ProgressProvider } from '../src/progress/provider';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.card },
        contentStyle: { backgroundColor: colors.background },
      }}>
        <Stack.Screen name="index" options={{ title: 'BuildWisp' }} />
        <Stack.Screen name="getting-started" options={{ title: 'Start Here' }} />
        <Stack.Screen name="mission/[id]" options={{ title: 'Lesson' }} />
        <Stack.Screen name="practice/[id]" options={{ title: 'Practice' }} />
        <Stack.Screen name="quiz/[id]" options={{ title: 'Knowledge Check' }} />
        <Stack.Screen name="result/[id]" options={{ title: 'Mission Results' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="study" options={{ title: 'Daily Practice and Flashcards' }} />
        <Stack.Screen name="project" options={{ title: 'Project Setup' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Plan Mode' }} />
        <Stack.Screen name="build/[id]" options={{ title: 'Build Workspace' }} />
        <Stack.Screen name="milestones/[id]" options={{ title: 'Project Milestones' }} />
        <Stack.Screen name="readiness/[id]" options={{ title: 'Production Readiness' }} />
        <Stack.Screen name="help" options={{ title: 'Help' }} />
        <Stack.Screen name="backup" options={{ title: 'Backup and Restore' }} />
      </Stack>
    </ProgressProvider>
  );
}
