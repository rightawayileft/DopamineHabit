import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildActiveRewardSessionDetails } from '@/game/spinComprehension';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const renderCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

interface ClosedRewardState {
  mode: 'completed' | 'stopped' | 'slipped';
  name: string;
}

const closedRewardCopy: Record<ClosedRewardState['mode'], { title: string; message: string }> = {
  completed: {
    title: 'Reward complete',
    message: 'The boundary held. The gate is clear for another rep.',
  },
  stopped: {
    title: 'Reward stopped clean',
    message: 'Nice boundary. You stopped before the reward took over.',
  },
  slipped: {
    title: 'Boundary slip logged',
    message: 'No drama. The slip is recorded, and the next loop can be repaired.',
  },
};

export default function RewardActiveScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rewardId = params.id;
  const [closedReward, setClosedReward] = useState<ClosedRewardState | undefined>(undefined);
  const rewards = useAppStore((state) => state.rewards);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const endActiveRewardSession = useAppStore((state) => state.endActiveRewardSession);
  const endRewardSessionEarly = useAppStore((state) => state.endRewardSessionEarly);
  const recordRewardBoundarySlip = useAppStore((state) => state.recordRewardBoundarySlip);
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

  const stopRewardClean = () => {
    if (!activeReward) {
      return;
    }

    setClosedReward({ mode: 'stopped', name: activeReward.name });
    endRewardSessionEarly();
  };

  const logBoundarySlip = () => {
    if (!activeReward) {
      return;
    }

    setClosedReward({ mode: 'slipped', name: activeReward.name });
    recordRewardBoundarySlip();
  };

  if (!activeRewardSession || !activeGrant || !activeReward) {
    if (closedReward) {
      const copy = closedRewardCopy[closedReward.mode];

      return (
        <Screen>
          <Card>
            <Text variant="display">{copy.title}</Text>
            <Text muted>
              {closedReward.name} is done for now. {copy.message}
            </Text>
            <Button label="Log another rep" onPress={() => router.replace('/')} />
            <Button
              label="Open repair check-in"
              tone="secondary"
              onPress={() => router.push('/checkin')}
            />
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
    expiresAt: formatLocalDateTime(activeRewardSession.expiresAt),
  });

  return (
    <Screen>
      <Card>
        <Text variant="display">{activeReward.name}</Text>
        <Text muted>Time remaining: {renderCountdown(remainingMs)}</Text>
        <Text muted>Ends around {formatLocalDateTime(activeRewardSession.expiresAt)}</Text>
      </Card>
      <Card>
        <Text variant="title">{sessionDetails.title}</Text>
        {sessionDetails.lines.map((line) => (
          <Text key={line} muted>
            {line}
          </Text>
        ))}
        <Button label="Mark complete" onPress={completeReward} />
        <Button label="Stop clean" tone="secondary" onPress={stopRewardClean} />
        <Button label="Log boundary slip" tone="secondary" onPress={logBoundarySlip} />
      </Card>
    </Screen>
  );
}
