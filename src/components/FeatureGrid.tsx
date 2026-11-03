import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { IconTile, Text, type IconName } from '@/components/ui';
import { type Accent, colors, radius, shadow, space, themed } from '@/constants/brand';

export interface Feature { label: string; hint: string; icon: IconName; accent: Accent; href: Href; badge?: number }

/** App-style shortcuts: four per row, icon above a short label, inside one card. */
export function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <View style={styles.card}>
      {items.map((f) => (
        <Pressable key={f.label} accessibilityRole="button" accessibilityLabel={`${f.label}. ${f.hint}${f.badge ? `. ${f.badge} new` : ''}`}
          onPress={() => router.push(f.href)} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
          <View>
            <IconTile icon={f.icon} accent={f.accent} size={48} />
            {f.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{f.badge > 9 ? '9+' : f.badge}</Text></View> : null}
          </View>
          <Text style={styles.label} numberOfLines={2}>{f.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: space.md, paddingHorizontal: space.xs, borderRadius: radius.xl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadow },
  item: { width: '25%', alignItems: 'center', paddingVertical: space.sm, paddingHorizontal: 2, gap: 6 },
  label: { fontSize: 12, lineHeight: 15, fontWeight: '600', color: colors.navy, textAlign: 'center' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
}));
