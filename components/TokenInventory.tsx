import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Token } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export interface TokenInventoryProps {
  tokens: Token[];
}

export function TokenInventory({ tokens }: TokenInventoryProps) {
  const counts = tokens.reduce<Record<string, number>>((accumulator, token) => {
    accumulator[token.color] = (accumulator[token.color] ?? 0) + 1;
    return accumulator;
  }, {});
  const entries = Object.entries(counts);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {tokens.map((token) => (
        <View
          key={token.id}
          style={{
            backgroundColor: colors.tokenColors[token.color],
            borderRadius: radius.pill,
            height: 20,
            width: 20,
          }}
        />
      ))}
      </View>
      {entries.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {entries.map(([color, count]) => (
            <Text key={color} muted>
              {color}: {count}
            </Text>
          ))}
        </View>
      ) : (
        <Text muted>No tokens yet.</Text>
      )}
    </View>
  );
}
