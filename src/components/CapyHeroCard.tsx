import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Capy, type CapyPose } from '@/components/Capy';
import { Text, type IconName } from '@/components/ui';
import { colors, space, themed } from '@/constants/brand';

export type HeroAction = { icon: IconName; label: string; onPress: () => void; primary?: boolean };
export type HeroSlide = { key: string; kicker: string; title: string; pose: CapyPose; capySize?: number; actions: HeroAction[] };

const SLIDE_H = 188;

/**
 * Navy hero card: Cappy on the left, standing on the card's bottom edge; greeting, question and actions on the right.
 * The main action is a labelled pill, the others are round icon buttons. Swipe between slides; dots show where you are.
 *
 * `flush`: runs edge-to-edge from the top of the screen with only the bottom corners rounded, and `top`
 * (the app bar) sits inside it above the slides.
 */
export function CapyHeroCard({ slides, flush, top }: { slides: HeroSlide[]; flush?: boolean; top?: React.ReactNode }) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  return (
    <View>
      <View style={[styles.card, flush ? styles.flush : styles.rounded]}>
        {top}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessibilityRole="adjustable" accessibilityLabel={`${slides[page]?.kicker}. ${slides[page]?.title}`}>
          {width ? slides.map((s) => {
            const primary = s.actions.find((a) => a.primary);
            const others = s.actions.filter((a) => !a.primary);
            return (
              <View key={s.key} style={[styles.slide, { width }]}>
                <View style={styles.capy} pointerEvents="none">
                  <Capy pose={s.pose} size={s.capySize ?? 170} motion="idle" />
                </View>
                <View style={styles.right}>
                  <View>
                    <Text style={styles.kicker} numberOfLines={1}>{s.kicker}</Text>
                    <Text style={styles.title} numberOfLines={3} accessibilityRole="header">{s.title}</Text>
                  </View>
                  <View style={styles.actions}>
                    {primary ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={primary.label} onPress={primary.onPress} hitSlop={4}
                        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
                        <Ionicons name={primary.icon} size={17} color="#fff" />
                        <Text style={styles.pillText} numberOfLines={1}>{primary.label}</Text>
                      </Pressable>
                    ) : null}
                    {others.map((a) => (
                      <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} hitSlop={4}
                        style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
                        <Ionicons name={a.icon} size={19} color="#fff" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            );
          }) : <View style={{ height: SLIDE_H }} />}
        </ScrollView>
      </View>

      {slides.length > 1 ? (
        <View style={styles.dots} importantForAccessibility="no-hide-descendants">
          {slides.map((s, i) => <View key={s.key} style={[styles.dot, i === page && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { backgroundColor: colors.hero, overflow: 'hidden' },
  rounded: { borderRadius: 28 },
  flush: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  slide: { height: SLIDE_H, flexDirection: 'row', overflow: 'hidden' },
  capy: { position: 'absolute', left: space.xs, bottom: -18 },
  right: { marginLeft: '42%', flex: 1, paddingRight: space.lg, paddingTop: space.md, paddingBottom: space.lg, justifyContent: 'space-between' },
  kicker: { color: colors.heroMuted, fontSize: 13, fontWeight: '600' },
  title: { color: colors.heroText, fontSize: 22, lineHeight: 27, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: colors.red, flexShrink: 1 },
  pillText: { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ffffff1f', alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.9 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: space.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { width: 20, backgroundColor: colors.navy },
}));
