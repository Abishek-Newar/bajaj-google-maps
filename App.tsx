/**
 * BajajNav — Google Maps turn-by-turn bridge for the Bajaj Pulsar N160 cluster.
 * Phase 0/1: full UI shell driven by mock data. Native notification listener
 * and BLE service are introduced in later phases.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
