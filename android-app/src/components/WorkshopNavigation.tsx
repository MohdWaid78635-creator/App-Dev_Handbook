import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from './Link';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { homeColors as c } from '../theme';

const items = [
  { label: 'Home', icon: 'home-outline', href: '/' },
  { label: 'Missions', icon: 'compass-outline', href: '/missions' },
  { label: 'Projects', icon: 'folder-outline', href: '/project' },
  { label: 'Review', icon: 'albums-outline', href: '/review' },
] as const;

export function WorkshopNavigation({ selected }: { selected: typeof items[number]['label'] }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[s.area, { paddingBottom: Math.max(bottom, 12) }]}>
      <View style={s.nav}>
        {items.map(({ label, icon, href }) => (
          <Link key={label} href={href} asChild>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: label === selected }}
              style={({ pressed }) => [s.item, pressed && s.pressed]}>
              <Ionicons name={icon} size={26} color={label === selected ? c.purple : c.muted} importantForAccessibility="no" />
              <Text style={[s.label, label === selected && s.selected]}>{label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  area: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: c.background },
  nav: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', borderRadius: 26, paddingVertical: 8, backgroundColor: c.card,
    boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 12, color: '#39205B18' },
      { offsetX: 2, offsetY: 2, blurRadius: 5, color: '#FFFFFFA0', inset: true }] },
  item: { flex: 1, minWidth: 0, minHeight: 54, gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingHorizontal: 2 },
  label: { maxWidth: '100%', flexShrink: 1, fontSize: 12, fontWeight: '700', textAlign: 'center', color: c.muted },
  selected: { color: c.purple },
  pressed: { opacity: 0.65 },
});
