import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { colors } from '../theme/theme';

export type TabName = 'dashboard' | 'bluetooth' | 'console' | 'guide';

export default function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
  const color = focused ? colors.accent : colors.idle;
  const sw = 1.9;
  const common = { stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === 'dashboard' && (
        <G>
          <Path {...common} d="M12 20 V8 M8 12 L12 7 L16 12" />
          <Path {...common} d="M4 20 H20" />
        </G>
      )}
      {name === 'bluetooth' && (
        <Path {...common} d="M7 7 L17 17 L12 21 V3 L17 7 L7 17" />
      )}
      {name === 'console' && (
        <G>
          <Rect {...common} x={3} y={4} width={18} height={16} rx={2} />
          <Path {...common} d="M7 9 L10 12 L7 15 M12 15 H16" />
        </G>
      )}
      {name === 'guide' && (
        <G>
          <Path {...common} d="M5 4 H15 L19 8 V20 H5 Z" />
          <Path {...common} d="M15 4 V8 H19 M8 12 H16 M8 16 H13" />
        </G>
      )}
    </Svg>
  );
}
