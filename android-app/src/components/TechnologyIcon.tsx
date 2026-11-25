import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { ComponentProps } from 'react';
import { homeColors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const icons: Record<string, Record<string, IconName>> = {
  target: { android: 'android', ios: 'apple', mobile: 'cellphone', web: 'web', undecided: 'help-circle-outline' },
  computer: { mac: 'apple', windows: 'microsoft-windows', linux: 'linux' },
  stack: { 'expo-ts': 'language-typescript', 'expo-js': 'language-javascript', kotlin: 'language-kotlin',
    java: 'language-java', swift: 'language-swift', react: 'react', 'web-js': 'language-html5' },
  data: { none: 'database-off-outline', sqlite: 'database', indexeddb: 'web', supabase: 'database-outline', firebase: 'firebase', postgres: 'server' },
  auth: { none: 'account-off-outline', supabase: 'shield-account-outline', firebase: 'firebase', clerk: 'account-key-outline' },
};

export function TechnologyIcon({ field, value, size = 24 }: { field: string; value: string; size?: number }) {
  if (field === 'stack' && value === 'flutter') return <FontAwesome6 name="flutter" iconStyle="brand" size={size}
    color={homeColors.purple} importantForAccessibility="no" />;
  if (!icons[field]) return null;
  return <MaterialCommunityIcons name={icons[field][value] ?? 'help-circle-outline'} size={size}
    color={homeColors.purple} importantForAccessibility="no" />;
}
