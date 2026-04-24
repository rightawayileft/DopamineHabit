import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';

export interface PlaceholderRouteProps {
  title: string;
}

export function PlaceholderRoute({ title }: PlaceholderRouteProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
      <Card>
        <Text variant="title">{title}</Text>
        <Text muted>Placeholder route for the PR1 hybrid scaffold.</Text>
      </Card>
    </View>
  );
}
