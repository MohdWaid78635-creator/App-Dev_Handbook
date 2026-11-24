import { setStringAsync } from 'expo-clipboard';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import articles from '../src/generated/articles.json';
import missions from '../src/generated/missions.json';
import { buildLibrary, categories, searchLibrary } from '../src/library/search';
import type { Category, Resource } from '../src/library/search';
import { colors } from '../src/theme';

const library = buildLibrary(missions, articles);
const filters = Object.keys(categories) as Category[];

function ResourceContent({ resource }: { resource: Resource }) {
  const [status, setStatus] = useState('');
  const prompt = resource.copyText;

  async function copy(text: string) {
    try {
      if (await setStringAsync(text, { android: { isSensitive: true } })) {
        setStatus('Prompt copied.');
        return;
      }
    } catch {
      // The prompt remains selectable if the clipboard is unavailable.
    }
    setStatus('Couldn’t copy. Select the prompt text to copy it.');
  }

  return <View style={styles.detail}>
    {resource.body.map((paragraph, index) => <Text key={index} style={styles.body}>{paragraph}</Text>)}
    {prompt ? <>
      {prompt.includes('[APP_NAME]') ? <Text style={styles.meta}>Replace [APP_NAME] with the name of your app before using this prompt.</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => { void copy(prompt); }} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Text style={styles.primaryLabel}>Copy prompt</Text>
      </Pressable>
      {status ? <Text accessibilityLiveRegion="polite" style={styles.body}>{status}</Text> : null}
      <Text selectable style={styles.prompt}>{prompt}</Text>
    </> : null}
    {resource.sourceUrl ? <Link href={resource.sourceUrl} style={styles.link}>Open official source</Link> : null}
    {resource.missionId !== undefined ? <Link href={{ pathname: '/mission/[id]', params: { id: String(resource.missionId) } }} style={styles.link}>
      Open related mission
    </Link> : null}
  </View>;
}

export default function HelpScreen() {
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const { bottom } = useSafeAreaInsets();
  const initialMission = missions.find(mission => String(mission.id) === missionId);
  const [mission, setMission] = useState(initialMission);
  const [category, setCategory] = useState<Category>(initialMission ? 'troubleshooting' : 'all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string>();
  const results = searchLibrary(library, query, category, mission?.id);

  return <FlatList
    data={results}
    keyExtractor={item => item.id}
    keyboardShouldPersistTaps="handled"
    style={styles.list}
    contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}
    ListHeaderComponent={<View style={styles.header}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Resource Library</Text>
        <Text style={styles.heroBody}>Look up a concept, find a fix, or copy a prompt.</Text>
        <TextInput accessibilityLabel="Search resources" value={query} onChangeText={value => { setQuery(value); setExpandedId(undefined); }}
          placeholder="Search, e.g. login, backup, or testing" placeholderTextColor={colors.muted}
          autoCapitalize="none" returnKeyType="search" style={styles.input} />
        {query ? <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clear}>
          <Text style={styles.clearLabel}>Clear search</Text>
        </Pressable> : null}
      </View>
      <View style={styles.filters}>
        {filters.map(filter => <Pressable key={filter} accessibilityRole="button" accessibilityState={{ selected: filter === category }}
          onPress={() => { setCategory(filter); setExpandedId(undefined); }}
          style={({ pressed }) => [styles.filter, category === filter && styles.selected, pressed && styles.pressed]}>
          <Text style={styles.label}>{categories[filter]}</Text>
        </Pressable>)}
      </View>
      {mission ? <View style={styles.card}>
        <Text style={styles.body}>Showing resources for {mission.lessonTitle}.</Text>
        <Pressable accessibilityRole="button" onPress={() => setMission(undefined)} style={styles.linkButton}>
          <Text style={styles.linkLabel}>Show all missions</Text>
        </Pressable>
      </View> : null}
      {!query.trim() && category === 'all' && !mission ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.label}>Kotlin and Jetpack Compose</Text>
        <Text style={styles.body}>A separate Android learning track. BuildWisp’s missions use Expo and TypeScript.</Text>
        <Link href="https://developer.android.com/courses/android-basics-compose/course" style={styles.link}>Open Android Basics with Compose</Link>
      </View> : null}
      <Text accessibilityLiveRegion="polite" style={styles.meta}>{results.length} {results.length === 1 ? 'resource' : 'resources'}</Text>
    </View>}
    ListEmptyComponent={<View style={styles.card}>
      <Text accessibilityRole="header" style={styles.label}>No matching resources</Text>
      <Text style={styles.body}>Try a shorter keyword, or choose All to search across categories.</Text>
    </View>}
    renderItem={({ item }) => {
      const expanded = expandedId === item.id;
      return <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setExpandedId(expanded ? undefined : item.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={styles.label}>{item.title}</Text>
          <Text style={styles.meta}>{categories[item.kind]} · {item.subtitle}</Text>
        </Pressable>
        {expanded ? <ResourceContent resource={item} /> : null}
      </View>;
    }}
  />;
}

const styles = StyleSheet.create({
  list: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  screen: { padding: 18, gap: 10 },
  header: { gap: 12 },
  hero: { padding: 20, gap: 10, borderRadius: 22, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  input: { minHeight: 48, borderRadius: 12, padding: 12, color: colors.ink, backgroundColor: colors.card, fontSize: 16 },
  clear: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8 },
  clearLabel: { color: colors.mint, fontSize: 16, fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 48, paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center', backgroundColor: colors.lavender },
  selected: { backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.purple },
  card: { padding: 12, gap: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  row: { minHeight: 52, padding: 8, gap: 4, justifyContent: 'center', borderRadius: 10 },
  detail: { gap: 10, padding: 8 },
  label: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  link: { minHeight: 48, color: colors.purple, fontSize: 16, fontWeight: '800', textAlignVertical: 'center' },
  linkButton: { minHeight: 48, justifyContent: 'center' },
  linkLabel: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  primary: { minHeight: 48, padding: 12, borderRadius: 12, justifyContent: 'center', backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  prompt: { padding: 12, borderRadius: 12, color: colors.ink, backgroundColor: colors.lavender, fontSize: 16, lineHeight: 23 },
});
