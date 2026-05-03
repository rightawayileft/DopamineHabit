import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { TokenColor } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface TokenRevealCardProps {
  canSpin: boolean;
  message: string;
  tokenColor?: TokenColor | undefined;
  title: string;
  onSpin: () => void;
}

export function TokenRevealCard({
  canSpin,
  message,
  onSpin,
  title,
  tokenColor,
}: TokenRevealCardProps) {
  return (
    <Card
      tone={tokenColor ? 'success' : 'default'}
      style={{
        borderColor: tokenColor ? colors.tokenColors[tokenColor] : colors.border,
        gap: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: tokenColor ? colors.tokenColors[tokenColor] : colors.surface,
            borderColor: colors.textPrimary,
            borderRadius: radius.pill,
            borderWidth: 2,
            height: 96,
            justifyContent: 'center',
            width: 96,
          }}
        >
          <Text style={{ color: colors.background, fontSize: 13 }}>
            {tokenColor ? tokenColor.toUpperCase() : 'REP'}
          </Text>
        </View>
        <Text variant="title">{title}</Text>
        <Text muted style={{ textAlign: 'center' }}>
          {message}
        </Text>
        {canSpin ? (
          <>
            <Text style={{ color: colors.success, textAlign: 'center' }}>
              Next: spin with this token safely stored.
            </Text>
            <Text muted style={{ textAlign: 'center' }}>
              You do not spend tokens on the first reward. Matching-token strategy comes later.
            </Text>
            <Button label="Spin now" size="large" onPress={onSpin} />
          </>
        ) : null}
      </View>
    </Card>
  );
}
