import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Reward } from '@/store/types';

export interface RewardCardProps {
  reward: Reward;
}

export function RewardCard({ reward }: RewardCardProps) {
  return (
    <Card>
      <Text variant="title">{reward.name}</Text>
      <Text muted>Tier {reward.tier}</Text>
    </Card>
  );
}
