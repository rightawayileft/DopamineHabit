import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Token } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

export interface TokenInventoryProps {
  tokens: Token[];
  showLedger?: boolean;
  maxLedgerItems?: number;
}

const tokenStateLabels: Record<Token['state'], string> = {
  in_inventory: 'In inventory',
  cashed_in: 'Cashed in',
  in_jar: 'In jar',
};

const tokenStateOrder: Token['state'][] = ['in_inventory', 'cashed_in', 'in_jar'];

export function TokenInventory({
  tokens,
  showLedger = false,
  maxLedgerItems = 8,
}: TokenInventoryProps) {
  const counts = tokens.reduce<Record<string, number>>((accumulator, token) => {
    accumulator[token.color] = (accumulator[token.color] ?? 0) + 1;
    return accumulator;
  }, {});
  const stateCounts = tokens.reduce<Record<Token['state'], number>>(
    (accumulator, token) => ({
      ...accumulator,
      [token.state]: accumulator[token.state] + 1,
    }),
    {
      in_inventory: 0,
      cashed_in: 0,
      in_jar: 0,
    },
  );
  const entries = Object.entries(counts);
  const ledgerTokens = tokens
    .slice()
    .sort((left, right) => right.earnedAt.localeCompare(left.earnedAt))
    .slice(0, maxLedgerItems);

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
              opacity: showLedger && token.state !== 'in_inventory' ? 0.45 : 1,
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
      {showLedger ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {tokenStateOrder
              .filter((state) => stateCounts[state] > 0)
              .map((state) => (
                <Text key={state} muted>
                  {tokenStateLabels[state]}: {stateCounts[state]}
                </Text>
              ))}
          </View>
          {ledgerTokens.map((token) => (
            <View
              key={`ledger-${token.id}`}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                gap: spacing.xs,
                padding: spacing.sm,
              }}
            >
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                <View
                  style={{
                    backgroundColor: colors.tokenColors[token.color],
                    borderRadius: radius.pill,
                    height: 14,
                    width: 14,
                  }}
                />
                <Text>{token.color}</Text>
              </View>
              <Text muted>
                {tokenStateLabels[token.state]} - earned {formatLocalDateTime(token.earnedAt)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
