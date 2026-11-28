import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from '../src/components/Link';
import { homeColors as c } from '../src/theme';

export default function StartScreen() {
  const { top, bottom } = useSafeAreaInsets();
  return <ScrollView style={[s.screen, { paddingTop: top }]} contentContainerStyle={[s.content, { paddingBottom: Math.max(bottom, 24) }]}>
    <View style={s.column}>
      <Link href="/" dismissTo style={s.back}>← Home</Link>
      <Text style={s.eyebrow}>A PATH FOR EVERY BUILDER</Text>
      <Text accessibilityRole="header" style={s.title}>Where are you starting?</Text>
      <Text style={s.body}>A fresh idea or an app in progress. We’ll help you find the next step.</Text>
      <Image source={require('../assets/clay-workshop.png')} style={s.art} accessible={false} />
      <Link href="/getting-started" asChild><Pressable accessibilityRole="link" style={({ pressed }) => [s.card, pressed && s.pressed]}>
        <Text style={s.eyebrow}>FRESH START</Text><Text style={s.heading}>I’m starting a new app</Text>
        <Text style={s.body}>Go from an idea to your first working screen.</Text>
        <Ionicons name="arrow-forward" size={24} color={c.purple} importantForAccessibility="no" />
      </Pressable></Link>
      <Link href={{ pathname: '/project', params: { assess: '1' } }} asChild><Pressable accessibilityRole="link" style={({ pressed }) => [s.card, s.mint, pressed && s.pressed]}>
        <Text style={s.eyebrow}>PICK UP WHERE YOU ARE</Text><Text style={s.heading}>I already have an app</Text>
        <Text style={s.body}>Find what needs attention and what to do next.</Text>
        <Ionicons name="arrow-forward" size={24} color={c.purple} importantForAccessibility="no" />
      </Pressable></Link>
      <Link href="/help" style={s.back}>Just browse the resources →</Link>
    </View>
  </ScrollView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, content: { padding: 24 },
  column: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 18 },
  title: { color: c.ink, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  heading: { color: c.ink, fontSize: 23, fontWeight: '800' },
  eyebrow: { color: c.purple, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  body: { color: c.muted, fontSize: 16, lineHeight: 25 },
  back: { color: c.purple, fontSize: 16, fontWeight: '700', paddingVertical: 16, minHeight: 48 },
  art: { width: 145, height: 125, resizeMode: 'contain', alignSelf: 'center' },
  card: { backgroundColor: c.card, padding: 24, borderRadius: 28, gap: 12, minHeight: 160,
    boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 14, color: '#39205B18' }, { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] },
  mint: { backgroundColor: c.mint }, pressed: { opacity: 0.75 },
});
