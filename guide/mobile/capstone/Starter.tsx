import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

export default function Starter() {
  const [checkedIn, setCheckedIn] = useState(false);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>My first habit</Text>
      <Text>Drink a glass of water</Text>
      <Pressable accessibilityRole="button" onPress={() => setCheckedIn(value => !value)} style={styles.button}>
        <Text style={styles.label}>{checkedIn ? 'Undo check-in' : 'Check in'}</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite">{checkedIn ? 'Habit completed!' : 'Ready when you are.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: '#f5f3ff' },
  title: { color: '#201a43', fontSize: 28, fontWeight: '800' },
  button: { backgroundColor: '#5636cf', padding: 14, borderRadius: 12, alignSelf: 'flex-start', minHeight: 48 },
  label: { color: 'white', fontWeight: '700' },
});
