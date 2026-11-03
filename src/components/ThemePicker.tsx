import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, type IconName } from '@/components/ui';
import { colors, radius, space, themed, type ThemePreference } from '@/constants/brand';
import { useTheme } from '@/state/ThemeProvider';

const OPTIONS: { id: ThemePreference; label: string; icon: IconName }[] = [
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
  { id: 'system', label: 'Match device', icon: 'phone-portrait-outline' },
];

/** Light, dark, or follow the phone's setting. The choice is remembered on this device. */
export function ThemePicker() {
  const { preference, setPreference } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
      {OPTIONS.map((o) => {
        const on = preference === o.id;
        return (
          <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={o.label}
            onPress={() => { if (!on) setPreference(o.id); }} style={({ pressed }) => [styles.option, on && styles.on, pressed && { opacity: 0.85 }]}>
            <Ionicons name={o.icon} size={22} color={on ? colors.red : colors.navy2} />
            <Text style={[styles.label, on && { color: colors.red }]}>{o.label}</Text>
            {on ? <Ionicons name="checkmark-circle" size={16} color={colors.red} style={styles.check} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, padding: space.md },
  option: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface },
  on: { borderColor: colors.red, backgroundColor: colors.selected },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy2 },
  check: { position: 'absolute', top: 6, right: 6 },
}));
