import { useEffect, useState } from 'react';

import { RewardForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';

const formatRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

export default function RewardsScreen() {
  const rewards = useAppStore((state) => state.rewards);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const createReward = useAppStore((state) => state.createReward);
  const updateReward = useAppStore((state) => state.updateReward);
  const archiveReward = useAppStore((state) => state.archiveReward);
  const restoreReward = useAppStore((state) => state.restoreReward);
  const endActiveRewardSession = useAppStore((state) => state.endActiveRewardSession);
  const endRewardSessionEarly = useAppStore((state) => state.endRewardSessionEarly);
  const syncRewardSessionState = useAppStore((state) => state.syncRewardSessionState);
  const [editingRewardId, setEditingRewardId] = useState<string | undefined>(undefined);
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
  const sortedGrants = rewardGrants
    .slice()
    .sort((left, right) => right.grantedAt.localeCompare(left.grantedAt));
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const archivedRewards = rewards.filter((reward) => reward.archivedAt);

  return (
    <Screen>
      <Card>
        <Text variant="display">Rewards</Text>
        <Text muted>Reward grants are append-only and session expiry is authoritative.</Text>
      </Card>
      {activeRewardSession && activeGrant && activeReward ? (
        <Card>
          <Text variant="title">Active now: {activeReward.name}</Text>
          <Text muted>Time left: {formatRemaining(remainingMs)}</Text>
          <Text muted>Expires at: {activeRewardSession.expiresAt}</Text>
          <Button
            label="End early"
            tone="secondary"
            onPress={() => endRewardSessionEarly()}
          />
          <Button label="Mark complete now" tone="secondary" onPress={() => endActiveRewardSession()} />
        </Card>
      ) : (
        <Card>
          <Text variant="title">No active reward</Text>
          <Text muted>Spin to earn a timed reward session.</Text>
        </Card>
      )}

      <Card>
        <Text variant="title">Add reward</Text>
        <RewardForm
          submitLabel="Add reward"
          onSubmit={(input) => {
            createReward(input);
          }}
        />
      </Card>

      {activeRewards.length === 0 ? (
        <Card>
          <Text variant="title">No active rewards</Text>
          <Text muted>Create or restore a reward before spinning for rewards.</Text>
        </Card>
      ) : null}

      {activeRewards.map((reward) => (
        <Card key={reward.id}>
          <Text variant="title">{reward.name}</Text>
          <Text muted>Tier {reward.tier}</Text>
          {reward.durationMinutes ? <Text muted>{reward.durationMinutes} minutes</Text> : null}
          {reward.description ? <Text muted>{reward.description}</Text> : null}
          {editingRewardId === reward.id ? (
            <RewardForm
              initialReward={reward}
              submitLabel="Save reward"
              onSubmit={(input) => {
                updateReward({ ...input, id: reward.id });
                setEditingRewardId(undefined);
              }}
            />
          ) : (
            <Button
              label="Edit"
              tone="secondary"
              onPress={() => setEditingRewardId(reward.id)}
            />
          )}
          <Button label="Archive" tone="secondary" onPress={() => archiveReward(reward.id)} />
        </Card>
      ))}

      {archivedRewards.length > 0 ? (
        <Card>
          <Text variant="title">Archived rewards</Text>
          <Text muted>Archived rewards stay attached to old grants.</Text>
        </Card>
      ) : null}

      {archivedRewards.map((reward) => (
        <Card key={reward.id}>
          <Text variant="title">{reward.name}</Text>
          <Text muted>Archived at {reward.archivedAt}</Text>
          <Button label="Restore" tone="secondary" onPress={() => restoreReward(reward.id)} />
        </Card>
      ))}

      <Card>
        <Text variant="title">Grant history</Text>
        {sortedGrants.length === 0 ? <Text muted>No grants yet.</Text> : null}
        {sortedGrants.map((grant) => {
          const reward = rewards.find((candidate) => candidate.id === grant.rewardId);
          const status = grant.endedEarlyAt
            ? `Ended early at ${grant.endedEarlyAt}`
            : grant.endedAt
              ? `Completed at ${grant.endedAt}`
              : 'In progress';

          return (
            <Card key={grant.id}>
              <Text variant="title">{reward?.name ?? 'Deleted reward reference'}</Text>
              <Text muted>Granted at {grant.grantedAt}</Text>
              <Text muted>{status}</Text>
            </Card>
          );
        })}
      </Card>
    </Screen>
  );
}
