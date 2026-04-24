import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

export interface TokenDropAnimationProps {
  enabled?: boolean;
}

export function TokenDropAnimation({ enabled = true }: TokenDropAnimationProps) {
  return (
    <View accessibilityElementsHidden={!enabled}>
      <Text muted>{enabled ? 'Token drop placeholder' : 'Token drop disabled'}</Text>
    </View>
  );
}
