import Ionicons from '@expo/vector-icons/Ionicons';
import { setStringAsync } from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Link } from '../src/components/Link';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import articles from '../src/generated/articles.json';
import missions from '../src/generated/missions.json';
import glossary from '../src/generated/glossary.json';
import { buildLibrary, categories, searchLibrary } from '../src/library/search';
import type { Category, Resource } from '../src/library/search';
import { homeColors as colors } from '../src/theme';
import { projectStore } from '../src/projects/local';
import type { Project } from '../src/projects/store';
import { matchProjectResources, recommendProject } from '../src/projects/assessment';

const library = buildLibrary(missions, articles, glossary);
const chapters = [...new Map(articles.map(article => [article.chapterId, article.chapterTitle])).entries()];
const filters = Object.keys(categories) as Category[];
const categoryIcons = {
  all: 'grid-outline', learn: 'book-outline', glossary: 'library-outline',
  troubleshooting: 'build-outline', prompt: 'code-slash-outline',
} as const;

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
    {resource.body.map((paragraph, index) => <Text selectable key={index} style={styles.body}>{paragraph}</Text>)}
    {prompt ? <>
      {prompt.includes('[APP_NAME]') ? <Text style={styles.meta}>Replace [APP_NAME] with the name of your app before using this prompt.</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => { void copy(prompt); }} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Ionicons name="copy-outline" size={24} color={colors.white} importantForAccessibility="no" />
        <Text style={styles.primaryLabel}>Copy prompt</Text>
      </Pressable>
      {status ? <Text accessibilityLiveRegion="polite" style={styles.body}>{status}</Text> : null}
      <Text selectable style={styles.prompt}>{prompt}</Text>
    </> : null}
    {resource.sourceUrl ? <Link href={resource.sourceUrl} style={styles.link}>Open official source ↗</Link> : null}
    {resource.missionId !== undefined ? <Link href={{ pathname: '/mission/[id]', params: { id: String(resource.missionId) } }} style={styles.link}>
      Open related mission →
    </Link> : null}
  </View>;
}

