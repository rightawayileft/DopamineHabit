import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildActiveRewardSessionDetails } from '@/game/spinComprehension';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';

const renderCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

const formatRewardEndTime = (timestamp: string): string => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
};

interface ClosedRewardState {
  mode: 'completed' | 'ended';
  name: string;
}

export default function RewardActiveScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rewardId = params.id;
  const [closedReward, setClosedReward] = useState<ClosedRewardState | undefined>(undefined);
  const rewards = useAppStore((state) => state.rewards);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const endActiveRewardSession = useAppStore((state) => state.endActiveRewardSession);
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

  const completeReward = () => {
    if (!activeReward) {
      return;
    }

    setClosedReward({ mode: 'completed', name: activeReward.name });
    endActiveRewardSession();
  };

  const endRewardEarly = () => {
    if (!activeReward) {
      return;
    }

    setClosedReward({ mode: 'ended', name: activeReward.name });
    endRewardSessionEarly();
  };

  if (!activeRewardSession || !activeGrant || !activeReward) {
    if (closedReward) {
      return (
        <Screen>
          <Card>
            <Text variant="display">
              {closedReward.mode === 'completed' ? 'Reward complete' : 'Reward closed'}
            </Text>
            <Text muted>
              {closedReward.name} is done for now. The gate is clear again.
            </Text>
            <Button label="Log another rep" onPress={() => router.replace('/')} />
            <Button
              label="Review progress"
              tone="secondary"
              onPress={() => router.push('/stats')}
            />
          </Card>
        </Screen>
      );
    }

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

  const sessionDetails = buildActiveRewardSessionDetails({
    reward: activeReward,
    grant: activeGrant,
    expiresAt: formatRewardEndTime(activeRewardSession.expiresAt),
  });

  return (
    <Screen>
      <Card>
        <Text variant="display">{activeReward.name}</Text>
        <Text muted>Time remaining: {renderCountdown(remainingMs)}</Text>
        <Text muted>Ends around {formatRewardEndTime(activeRewardSession.expiresAt)}</Text>
      </Card>
      <Card>
        <Text variant="title">{sessionDetails.title}</Text>
        {sessionDetails.lines.map((line) => (
          <Text key={line} muted>
            {line}
          </Text>
        ))}
        <Button label="Mark reward complete" onPress={completeReward} />
        <Button label="End reward early" tone="secondary" onPress={endRewardEarly} />
      </Card>
    </Screen>
  );
}
