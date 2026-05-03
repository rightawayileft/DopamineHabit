import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildActiveRewardSessionDetails } from '@/game/spinComprehension';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';
import { spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const renderCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

interface ClosedRewardState {
  mode: 'completed' | 'stopped' | 'slipped' | 'expired';
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
  expired: {
    title: 'Reward expired',
    message: 'The timer closed the session. Check in or log a tiny rep when you are ready.',
  },
};

const confirmClosureCopy: Record<Exclude<ClosedRewardState['mode'], 'expired'>, string> = {
  completed: 'Confirm you stopped on time and the reward is complete.',
  stopped: 'Confirm you stopped early and want to close this reward cleanly.',
  slipped: 'Confirm the reward went past the plan so today can reset cleanly.',
};

export default function RewardActiveScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rewardId = params.id;
  const [closedReward, setClosedReward] = useState<ClosedRewardState | undefined>(undefined);
  const [pendingClosure, setPendingClosure] = useState<
    Exclude<ClosedRewardState['mode'], 'expired'> | undefined
  >(undefined);
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
  const activeRewardName =
    activeGrant && activeReward ? activeGrant.rewardSnapshot?.name ?? activeReward.name : undefined;

  const completeReward = () => {
    if (!activeRewardName) {
      return;
    }

    setClosedReward({ mode: 'completed', name: activeRewardName });
    endActiveRewardSession();
  };

  const stopRewardClean = () => {
    if (!activeRewardName) {
      return;
    }

    setClosedReward({ mode: 'stopped', name: activeRewardName });
    endRewardSessionEarly();
  };

  const logBoundarySlip = () => {
    if (!activeRewardName) {
      return;
    }

    setClosedReward({ mode: 'slipped', name: activeRewardName });
    recordRewardBoundarySlip();
  };
  const expiredGrant = rewardId
    ? rewardGrants
        .slice()
        .filter((grant) => grant.rewardId === rewardId && grant.outcome === 'expired')
        .sort((left, right) => (right.closedAt ?? '').localeCompare(left.closedAt ?? ''))[0]
    : undefined;
  const expiredReward = expiredGrant
    ? rewards.find((reward) => reward.id === expiredGrant.rewardId)
    : undefined;
  const expiredRewardName = expiredGrant
    ? expiredGrant.rewardSnapshot?.name ?? expiredReward?.name
    : undefined;

  if (!activeRewardSession || !activeGrant || !activeReward) {
    const recoveryState =
      closedReward ??
      (expiredRewardName ? { mode: 'expired' as const, name: expiredRewardName } : undefined);

    if (recoveryState) {
      const copy = closedRewardCopy[recoveryState.mode];

      return (
        <Screen>
          <Card>
            <Text variant="display">{copy.title}</Text>
            <Text muted>
              {recoveryState.name} is done for now. {copy.message}
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
    reward: { ...activeReward, name: activeRewardName ?? activeReward.name },
    grant: activeGrant,
    expiresAt: formatLocalDateTime(activeRewardSession.expiresAt),
  });

  return (
    <Screen>
      <Card>
        <Text variant="display">{activeRewardName ?? activeReward.name}</Text>
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
        {pendingClosure ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="title">Confirm boundary close</Text>
            <Text muted>{confirmClosureCopy[pendingClosure]}</Text>
            <Button
              label={
                pendingClosure === 'completed'
                  ? 'Done, I stopped on time'
                  : pendingClosure === 'stopped'
                    ? 'I stopped early'
                    : 'I went past the plan'
              }
              onPress={() => {
                if (pendingClosure === 'completed') {
                  completeReward();
                } else if (pendingClosure === 'stopped') {
                  stopRewardClean();
                } else {
                  logBoundarySlip();
                }
              }}
            />
            <Button
              label="Keep reward open"
              tone="secondary"
              onPress={() => setPendingClosure(undefined)}
            />
          </View>
        ) : (
          <>
            <Button label="Done, I stopped on time" onPress={() => setPendingClosure('completed')} />
            <Button
              label="I stopped early"
              tone="secondary"
              onPress={() => setPendingClosure('stopped')}
            />
            <Button
              label="I went past the plan"
              tone="secondary"
              onPress={() => setPendingClosure('slipped')}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
