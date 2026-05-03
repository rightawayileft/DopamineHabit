import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { buildGatePreviewText } from '@/game/firstLoopGuidance';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface GatePreviewCardProps {
  habitCue: string;
  habitName: string;
  jarColorHex: string;
  jarName: string;
  rewardDurationMinutes: string | number;
  rewardName: string;
}

export function GatePreviewCard({
  habitCue,
  habitName,
  jarColorHex,
  jarName,
  rewardDurationMinutes,
  rewardName,
}: GatePreviewCardProps) {
  return (
    <Card
      style={{
        backgroundColor: colors.surfaceElevated,
        borderColor: jarColorHex,
      }}
    >
      <Text variant="title">Your first gate</Text>
      <Text>{buildGatePreviewText({ habitCue, habitName, rewardDurationMinutes, rewardName })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {[
          { label: 'When', value: habitCue.trim() || 'the pull starts' },
          { label: 'Do', value: habitName.trim() || 'one tiny rep' },
          { label: 'Earn', value: `${rewardDurationMinutes || 3} min ${rewardName || 'reward'}` },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.sm,
              borderWidth: 1,
              flexBasis: 120,
              flexGrow: 1,
              gap: spacing.xs,
              padding: spacing.sm,
            }}
          >
            <Text muted>{item.label}</Text>
            <Text>{item.value}</Text>
          </View>
        ))}
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View
          style={{
            backgroundColor: jarColorHex,
            borderRadius: radius.pill,
            height: 18,
            width: 18,
          }}
        />
        <Text muted>{jarName.trim() || 'Jar'} collects the proof tokens from this loop.</Text>
      </View>
    </Card>
  );
}
