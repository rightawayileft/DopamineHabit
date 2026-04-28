import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Token } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { spacing } from '@/theme/spacing';

export interface CashInPanelProps {
  inventoryTokens: Token[];
  selectedTokens: Token[];
  activatedMaxTier: 1 | 2 | 3;
  isValid: boolean;
  reason?: string | undefined;
  onToggleToken: (tokenId: string) => void;
  onClear: () => void;
}

export function CashInPanel({
  inventoryTokens,
  selectedTokens,
  activatedMaxTier,
  isValid,
  reason,
  onToggleToken,
  onClear,
}: CashInPanelProps) {
  const selectedIds = new Set(selectedTokens.map((token) => token.id));
  const selectedSingleNonGold =
    selectedTokens.length === 1 && selectedTokens[0]?.color !== 'gold';

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="title">Cash In</Text>
      <Text muted>
        {selectedTokens.length} selected, Tier {activatedMaxTier} active
      </Text>
      <Text muted>
        Cash-in guide: 0 selected = Tier 1, 2 matching non-gold = Tier 2, 3 matching
        non-gold or 1 gold = Tier 3.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {inventoryTokens.map((token) => {
          const selected = selectedIds.has(token.id);

          return (
            <Button
              key={token.id}
              accessibilityLabel={`Select ${token.color} token`}
              accessibilityState={{ selected }}
              onPress={() => onToggleToken(token.id)}
              style={{
                backgroundColor: colors.tokenColors[token.color],
                borderColor: selected ? colors.textPrimary : colors.tokenColors[token.color],
                borderRadius: radius.pill,
                height: 44,
                width: 44,
              }}
            />
          );
        })}
      </View>
      {inventoryTokens.length === 0 ? <Text muted>Complete a rep to earn tokens first.</Text> : null}
      {!isValid && reason ? <Text style={{ color: colors.danger }}>{reason}</Text> : null}
      {selectedSingleNonGold && !isValid ? (
        <Text muted>
          Save that token for a matching set later, or clear it and spin Tier 1 now.
        </Text>
      ) : null}
      {selectedTokens.length > 0 ? (
        <Button
          label={selectedSingleNonGold && !isValid ? 'Clear for Tier 1 spin' : 'Clear selection'}
          onPress={onClear}
          tone="secondary"
        />
      ) : null}
    </View>
  );
}
