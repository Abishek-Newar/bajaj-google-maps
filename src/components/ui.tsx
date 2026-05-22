import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius, spacing, font, gradients, elevation } from '../theme/theme';

/** A carbon-fiber-ish elevated card. */
export function Card({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}) {
  return (
    <View style={[styles.card, glow && elevation.glow, style]}>
      <View style={styles.cardHairline} />
      {children}
    </View>
  );
}

/** Section heading with an accent tick. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.tick} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function Pill({
  label,
  tone = 'idle',
}: {
  label: string;
  tone?: 'idle' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const toneColor = {
    idle: colors.idle,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    accent: colors.accent,
  }[tone];
  return (
    <View style={[styles.pill, { borderColor: toneColor }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[styles.pillText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  tone = 'accent',
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const grad = tone === 'danger' ? gradients.danger : gradients.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}>
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  active,
  style,
}: {
  title: string;
  onPress?: () => void;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        active && styles.ghostBtnActive,
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}>
      <Text style={[styles.ghostBtnText, active && { color: colors.accent }]}>{title}</Text>
    </Pressable>
  );
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Mono({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.mono, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  cardHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderStrong,
    opacity: 0.6,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  tick: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.sizes.title,
    fontWeight: font.weight.semibold,
    letterSpacing: 0.3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  pillText: { fontSize: font.sizes.small, fontWeight: font.weight.semibold, letterSpacing: 0.4 },
  primaryBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.black,
    fontSize: font.sizes.body,
    fontWeight: font.weight.bold,
    letterSpacing: 0.5,
  },
  ghostBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  ghostBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(22,224,200,0.08)' },
  ghostBtnText: { color: colors.textDim, fontSize: font.sizes.small, fontWeight: font.weight.semibold },
  label: {
    color: colors.textDim,
    fontSize: font.sizes.caption,
    fontWeight: font.weight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mono: { color: colors.text, fontFamily: font.mono, fontSize: font.sizes.small },
});
