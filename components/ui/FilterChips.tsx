import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
  detail?: string;
}

export interface FilterChipsProps<T extends string> {
  label?: string;
  options: FilterChipOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}

export function FilterChips<T extends string>({
  label,
  options,
  selectedId,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text muted>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((option) => {
          const selected = option.id === selectedId;

          return (
            <Button
              key={option.id}
              accessibilityState={{ selected }}
              label={option.detail ? `${option.label} (${option.detail})` : option.label}
              tone={selected ? 'primary' : 'secondary'}
              onPress={() => onSelect(option.id)}
            />
          );
        })}
      </View>
    </View>
  );
}