export default function HelpScreen() {
  const { missionId, projectId } = useLocalSearchParams<{ missionId?: string; projectId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const initialMission = missions.find(mission => String(mission.id) === missionId);
  const [mission, setMission] = useState(initialMission);
  const [category, setCategory] = useState<Category>(initialMission ? 'troubleshooting' : 'all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string>();
  const [chapterId, setChapterId] = useState<string>();
  const [chapterPicker, setChapterPicker] = useState(false);
  const [project, setProject] = useState<Project>();
  const [projectError, setProjectError] = useState('');
  const [personalised, setPersonalised] = useState(Boolean(projectId));
  useFocusEffect(useCallback(() => {
    if (!projectId) { setProject(undefined); setProjectError(''); setPersonalised(false); return; }
    try {
      const saved = projectStore.load().find(item => String(item.id) === projectId);
      setProject(saved); setPersonalised(true);
      setProjectError(saved?.assessment ? '' : 'No saved assessment for this project. All resources are available below.');
    } catch { setProject(undefined); setProjectError('Couldn’t read the project assessment. All resources are available below.'); }
  }, [projectId]));
  const guidance = project ? recommendProject(project) : null;
  const source = personalised && guidance ? matchProjectResources(library, guidance) : library;
  const results = searchLibrary(source, query, category, mission?.id, chapterId);

  return <View style={[styles.screen, { paddingTop: top }]}><FlatList
    data={results}
    keyExtractor={item => item.id}
    keyboardShouldPersistTaps="handled"
    style={styles.list}
    contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom, 20) }]}
    ListHeaderComponent={<View style={styles.header}>
      <View style={styles.navigation}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => {
          if (router.canGoBack()) router.back(); else router.replace('/missions');
        }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Help</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Resource Library</Text>
        <Text style={styles.body}>Look up a concept, find a fix, or copy a prompt.</Text>
        <Text style={styles.meta}>{articles.length} handbook sections · {articles.reduce((sum, article) => sum + article.prompts.length, 0)} handbook prompts · {glossary.length} glossary terms</Text>
        <View style={styles.field}>
        <Text style={styles.meta}>Search resources</Text>
        <View style={styles.search}>
        <Ionicons name="search-outline" size={25} color={colors.ink} importantForAccessibility="no" />
        <TextInput accessibilityLabel="Search resources" value={query} onChangeText={value => { setQuery(value); setExpandedId(undefined); }}
          placeholder="Search login, backup, testing" placeholderTextColor={colors.muted}
          autoCapitalize="none" returnKeyType="search" style={styles.input} />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setQuery(''); setExpandedId(undefined); }}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
          <Ionicons name="close" size={25} color={colors.ink} importantForAccessibility="no" />
        </Pressable> : null}
        </View>
        </View>
      </View>
      {projectError ? <Text accessibilityRole="alert" style={styles.body}>{projectError}</Text> : null}
      {project && guidance ? <View style={[styles.card, styles.mint]}>
        <Text accessibilityRole="header" style={styles.label}>{personalised ? 'Suggested for' : 'Project'} {project.name}</Text>
        <Text style={styles.body}>{guidance.stage} · {guidance.title}</Text>
        <Text style={styles.body}>{guidance.reason}</Text>
        {guidance.generalOnly && personalised ? <Text style={styles.body}>General handbook references only. A matching guided lab for your tools may not be available.</Text> : null}
        <Text style={styles.meta}>Based on your answers, with related handbook chapters. References may describe different tools; adapt examples to your app.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setPersonalised(previous => !previous); setExpandedId(undefined); setMission(undefined); setChapterId(undefined); }} style={styles.linkButton}>
          <Text style={styles.linkLabel}>{personalised ? 'Browse all resources' : 'Show suggestions for this app'}</Text>
        </Pressable>
        <Link href={{ pathname: '/assessment/[id]', params: { id: String(project.id) } }} style={styles.link}>Review my answers →</Link>
      </View> : null}
      <View style={styles.filters}>
        {filters.map(filter => <Pressable key={filter} accessibilityRole="button" accessibilityState={{ selected: filter === category }}
          onPress={() => { setCategory(filter); setExpandedId(undefined); }}
          style={({ pressed }) => [styles.filter, category === filter && styles.selected, pressed && styles.pressed]}>
          <Ionicons name={categoryIcons[filter]} size={23} color={category === filter ? colors.white : colors.ink} importantForAccessibility="no" />
          <Text style={[styles.filterLabel, category === filter && styles.selectedLabel]}>{categories[filter]}</Text>
        </Pressable>)}
      </View>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: chapterPicker }} onPress={() => setChapterPicker(previous => !previous)} style={styles.row}>
          <View style={styles.rowText}><Text style={styles.label}>Browse handbook chapters</Text><Text style={styles.meta}>{chapterId ? chapters.find(([id]) => id === chapterId)?.[1] : 'All chapters and Print Pack'}</Text></View>
          <Ionicons name={chapterPicker ? 'chevron-up' : 'chevron-down'} size={23} color={colors.purple} importantForAccessibility="no" />
        </Pressable>
        {chapterPicker ? <View accessibilityRole="radiogroup" accessibilityLabel="Handbook chapter">
          {[[undefined, 'All chapters'], ...chapters].map(([id, title]) => <Pressable key={id ?? 'all'} accessibilityRole="radio"
            accessibilityState={{ checked: chapterId === id }} onPress={() => { setChapterId(id); setChapterPicker(false); setPersonalised(false); setMission(undefined); setCategory(id ? 'learn' : 'all'); setExpandedId(undefined); }}
            style={styles.linkButton}><Text style={styles.linkLabel}>{id === undefined ? title : `${id === 'P' ? 'Print Pack' : `Chapter ${id}`} · ${title}`}</Text></Pressable>)}
        </View> : null}
      </View>
      {mission ? <View style={styles.card}>
        <Text style={styles.body}>Showing resources for {mission.lessonTitle}.</Text>
        <Pressable accessibilityRole="button" onPress={() => setMission(undefined)} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
          <Text style={styles.linkLabel}>Show all missions</Text>
        </Pressable>
      </View> : null}
      {!query.trim() && category === 'all' && !mission && !(personalised && guidance) ? <View style={[styles.card, styles.course]}>
        <View style={[styles.iconBadge, styles.mint]}><Ionicons name="book-outline" size={29} color={colors.ink} importantForAccessibility="no" /></View>
        <View style={styles.rowText}>
        <Text accessibilityRole="header" style={styles.label}>Kotlin and Jetpack Compose</Text>
        <Text style={styles.body}>A separate Android learning track. BuildWisp’s missions use Expo and TypeScript.</Text>
        <Link href="https://developer.android.com/courses/android-basics-compose/course" style={styles.link}>Open Android Basics with Compose ↗</Link>
        </View>
      </View> : null}
      <Text accessibilityLiveRegion="polite" style={styles.label}>{results.length} {results.length === 1 ? 'resource' : 'resources'}</Text>
    </View>}
    ListEmptyComponent={<View style={styles.card}>
      <Text accessibilityRole="header" style={styles.label}>No matching resources</Text>
      <Text style={styles.body}>Try a shorter keyword, or choose All to search across categories.</Text>
    </View>}
    ListFooterComponent={<Text style={styles.footnote}>Library content works offline. External links need internet.</Text>}
    renderItem={({ item }) => {
      const expanded = expandedId === item.id;
      return <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          onPress={() => setExpandedId(expanded ? undefined : item.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.iconBadge}><Ionicons name={categoryIcons[item.kind]} size={27} color={colors.ink} importantForAccessibility="no" /></View>
          <View style={styles.rowText}><Text style={styles.label}>{item.title}</Text>
          <Text style={styles.meta}>{categories[item.kind]} · {item.subtitle}</Text></View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={23} color={colors.ink} importantForAccessibility="no" />
        </Pressable>
        {expanded ? <ResourceContent resource={item} /> : null}
      </View>;
    }}
  /></View>;
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  header: { gap: 20 },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 64 },
  hero: { gap: 12 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  field: { gap: 8 },
  search: { ...clay, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 4, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.controlLine },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 12, color: colors.ink, fontSize: 16 },
  clear: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filter: { ...clay, minHeight: 48, maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, backgroundColor: colors.card },
  filterLabel: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  selected: { backgroundColor: colors.purple },
  selectedLabel: { color: colors.white },
  card: { ...clay, padding: 16, gap: 12, borderRadius: 24, backgroundColor: colors.card },
  course: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mint: { backgroundColor: colors.mint },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 6 },
  iconBadge: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 16 },
  detail: { gap: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.track },
  label: { color: colors.ink, fontWeight: '800', fontSize: 18, lineHeight: 26 },
  body: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  link: { minHeight: 48, color: colors.purple, fontSize: 16, lineHeight: 24, fontWeight: '800', textAlignVertical: 'center' },
  linkButton: { minHeight: 48, justifyContent: 'center' },
  linkLabel: { color: colors.purple, fontSize: 16, fontWeight: '800' },
  primary: { ...clay, minHeight: 54, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 22, justifyContent: 'center', backgroundColor: colors.purple },
  primaryLabel: { color: colors.white, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  pressed: { opacity: 0.75 },
  prompt: { padding: 14, borderRadius: 18, color: colors.ink, backgroundColor: colors.background, fontSize: 16, lineHeight: 24 },
  footnote: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', paddingVertical: 8 },
});
