import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, font, radius, gradients } from '../theme/theme';
import { Card, Pill, SectionTitle, PrimaryButton, Label, Mono } from '../components/ui';
import { mockDevices } from '../data/mock';
import { BleDevice, BleStatus } from '../types';

export default function BluetoothScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<BleStatus>('idle');
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [connectedId, setConnectedId] = useState<string | null>(null);

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (status === 'scanning') {
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
      ).start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
  }, [status, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Simulated scan — replaced by the native BLE bridge in Phase 3.
  const startScan = () => {
    setStatus('scanning');
    setDevices([]);
    mockDevices.forEach((d, i) => {
      setTimeout(() => setDevices(prev => [...prev, d]), 400 * (i + 1));
    });
    setTimeout(() => setStatus('idle'), 400 * (mockDevices.length + 1));
  };

  const connect = (d: BleDevice) => {
    setStatus('connecting');
    setTimeout(() => {
      setConnectedId(d.id);
      setStatus('connected');
    }, 1200);
  };

  const disconnect = () => {
    setConnectedId(null);
    setStatus('idle');
  };

  const statusTone = {
    idle: 'idle',
    scanning: 'warning',
    connecting: 'warning',
    connected: 'success',
    disconnected: 'idle',
    error: 'danger',
  }[status] as 'idle' | 'warning' | 'success' | 'danger';

  const connectedDevice = devices.find(d => d.id === connectedId);

  return (
    <LinearGradient colors={gradients.screen} style={styles.fill}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Bluetooth</Text>
          <Pill label={status.toUpperCase()} tone={statusTone} />
        </View>

        {/* Connection summary */}
        <Card glow={status === 'connected'} style={styles.summary}>
          <View style={styles.radarWrap}>
            <Animated.View style={[styles.radar, { transform: [{ rotate }] }]}>
              <LinearGradient
                colors={[colors.accent, 'transparent']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 0 }}
                style={styles.radarSweep}
              />
            </Animated.View>
            <View style={styles.radarCore} />
          </View>
          <View style={styles.summaryText}>
            {connectedDevice ? (
              <>
                <Label>Connected to</Label>
                <Text style={styles.summaryName}>{connectedDevice.name}</Text>
                <Mono style={{ color: colors.textDim }}>{connectedDevice.id}</Mono>
              </>
            ) : (
              <>
                <Label>Cluster link</Label>
                <Text style={styles.summaryName}>Not connected</Text>
                <Text style={styles.summaryHint}>Scan and pair your Pulsar dashboard.</Text>
              </>
            )}
          </View>
        </Card>

        {connectedDevice ? (
          <PrimaryButton title="DISCONNECT" tone="danger" onPress={disconnect} style={styles.cta} />
        ) : (
          <PrimaryButton
            title={status === 'scanning' ? 'SCANNING…' : 'SCAN FOR DEVICES'}
            onPress={startScan}
            disabled={status === 'scanning'}
            style={styles.cta}
          />
        )}

        <View style={styles.section}>
          <SectionTitle>Discovered devices</SectionTitle>
          {devices.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                {status === 'scanning' ? 'Listening for advertisements…' : 'No devices yet. Start a scan.'}
              </Text>
            </Card>
          ) : (
            devices.map(d => (
              <Pressable key={d.id} onPress={() => !connectedId && connect(d)}>
                <Card style={[styles.deviceCard, d.id === connectedId && styles.deviceConnected]}>
                  <View style={styles.signal}>
                    <SignalBars rssi={d.rssi} />
                  </View>
                  <View style={styles.deviceText}>
                    <View style={styles.deviceNameRow}>
                      <Text style={styles.deviceName} numberOfLines={1}>{d.name}</Text>
                      {d.isBike && <View style={styles.bikeTag}><Text style={styles.bikeTagText}>BIKE</Text></View>}
                    </View>
                    <Mono style={{ color: colors.textFaint }}>{d.id}</Mono>
                  </View>
                  <Text style={styles.rssi}>{d.rssi}</Text>
                </Card>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function SignalBars({ rssi }: { rssi: number }) {
  // -50 strong .. -90 weak
  const strength = Math.max(0, Math.min(4, Math.round((rssi + 90) / 10)));
  return (
    <View style={styles.bars}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: 6 + i * 4, backgroundColor: i < strength ? colors.accent : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: font.sizes.h1, fontWeight: font.weight.bold },
  summary: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  radarWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  radar: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  radarSweep: { width: 38, height: 38, position: 'absolute', top: 0, right: 0 },
  radarCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  summaryText: { flex: 1, marginLeft: spacing.lg },
  summaryName: { color: colors.text, fontSize: font.sizes.h2, fontWeight: font.weight.semibold, marginVertical: 2 },
  summaryHint: { color: colors.textDim, fontSize: font.sizes.small },
  cta: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  empty: { color: colors.textDim, fontSize: font.sizes.small, textAlign: 'center', paddingVertical: spacing.sm },
  deviceCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: spacing.md },
  deviceConnected: { borderColor: colors.accent },
  signal: { width: 28, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 18 },
  bar: { width: 4, borderRadius: 1, marginHorizontal: 1 },
  deviceText: { flex: 1, marginLeft: spacing.md },
  deviceNameRow: { flexDirection: 'row', alignItems: 'center' },
  deviceName: { color: colors.text, fontSize: font.sizes.body, fontWeight: font.weight.medium, maxWidth: '70%' },
  bikeTag: { marginLeft: spacing.sm, backgroundColor: 'rgba(22,224,200,0.12)', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  bikeTagText: { color: colors.accent, fontSize: 9, fontWeight: font.weight.bold, letterSpacing: 1 },
  rssi: { color: colors.textFaint, fontSize: font.sizes.small, fontFamily: font.mono },
});
