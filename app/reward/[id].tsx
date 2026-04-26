import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';

const renderCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

export default function RewardActiveScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rewardId = params.id;
  const rewards = useAppStore((state) => state.rewards);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const endRewardSessionEarly = useAppStore((state) => state.endRewardSessionEarly);
  const syncRewardSessionState = useAppStore((state) => state.syncRewardSessionState);
  const remainingMs = useTimer(activeRewardSession?.expiresAt);

  useEffect(() => {
    syncRewardSessionState();
  }, [remainingMs, syncRewardSessionState]);

  const activeGrant = activeRewardSession
    ? rewardGrants.find((grant) => grant.id === activeRewardSession.rewardGrantId)
    : undefined;
  const activeReward = activeGrant
    ? rewards.find((reward) => reward.id === activeGrant.rewardId)
    : undefined;

  if (!activeRewardSession || !activeGrant || !activeReward) {
    return (
      <Screen>
        <Card>
          <Text variant="title">No active reward</Text>
          <Text muted>There is no active timed reward session right now.</Text>
        </Card>
      </Screen>
    );
  }

  if (rewardId && activeReward.id !== rewardId) {
    return (
      <Screen>
        <Card>
          <Text variant="title">Reward mismatch</Text>
          <Text muted>
            Requested reward does not match the currently active session.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">{activeReward.name}</Text>
        <Text muted>Time remaining: {renderCountdown(remainingMs)}</Text>
        <Text muted>Expires at: {activeRewardSession.expiresAt}</Text>
      </Card>
      <Button label="End reward early" tone="secondary" onPress={() => endRewardSessionEarly()} />
    </Screen>
  );
}
