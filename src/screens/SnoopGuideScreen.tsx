import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, font, radius, gradients } from '../theme/theme';
import { Card, SectionTitle, Label, Mono } from '../components/ui';

interface Step {
  title: string;
  body: string;
  cmd?: string;
}

const STEPS: Step[] = [
  {
    title: 'Enable Developer Options',
    body: 'On your phone: Settings → About phone → tap "Build number" 7 times. Developer Options now appears under System.',
  },
  {
    title: 'Turn on Bluetooth HCI snoop log',
    body: 'Developer Options → "Enable Bluetooth HCI snoop log" → set to "Enabled". Then toggle Bluetooth OFF and ON so logging starts fresh.',
  },
  {
    title: 'Reproduce the behaviour',
    body: 'Open the official Bajaj Ride Connect app, connect to the cluster, and start a navigation so the bike shows turn arrows. Trigger the SAME turn type twice — we need two captures of one prompt to diff them.',
  },
  {
    title: 'Pull the log over ADB',
    body: 'Connect the phone to this Mac with USB debugging enabled, then dump the bug report which contains the snoop log:',
    cmd: 'adb bugreport bajaj_snoop.zip',
  },
  {
    title: 'Locate the btsnoop file',
    body: 'Unzip the bug report and find the snoop log under FS/data/misc/bluetooth/logs/ (older devices: /sdcard/btsnoop_hci.log).',
    cmd: 'unzip bajaj_snoop.zip -d snoop && find snoop -name "*btsnoop*"',
  },
  {
    title: 'Open in Wireshark',
    body: 'Open the btsnoop_hci.log in Wireshark. Filter for ATT writes to the cluster — these carry the turn packets:',
    cmd: 'btatt.opcode == 0x52 || btatt.opcode == 0x12',
  },
  {
    title: 'Diff two identical turns  ⚠ GO / NO-GO',
    body: 'Compare the write payloads for the two identical turn prompts. If the bytes are IDENTICAL → static protocol → feasible: copy them into the Dev Console. If they DIFFER each time → the cluster uses a session nonce/encryption and simple replay will not work.',
  },
];

export default function SnoopGuideScreen() {
  const insets = useSafeAreaInsets();
  const [done, setDone] = useState<Record<number, boolean>>({});
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <LinearGradient colors={gradients.screen} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Snoop Log Guide</Text>
          <Text style={styles.subtitle}>Capture the official app's Bluetooth traffic</Text>
        </View>

        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Label>Progress</Label>
            <Text style={styles.progressCount}>{completed} / {STEPS.length}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${(completed / STEPS.length) * 100}%` }]} />
          </View>
        </Card>

        <View style={{ height: spacing.lg }} />
        <SectionTitle>Steps</SectionTitle>

        {STEPS.map((s, i) => {
          const isGate = s.title.includes('GO');
          return (
            <Pressable key={i} onPress={() => setDone(d => ({ ...d, [i]: !d[i] }))}>
              <Card style={[styles.stepCard, isGate && styles.gateCard]}>
                <View style={styles.stepHead}>
                  <View style={[styles.checkbox, done[i] && styles.checkboxOn]}>
                    {done[i] && <Text style={styles.check}>✓</Text>}
                  </View>
                  <Text style={[styles.stepTitle, isGate && { color: colors.warning }]}>
                    {i + 1}. {s.title}
                  </Text>
                </View>
                <Text style={styles.stepBody}>{s.body}</Text>
                {s.cmd && (
                  <View style={styles.cmdBox}>
                    <Text style={styles.cmdPrompt}>$ </Text>
                    <Mono style={styles.cmd}>{s.cmd}</Mono>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}

        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>Why two captures?</Text>
          <Text style={styles.tipBody}>
            The single most important question for this project is whether the cluster protocol is
            replayable. Diffing two identical turn prompts answers it before you invest in the full
            integration. Identical bytes = green light.
          </Text>
        </Card>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: font.sizes.h1, fontWeight: font.weight.bold },
  subtitle: { color: colors.textDim, fontSize: font.sizes.small, marginTop: 2 },
  progressCard: {},
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  progressCount: { color: colors.accent, fontSize: font.sizes.title, fontWeight: font.weight.bold, fontFamily: font.mono },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  stepCard: { marginBottom: spacing.sm },
  gateCard: { borderColor: colors.warning },
  stepHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.black, fontSize: 13, fontWeight: font.weight.bold },
  stepTitle: { flex: 1, color: colors.text, fontSize: font.sizes.body, fontWeight: font.weight.semibold },
  stepBody: { color: colors.textDim, fontSize: font.sizes.small, lineHeight: 20, marginLeft: 34 },
  cmdBox: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    marginLeft: 34,
  },
  cmdPrompt: { color: colors.accent, fontFamily: font.mono, fontSize: font.sizes.small },
  cmd: { color: colors.text, flex: 1 },
  tipCard: { marginTop: spacing.md, backgroundColor: colors.bgElevated, borderColor: colors.accentDim },
  tipTitle: { color: colors.accent, fontSize: font.sizes.body, fontWeight: font.weight.semibold, marginBottom: spacing.sm },
  tipBody: { color: colors.textDim, fontSize: font.sizes.small, lineHeight: 20 },
});
