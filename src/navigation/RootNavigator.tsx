import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { colors, font } from '../theme/theme';
import TabIcon, { TabName } from '../components/TabIcon';
import DashboardScreen from '../screens/DashboardScreen';
import BluetoothScreen from '../screens/BluetoothScreen';
import DeveloperConsoleScreen from '../screens/DeveloperConsoleScreen';
import SnoopGuideScreen from '../screens/SnoopGuideScreen';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bgElevated, text: colors.text, border: colors.border, primary: colors.accent },
};

function tabLabel(label: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text
      style={{
        color: focused ? colors.accent : colors.idle,
        fontSize: 10,
        fontWeight: font.weight.semibold,
        letterSpacing: 0.5,
        marginTop: 2,
      }}>
      {label}
    </Text>
  );
}

function icon(name: TabName) {
  return ({ focused }: { focused: boolean }) => <TabIcon name={name} focused={focused} />;
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bgElevated,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          },
        }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: tabLabel('DASH'), tabBarIcon: icon('dashboard') }} />
        <Tab.Screen name="Bluetooth" component={BluetoothScreen} options={{ tabBarLabel: tabLabel('LINK'), tabBarIcon: icon('bluetooth') }} />
        <Tab.Screen name="Console" component={DeveloperConsoleScreen} options={{ tabBarLabel: tabLabel('CONSOLE'), tabBarIcon: icon('console') }} />
        <Tab.Screen name="Guide" component={SnoopGuideScreen} options={{ tabBarLabel: tabLabel('SNOOP'), tabBarIcon: icon('guide') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
