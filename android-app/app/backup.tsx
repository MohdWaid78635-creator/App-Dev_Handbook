import Ionicons from '@expo/vector-icons/Ionicons';
import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Link, usePreventRemove } from 'expo-router';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backupService } from '../src/backup/local';
import { maxBackupBytes } from '../src/backup/service';
import { useProgress } from '../src/progress/provider';
import { homeColors as colors } from '../src/theme';

type Preview = ReturnType<typeof backupService.preview>;

function Action({ label, onPress, disabled, primary = false, icon }: {
  label: string; onPress: () => void; disabled: boolean; primary?: boolean;
  icon?: 'share-social-outline' | 'folder-outline' | 'refresh-outline';
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, (disabled || pressed) && styles.dim]}>
    {icon ? <Ionicons name={icon} size={24} color={primary ? colors.white : colors.purple} importantForAccessibility="no" /> : null}
    <Text style={[styles.actionLabel, primary && styles.primaryLabel]}>{label}</Text>
  </Pressable>;
}

export default function BackupScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { reloadProgress } = useProgress();
  const [selected, setSelected] = useState<{ name: string; text: string; preview: Preview }>();
  const [operation, setOperation] = useState('');
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const running = useRef(false);
  usePreventRemove(Boolean(operation));

  async function run(label: string, work: () => Promise<void>, fallback: string) {
    if (running.current) return;
    running.current = true;
    setOperation(label);
    setNotice(undefined);
    try {
      await work();
    } catch {
      setNotice({ text: fallback, error: true });
    } finally {
      running.current = false;
      setOperation('');
    }
  }

  function exportBackup() {
    void run('Preparing backup…', async () => {
      if (!await isAvailableAsync()) {
        setNotice({ text: 'File sharing is unavailable on this device.', error: true });
        return;
      }
      const now = new Date();
      const text = backupService.exportBackup(now);
      const file = new File(Paths.cache, `BuildWisp-backup-${now.toISOString().replace(/[:.]/g, '-')}.json`);
      file.create();
      await file.write(text);
      if (file.size > maxBackupBytes) {
        setNotice({ text: 'The backup is too large to restore. The limit is 8 MB.', error: true });
        return;
      }
      await shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save or share BuildWisp backup' });
    }, 'Couldn’t export the backup. Try again.');
  }

  function chooseBackup() {
    void run('Opening backup…', async () => {
      const result = await getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      setSelected(undefined);
      const asset = result.assets[0];
      const file = new File(asset.uri);
      if (Math.max(asset.size ?? 0, file.size) > maxBackupBytes) {
        setNotice({ text: 'Choose a backup file no larger than 8 MB.', error: true });
        return;
      }
      const text = await file.text();
      try {
        setSelected({ name: asset.name, text, preview: backupService.preview(text) });
        scroll.current?.scrollTo({ y: 0, animated: false });
      } catch (error) {
        setNotice({ text: error instanceof Error ? error.message : 'This backup could not be read.', error: true });
      }
    }, 'Couldn’t read the selected file. Try choosing it again.');
  }

  function confirmRestore() {
    if (!selected || running.current) return;
    const { text } = selected;
    Alert.alert('Replace saved BuildWisp data?',
      'Restoring replaces the projects, progress, practice history, and release reviews on this device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace and restore', style: 'destructive', onPress: () => {
          void run('Restoring backup…', async () => {
            await backupService.restore(text);
            setSelected(undefined);
            scroll.current?.scrollTo({ y: 0, animated: false });
            const refreshed = reloadProgress();
            setNotice({ text: refreshed ? 'Backup restored. Your saved data is ready.' : 'Backup restored. Reopen BuildWisp to refresh your progress.' });
          }, 'Couldn’t restore the backup. Your saved data was kept. Try again.');
        } },
      ], { cancelable: true });
  }

  const busy = Boolean(operation);
  return <View style={[styles.screen, { paddingTop: top }]}>
  <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.navigation}>
        <Link href="/missions" dismissTo asChild>
          <Pressable accessibilityRole="link" accessibilityState={{ disabled: busy }} disabled={busy}
            style={({ pressed }) => [styles.back, (busy || pressed) && styles.dim]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} importantForAccessibility="no" />
            <Text style={styles.backLabel}>Missions</Text>
          </Pressable>
        </Link>
        <Text accessibilityRole="header" style={styles.headerTitle}>Backup</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>{selected ? 'Restore from a file' : 'Backup and Restore'}</Text>
        <Text style={styles.body}>{selected ? 'Review this backup before continuing.' : 'Keep a copy of your projects, learning progress, practice, and release reviews.'}</Text>
      </View>
      {operation || notice ? <Text accessibilityRole={notice?.error ? 'alert' : undefined}
        accessibilityLiveRegion="polite" style={[styles.notice, notice?.error && styles.warning]}>{operation || notice?.text}</Text> : null}
      {!selected ? <>
      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <View style={[styles.iconBadge, styles.mint]}><Ionicons name="document-outline" size={30} color={colors.ink} importantForAccessibility="no" /></View>
          <Text accessibilityRole="header" style={styles.heading}>Export a backup</Text>
        </View>
        <Text style={styles.body}>Save the JSON file somewhere you can find it again. It includes your project notes and evidence.</Text>
        <Action label="Save or share backup" icon="share-social-outline" onPress={exportBackup} disabled={busy} primary />
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <View style={styles.iconBadge}><Ionicons name="folder-outline" size={30} color={colors.ink} importantForAccessibility="no" /></View>
          <Text accessibilityRole="header" style={styles.heading}>Restore from a file</Text>
        </View>
        <Text style={styles.body}>Choose a BuildWisp backup to preview its contents.</Text>
        <Action label="Choose backup file" onPress={chooseBackup} disabled={busy} />
        <Text style={styles.footnote}>BuildWisp JSON backups · Up to 8 MB</Text>
      </View>
      <View style={[styles.notice, styles.warning, styles.warningRow]}>
        <Ionicons name="warning-outline" size={28} color={colors.attention} importantForAccessibility="no" />
        <Text style={styles.warningText}>Restoring replaces saved data on this device. You will confirm before anything changes.</Text>
      </View>
      </> : <>
        <Action label="Choose a different backup" icon="folder-outline" onPress={chooseBackup} disabled={busy} />
        <View style={styles.card}>
          <Text style={styles.kicker}>BACKUP PREVIEW</Text>
          <View style={styles.cardHeading}>
            <Ionicons name="document-outline" size={30} color={colors.ink} importantForAccessibility="no" />
            <View style={styles.fileDetails}>
              <Text accessibilityRole="header" style={styles.label}>{selected.name}</Text>
              <Text style={styles.body}>Created {new Date(selected.preview.createdAt).toLocaleString()}</Text>
            </View>
          </View>
          {([
            ['folder-outline', 'Projects', selected.preview.projects],
            ['layers-outline', 'Release reviews', selected.preview.releaseReviews],
            ['help-circle-outline', 'Quiz records', selected.preview.quizAnswers],
            ['calendar-outline', 'Daily answers', selected.preview.dailyAnswers],
            ['albums-outline', 'Reviewed flashcards', selected.preview.flashcards],
          ] as const).map(([icon, label, count]) => <View key={label} style={styles.countRow}>
            <Ionicons name={icon} size={25} color={colors.ink} importantForAccessibility="no" />
            <Text style={styles.countLabel}>{label}</Text><Text style={styles.label}>{count}</Text>
          </View>)}
        </View>
        <View style={[styles.notice, styles.warning, styles.warningRow]}>
          <Ionicons name="warning-outline" size={28} color={colors.attention} importantForAccessibility="no" />
          <View style={styles.fileDetails}>
            <Text style={styles.label}>Replaces saved data</Text>
            <Text style={styles.warningText}>Projects, progress, practice history, and release reviews on this device will be replaced.</Text>
          </View>
        </View>
        <Action label="Restore this backup" icon="refresh-outline" onPress={confirmRestore} disabled={busy} primary />
        <Text style={styles.footnote}>Next: confirm replacement or cancel.</Text>
      </>}
    </View>
  </ScrollView></View>;
}

const clay = { boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: '#39205B18' },
  { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  backLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 64 },
  hero: { gap: 12 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  card: { ...clay, padding: 20, gap: 16, borderRadius: 28, backgroundColor: colors.card },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBadge: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  mint: { backgroundColor: colors.mint },
  heading: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 25, flexShrink: 1 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  action: { ...clay, minHeight: 56, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.purple, backgroundColor: colors.card },
  actionLabel: { color: colors.purple, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.white },
  dim: { opacity: 0.8 },
  notice: { padding: 16, borderRadius: 22, backgroundColor: colors.card, color: colors.ink, fontSize: 16, lineHeight: 24 },
  warning: { backgroundColor: colors.attentionSurface },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  warningText: { flexShrink: 1, color: colors.ink, fontSize: 16, lineHeight: 24 },
  fileDetails: { flex: 1, gap: 6 },
  kicker: { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  countRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 12 },
  countLabel: { flex: 1, color: colors.ink, fontSize: 16, lineHeight: 24 },
  footnote: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
