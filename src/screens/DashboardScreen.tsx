import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, font, radius, gradients } from '../theme/theme';
import { Card, Pill, SectionTitle, Label } from '../components/ui';
import ManeuverIcon from '../components/ManeuverIcon';
import { mockRoute } from '../data/mock';
import { NavInstruction } from '../types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [route] = useState<NavInstruction[]>(mockRoute);
  const current = route[0];
  const upcoming = route.slice(1);

  // Pulsing glow behind the maneuver icon.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.5] });

  return (
    <LinearGradient colors={gradients.screen} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PULSAR</Text>
            <Text style={styles.brandSub}>NAV BRIDGE · N160</Text>
          </View>
          <Pill label="MIRRORING" tone="success" />
        </View>

        {/* Hero maneuver card */}
        <Card glow style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.iconWrap}>
              <Animated.View
                style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]}
              />
              <ManeuverIcon maneuver={current.maneuver} size={96} />
            </View>
            <View style={styles.heroMeta}>
              <Label>Distance to turn</Label>
              <Text style={styles.distance}>{current.distanceText}</Text>
              <Text style={styles.road}>{current.road}</Text>
            </View>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instruction}>{current.instruction}</Text>
          </View>
          <View style={styles.tripRow}>
            <Trip label="ETA" value={current.eta ?? '--'} />
            <View style={styles.divider} />
            <Trip label="REMAINING" value={current.remaining ?? '--'} />
            <View style={styles.divider} />
            <Trip label="SENT TO BIKE" value="✓" accent />
          </View>
        </Card>

        {/* Upcoming list */}
        <View style={styles.section}>
          <SectionTitle>Upcoming</SectionTitle>
          {upcoming.map((step, i) => (
            <Card key={i} style={styles.stepCard}>
              <ManeuverIcon maneuver={step.maneuver} size={34} color={colors.blue} />
              <View style={styles.stepText}>
                <Text style={styles.stepInstruction} numberOfLines={1}>
                  {step.instruction}
                </Text>
                <Text style={styles.stepRoad}>{step.road}</Text>
              </View>
              <Text style={styles.stepDist}>{step.distanceText}</Text>
            </Card>
          ))}
        </View>

        {/* Raw notification feed */}
        <View style={styles.section}>
          <SectionTitle>Parsed from Google Maps</SectionTitle>
          <Card>
            {route.map((r, i) => (
              <View key={i} style={[styles.feedRow, i === route.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.feedTime}>{new Date(r.timestamp).toLocaleTimeString()}</Text>
                <Text style={styles.feedText} numberOfLines={1}>
                  {r.maneuver} · {r.distanceText}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function Trip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.trip}>
      <Text style={styles.tripLabel}>{label}</Text>
      <Text style={[styles.tripValue, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brand: { color: colors.text, fontSize: font.sizes.h1, fontWeight: font.weight.bold, letterSpacing: 4 },
  brandSub: { color: colors.accent, fontSize: font.sizes.caption, letterSpacing: 3, marginTop: 2 },
  hero: { marginBottom: spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
  },
  heroMeta: { flex: 1, marginLeft: spacing.md },
  distance: { color: colors.text, fontSize: 52, fontWeight: font.weight.bold, letterSpacing: -1 },
  road: { color: colors.textDim, fontSize: font.sizes.body, marginTop: 2 },
  instructionRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instruction: { color: colors.text, fontSize: font.sizes.title, fontWeight: font.weight.medium },
  tripRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  trip: { flex: 1 },
  tripLabel: { color: colors.textFaint, fontSize: font.sizes.caption, letterSpacing: 1, marginBottom: 4 },
  tripValue: { color: colors.text, fontSize: font.sizes.title, fontWeight: font.weight.semibold },
  divider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.md },
  section: { marginBottom: spacing.xl },
  stepCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: spacing.md },
  stepText: { flex: 1, marginLeft: spacing.md },
  stepInstruction: { color: colors.text, fontSize: font.sizes.body, fontWeight: font.weight.medium },
  stepRoad: { color: colors.textDim, fontSize: font.sizes.small, marginTop: 1 },
  stepDist: { color: colors.blue, fontSize: font.sizes.body, fontWeight: font.weight.semibold },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feedTime: { color: colors.textFaint, fontSize: font.sizes.caption, fontFamily: font.mono },
  feedText: { color: colors.textDim, fontSize: font.sizes.small, fontFamily: font.mono },
});
