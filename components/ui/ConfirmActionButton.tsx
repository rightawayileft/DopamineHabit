import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface ConfirmActionButtonProps {
  label: string;
  confirmLabel: string;
  message: string;
  onConfirm: () => void;
  tone?: 'primary' | 'secondary';
}

export function ConfirmActionButton({
  confirmLabel,
  label,
  message,
  onConfirm,
  tone = 'secondary',
}: ConfirmActionButtonProps) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return <Button label={label} tone={tone} onPress={() => setArmed(true)} />;
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.warning }}>{message}</Text>
      <Button
        label={confirmLabel}
        tone={tone}
        onPress={() => {
          setArmed(false);
          onConfirm();
        }}
      />
      <Button label="Keep as is" tone="secondary" onPress={() => setArmed(false)} />
    </View>
  );
}
