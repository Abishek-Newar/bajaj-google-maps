import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, font, radius, gradients } from '../theme/theme';
import { Card, SectionTitle, PrimaryButton, Label, Mono, GhostButton } from '../components/ui';
import { mockCharacteristics, mockPacketLog } from '../data/mock';
import { PacketLog } from '../types';

const PRESETS: Array<{ label: string; hex: string }> = [
  { label: 'Turn L', hex: 'AA 02 01 2C 01 D4' },
  { label: 'Turn R', hex: 'AA 02 02 2C 01 D5' },
  { label: 'Roundabout', hex: 'AA 02 05 03 52 5C' },
  { label: 'Straight', hex: 'AA 02 00 00 00 02' },
  { label: 'Arrive', hex: 'AA 02 0F 00 00 11' },
];

const HEX_RE = /^[0-9a-fA-F\s]*$/;

export default function DeveloperConsoleScreen() {
  const insets = useSafeAreaInsets();
  const [hex, setHex] = useState('AA 02 01 2C 01 D4');
  const [selectedChar, setSelectedChar] = useState(mockCharacteristics[0].uuid);
  const [log, setLog] = useState<PacketLog[]>(mockPacketLog);

  const writable = mockCharacteristics.filter(c =>
    c.properties.some(p => p === 'write' || p === 'writeNoResponse'),
  );

  const valid = HEX_RE.test(hex) && hex.replace(/\s/g, '').length % 2 === 0 && hex.trim().length > 0;
  const byteCount = hex.replace(/\s/g, '').length / 2;

  const send = () => {
    if (!valid) return;
    const normalized = hex.replace(/\s+/g, '').toUpperCase().match(/.{2}/g)?.join(' ') ?? hex;
    const entry: PacketLog = {
      id: Date.now().toString(),
      direction: 'tx',
      hex: normalized,
      charUuid: selectedChar.slice(0, 8),
      timestamp: Date.now(),
    };
    setLog(prev => [entry, ...prev]);
  };

  return (
    <LinearGradient colors={gradients.screen} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dev Console</Text>
          <Text style={styles.subtitle}>Reverse-engineer the cluster protocol</Text>
        </View>

        {/* Characteristic picker */}
        <View style={styles.section}>
          <SectionTitle>Write characteristic</SectionTitle>
          {writable.map(c => (
            <Pressable key={c.uuid} onPress={() => setSelectedChar(c.uuid)}>
              <Card style={[styles.charCard, c.uuid === selectedChar && styles.charSelected]}>
                <View style={[styles.charDot, c.uuid === selectedChar && { backgroundColor: colors.accent }]} />
                <View style={{ flex: 1 }}>
                  <Mono style={{ color: colors.text }}>{c.uuid}</Mono>
                  <Text style={styles.charSvc}>svc {c.serviceUuid.slice(0, 8)} · {c.properties.join(', ')}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Hex composer */}
        <View style={styles.section}>
          <SectionTitle>Payload</SectionTitle>
          <Card>
            <View style={styles.inputHeader}>
              <Label>Hex bytes</Label>
              <Text style={[styles.byteCount, !valid && hex.length > 0 && { color: colors.danger }]}>
                {valid ? `${byteCount} bytes` : 'invalid hex'}
              </Text>
            </View>
            <TextInput
              value={hex}
              onChangeText={setHex}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="AA 02 01 ..."
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              multiline
            />
            <View style={styles.presetRow}>
              {PRESETS.map(p => (
                <GhostButton key={p.label} title={p.label} onPress={() => setHex(p.hex)} style={styles.preset} />
              ))}
            </View>
            <PrimaryButton title="SEND PACKET" onPress={send} disabled={!valid} style={{ marginTop: spacing.md }} />
          </Card>
        </View>

        {/* Packet log */}
        <View style={styles.section}>
          <View style={styles.logHeader}>
            <SectionTitle>Packet log</SectionTitle>
            <Pressable onPress={() => setLog([])}>
              <Text style={styles.clear}>CLEAR</Text>
            </Pressable>
          </View>
          <Card style={{ padding: 0 }}>
            {log.length === 0 ? (
              <Text style={styles.empty}>No packets yet.</Text>
            ) : (
              log.map((entry, i) => (
                <View key={entry.id} style={[styles.logRow, i === log.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.dirTag, entry.direction === 'tx' ? styles.tx : styles.rx]}>
                    <Text style={[styles.dirText, { color: entry.direction === 'tx' ? colors.accent : colors.blue }]}>
                      {entry.direction.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Mono>{entry.hex}</Mono>
                    {entry.note && <Text style={styles.note}>{entry.note}</Text>}
                  </View>
                  <Text style={styles.logTime}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                </View>
              ))
            )}
          </Card>
        </View>

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
  section: { marginBottom: spacing.xl },
  charCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: spacing.md },
  charSelected: { borderColor: colors.accent },
  charDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginRight: spacing.md },
  charSvc: { color: colors.textFaint, fontSize: font.sizes.caption, marginTop: 2 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  byteCount: { color: colors.accent, fontSize: font.sizes.caption, fontFamily: font.mono },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.accent,
    fontFamily: font.mono,
    fontSize: font.sizes.title,
    padding: spacing.md,
    minHeight: 60,
    textAlignVertical: 'top',
    letterSpacing: 2,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  preset: { paddingVertical: 8, paddingHorizontal: spacing.md },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clear: { color: colors.textDim, fontSize: font.sizes.caption, fontWeight: font.weight.semibold, letterSpacing: 1 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dirTag: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginRight: spacing.md },
  tx: { backgroundColor: 'rgba(22,224,200,0.1)' },
  rx: { backgroundColor: 'rgba(46,156,255,0.1)' },
  dirText: { fontSize: 9, fontWeight: font.weight.bold, letterSpacing: 1 },
  note: { color: colors.textFaint, fontSize: font.sizes.caption, marginTop: 2 },
  logTime: { color: colors.textFaint, fontSize: 10, fontFamily: font.mono, marginLeft: spacing.sm },
  empty: { color: colors.textDim, fontSize: font.sizes.small, textAlign: 'center', padding: spacing.lg },
});
