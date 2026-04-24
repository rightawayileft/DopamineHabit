import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import {
  buildWheelSlices,
  wheelSliceColor,
  wheelSliceLabel,
  type WheelSliceKind,
} from '@/components/Wheel/wheelGeometry';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface WheelProps {
  activeTier: 1 | 2 | 3;
  highlightedSlice?: WheelSliceKind | undefined;
  lockedSlice?: WheelSliceKind | undefined;
  animatedStyle?: ReturnType<typeof useAnimatedStyle> | undefined;
}

const polarToCartesian = (center: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
};

const describeArcSlice = (
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

export function Wheel({ activeTier, highlightedSlice, lockedSlice, animatedStyle }: WheelProps) {
  const slices = buildWheelSlices();
  const center = 120;
  const radiusSize = 112;

  return (
    <View
      style={{
        alignItems: 'center',
        aspectRatio: 1,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderRadius: radius.pill,
        borderWidth: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        width: '100%',
      }}
    >
      <View
        style={{
          borderLeftColor: 'transparent',
          borderLeftWidth: 12,
          borderRightColor: 'transparent',
          borderRightWidth: 12,
          borderTopColor: colors.textPrimary,
          borderTopWidth: 24,
          height: 0,
          position: 'absolute',
          top: spacing.sm,
          width: 0,
          zIndex: 2,
        }}
      />
      <Animated.View style={[{ height: 240, width: 240 }, animatedStyle]}>
        <Svg height="240" width="240" viewBox="0 0 240 240">
          <G>
            {slices.map((slice) => {
              const labelPoint = polarToCartesian(center, 74, slice.centerAngle);
              const isHighlighted = highlightedSlice === slice.kind;
              const isLocked = lockedSlice === slice.kind;

              return (
                <G key={slice.id}>
                  <Path
                    d={describeArcSlice(center, radiusSize, slice.startAngle, slice.endAngle)}
                    fill={wheelSliceColor(slice.kind)}
                    opacity={isLocked ? 0.38 : isHighlighted ? 1 : 0.86}
                    stroke={colors.background}
                    strokeWidth={2}
                  />
                  <SvgText
                    fill={colors.background}
                    fontSize={12}
                    fontWeight="700"
                    textAnchor="middle"
                    x={labelPoint.x}
                    y={labelPoint.y}
                  >
                    {wheelSliceLabel(slice.kind)}
                  </SvgText>
                </G>
              );
            })}
          </G>
          <Circle cx="120" cy="120" fill={colors.background} r="34" />
          <SvgText
            fill={colors.textPrimary}
            fontSize={18}
            fontWeight="800"
            textAnchor="middle"
            x="120"
            y="126"
          >
            T{activeTier}
          </SvgText>
          <Line x1="120" y1="8" x2="120" y2="32" stroke={colors.textPrimary} strokeWidth="3" />
        </Svg>
      </Animated.View>
      {lockedSlice ? (
        <Text muted>Locked {wheelSliceLabel(lockedSlice)} fell through to Tier 1.</Text>
      ) : null}
    </View>
  );
}
