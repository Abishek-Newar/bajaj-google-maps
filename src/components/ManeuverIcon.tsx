import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Maneuver } from '../types';
import { colors } from '../theme/theme';

interface Props {
  maneuver: Maneuver;
  size?: number;
  color?: string;
}

/**
 * Vector turn-arrows drawn on a 24x24 grid. Kept deliberately simple and
 * monochrome so they read clearly on the dashboard and (later) map cleanly
 * onto the bike cluster's icon set.
 */
export default function ManeuverIcon({ maneuver, size = 64, color = colors.accent }: Props) {
  const stroke = color;
  const sw = 2.2;
  const common = { stroke, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  const body = (() => {
    switch (maneuver) {
      case 'turn-left':
        return <Path {...common} d="M16 21 V11 a4 4 0 0 0-4-4 H6 M9 4 L5 7 L9 10" />;
      case 'turn-right':
        return <Path {...common} d="M8 21 V11 a4 4 0 0 1 4-4 H18 M15 4 L19 7 L15 10" />;
      case 'slight-left':
        return <Path {...common} d="M14 21 V12 a5 5 0 0 1 5-5 M9 6 L7 9 M9 6 L12 8 M9 6 L7.6 9.4" />;
      case 'slight-right':
        return <Path {...common} d="M10 21 V12 a5 5 0 0 0-5-5 M15 6 L17 9 M15 6 L12 8" />;
      case 'sharp-left':
        return <Path {...common} d="M16 21 C16 14 13 12 8 11 M11 7 L7 11 L11 15" />;
      case 'sharp-right':
        return <Path {...common} d="M8 21 C8 14 11 12 16 11 M13 7 L17 11 L13 15" />;
      case 'uturn':
        return <Path {...common} d="M8 21 V11 a4 4 0 0 1 8 0 V14 M13 11 L16 8 L19 11" />;
      case 'roundabout':
        return (
          <G>
            <Circle cx={12} cy={10} r={4.5} stroke={stroke} strokeWidth={sw} fill="none" />
            <Path {...common} d="M12 21 V15 M12 21 M15 6 L18 4 M18 4 L18 7 M18 4 L15 4" />
          </G>
        );
      case 'merge':
        return <Path {...common} d="M8 21 V14 C8 10 12 9 16 6 M13 4 L17 5 L16 9" />;
      case 'fork-left':
        return <Path {...common} d="M12 21 V13 L7 8 M7 8 L7 11 M7 8 L10 8 M14 11 L17 8" />;
      case 'fork-right':
        return <Path {...common} d="M12 21 V13 L17 8 M17 8 L17 11 M17 8 L14 8 M10 11 L7 8" />;
      case 'destination':
        return (
          <G>
            <Path {...common} d="M12 21 C12 21 5 14 5 9 a7 7 0 0 1 14 0 C19 14 12 21 12 21 Z" />
            <Circle cx={12} cy={9} r={2.4} fill={stroke} />
          </G>
        );
      case 'straight':
      default:
        return <Path {...common} d="M12 21 V5 M8 9 L12 4 L16 9" />;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
