import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Link, usePreventRemove } from 'expo-router';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backupService } from '../src/backup/local';
import { maxBackupBytes } from '../src/backup/service';
import { useProgress } from '../src/progress/provider';
import { colors } from '../src/theme';

type Preview = ReturnType<typeof backupService.preview>;

function Action({ label, onPress, disabled, primary = false }: {
  label: string; onPress: () => void; disabled: boolean; primary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, primary && styles.primary, (disabled || pressed) && styles.dim]}>
    <Text style={primary ? styles.primaryLabel : styles.label}>{label}</Text>
  </Pressable>;
}

export default function BackupScreen() {
  const { bottom } = useSafeAreaInsets();
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
            const refreshed = reloadProgress();
            setNotice({ text: refreshed ? 'Backup restored. Your saved data is ready.' : 'Backup restored. Reopen BuildWisp to refresh your progress.' });
          }, 'Couldn’t restore the backup. Your saved data was kept. Try again.');
        } },
      ], { cancelable: true });
  }

  const busy = Boolean(operation);
  return <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: Math.max(bottom, 20) }]}>
    <View style={styles.column}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Backup and Restore</Text>
        <Text style={styles.heroBody}>Keep a copy of your projects, learning progress, practice, and release reviews.</Text>
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Export a backup</Text>
        <Text style={styles.body}>Save the JSON file somewhere you can find it again. It includes your project notes and evidence.</Text>
        <Action label="Save or share backup" onPress={exportBackup} disabled={busy} primary />
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Restore from a file</Text>
        <Text style={styles.body}>Choose a BuildWisp backup to see what it contains before replacing your saved data.</Text>
        <Action label={selected ? 'Choose a different backup' : 'Choose backup file'} onPress={chooseBackup} disabled={busy} />
        {selected ? <View style={styles.preview}>
          <Text accessibilityRole="header" style={styles.label}>{selected.name}</Text>
          <Text style={styles.body}>Created {new Date(selected.preview.createdAt).toLocaleString()}</Text>
          <Text style={styles.body}>{selected.preview.projects} projects · {selected.preview.releaseReviews} release reviews</Text>
          <Text style={styles.body}>{selected.preview.quizAnswers} quiz records · {selected.preview.dailyAnswers} daily answers · {selected.preview.flashcards} reviewed flashcards</Text>
          <Action label="Restore this backup" onPress={confirmRestore} disabled={busy} primary />
        </View> : null}
      </View>
      {operation || notice ? <Text accessibilityRole={notice?.error ? 'alert' : undefined}
        accessibilityLiveRegion="polite" style={styles.notice}>{operation || notice?.text}</Text> : null}
      <Link href="/" dismissTo style={styles.link}>Return to mission map</Link>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { padding: 18 },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 },
  hero: { padding: 20, borderRadius: 22, gap: 8, backgroundColor: colors.hero },
  title: { color: colors.card, fontSize: 28, fontWeight: '900' },
  heroBody: { color: colors.lavender, fontSize: 16, lineHeight: 23 },
  card: { padding: 16, gap: 10, borderColor: colors.line, borderWidth: 1, borderRadius: 18, backgroundColor: colors.card },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  action: { minHeight: 48, padding: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lavender },
  primary: { backgroundColor: colors.purple },
  primaryLabel: { color: colors.card, fontSize: 16, fontWeight: '800' },
  dim: { opacity: 0.8 },
  notice: { padding: 12, borderRadius: 12, backgroundColor: colors.lavender, color: colors.ink, fontSize: 16 },
  preview: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: colors.background },
  link: { minHeight: 48, color: colors.purple, fontSize: 16, fontWeight: '800', textAlignVertical: 'center' },
});
