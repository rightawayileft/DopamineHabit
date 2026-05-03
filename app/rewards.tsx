import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { RewardForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmActionButton } from '@/components/ui/ConfirmActionButton';
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { quickRewardTemplates } from '@/game/firstLoopGuidance';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';
import type { Reward, RewardGrant } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const formatRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

const grantOutcome = (
  grant: RewardGrant,
): RewardGrant['outcome'] | 'in_progress' => {
  if (grant.outcome) {
    return grant.outcome;
  }

  if (grant.endedEarlyAt) {
    return 'stopped';
  }

  if (grant.endedAt) {
    return 'completed';
  }

  return 'in_progress';
};

const grantStatusLabel = (grant: RewardGrant): string => {
  const closedAt = grant.closedAt ?? grant.endedAt ?? grant.endedEarlyAt;

  switch (grantOutcome(grant)) {
    case 'completed':
      return `Completed ${formatLocalDateTime(closedAt)}`;
    case 'stopped':
      return `Stopped clean ${formatLocalDateTime(closedAt)}`;
    case 'slipped':
      return `Boundary slip logged ${formatLocalDateTime(closedAt)}`;
    case 'expired':
      return `Expired ${formatLocalDateTime(closedAt)}`;
    case 'in_progress':
      return 'In progress';
  }

  return 'In progress';
};

const grantRewardName = (grant: RewardGrant, reward: Reward | undefined): string =>
  grant.rewardSnapshot?.name ?? reward?.name ?? 'Deleted reward reference';

const grantRewardTier = (
  grant: RewardGrant,
  reward: Reward | undefined,
): Reward['tier'] | undefined => grant.rewardSnapshot?.tier ?? reward?.tier;

const grantRewardDuration = (
  grant: RewardGrant,
  reward: Reward | undefined,
): number | undefined =>
  grant.rewardSnapshot?.durationMinutes ?? grant.durationMinutes ?? reward?.durationMinutes;

const rewardSourceLabel: Record<RewardGrant['source'], string> = {
  bonus: 'Bonus chain',
  spin: 'Wheel spin',
};

const shortRecordId = (id: string): string => (id.length > 8 ? id.slice(0, 8) : id);

type RewardClosureMode = 'completed' | 'stopped' | 'slipped';
type RewardView = 'active' | 'archived' | 'grants' | 'all';

const rewardViewOptions: FilterChipOption<RewardView>[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'grants', label: 'Grants' },
  { id: 'all', label: 'All' },
];

const rewardClosurePrompt: Record<RewardClosureMode, string> = {
  completed: 'Confirm this reward stayed inside the boundary and is complete.',
  stopped: 'Confirm you stopped early and kept the boundary clean.',
  slipped: 'Confirm the reward escaped the boundary so the app can help you repair it.',
};

const rewardClosureResult: Record<RewardClosureMode, string> = {
  completed: 'Reward marked complete.',
  stopped: 'Reward stopped clean.',
  slipped: 'Boundary slip logged.',
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
  const recordRewardBoundarySlip = useAppStore((state) => state.recordRewardBoundarySlip);
  const syncRewardSessionState = useAppStore((state) => state.syncRewardSessionState);
  const [editingRewardId, setEditingRewardId] = useState<string | undefined>(undefined);
  const [pendingClosure, setPendingClosure] = useState<RewardClosureMode | undefined>(undefined);
  const [rewardView, setRewardView] = useState<RewardView>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastClosure, setLastClosure] = useState<
    { mode: RewardClosureMode; rewardName: string } | undefined
  >(undefined);
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
    activeGrant && activeReward ? grantRewardName(activeGrant, activeReward) : undefined;
  const sortedGrants = rewardGrants
    .slice()
    .sort((left, right) => right.grantedAt.localeCompare(left.grantedAt));
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const archivedRewards = rewards.filter((reward) => reward.archivedAt);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesText = (value: string): boolean =>
    normalizedSearchQuery.length === 0 || value.toLowerCase().includes(normalizedSearchQuery);
  const matchesReward = (reward: Reward): boolean =>
    [reward.name, reward.description ?? '', `${reward.tier}`].some(matchesText);
  const matchesGrant = (grant: RewardGrant): boolean => {
    const reward = rewards.find((candidate) => candidate.id === grant.rewardId);

    return [
      grantRewardName(grant, reward),
      grantStatusLabel(grant),
      rewardSourceLabel[grant.source],
      grant.spinResultId ?? '',
      grant.bonusChainId ?? '',
    ].some(matchesText);
  };
  const visibleActiveRewards = activeRewards.filter(matchesReward);
  const visibleArchivedRewards = archivedRewards.filter(matchesReward);
  const visibleGrants = sortedGrants.filter(matchesGrant);
  const shouldShowActive = rewardView === 'active' || rewardView === 'all';
  const shouldShowArchived = rewardView === 'archived' || rewardView === 'all';
  const shouldShowGrants = rewardView === 'grants' || rewardView === 'all';

  const closeActiveReward = (mode: RewardClosureMode) => {
    if (!activeGrant || !activeReward) {
      return;
    }

    if (mode === 'completed') {
      endActiveRewardSession();
    } else if (mode === 'stopped') {
      endRewardSessionEarly();
    } else {
      recordRewardBoundarySlip();
    }

    setLastClosure({ mode, rewardName: grantRewardName(activeGrant, activeReward) });
    setPendingClosure(undefined);
  };

  return (
    <Screen>
      <Card>
        <Text variant="display">Rewards</Text>
        <Text muted>Reward grants are append-only and session expiry is authoritative.</Text>
      </Card>
      {activeRewardSession && activeGrant && activeReward && activeRewardName ? (
        <Card>
          <Text variant="title">Active now: {activeRewardName}</Text>
          <Text muted>Time left: {formatRemaining(remainingMs)}</Text>
          <Text muted>Ends around {formatLocalDateTime(activeRewardSession.expiresAt)}</Text>
          {pendingClosure ? (
            <View style={{ gap: spacing.sm }}>
              <Text>{rewardClosurePrompt[pendingClosure]}</Text>
              <Button
                label={
                  pendingClosure === 'completed'
                    ? 'Confirm complete'
                    : pendingClosure === 'stopped'
                      ? 'Confirm stop clean'
                      : 'Confirm boundary slip'
                }
                onPress={() => closeActiveReward(pendingClosure)}
              />
              <Button
                label="Keep reward open"
                tone="secondary"
                onPress={() => setPendingClosure(undefined)}
              />
            </View>
          ) : (
            <>
              <Button
                label="Mark complete now"
                tone="secondary"
                onPress={() => setPendingClosure('completed')}
              />
              <Button
                label="Stop clean"
                tone="secondary"
                onPress={() => setPendingClosure('stopped')}
              />
              <Button
                label="Log boundary slip"
                tone="secondary"
                onPress={() => setPendingClosure('slipped')}
              />
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Text variant="title">No active reward</Text>
          <Text muted>
            {lastClosure
              ? `${rewardClosureResult[lastClosure.mode]} ${lastClosure.rewardName} is closed.`
              : 'Spin to earn a timed reward session.'}
          </Text>
          {lastClosure?.mode === 'slipped' ? (
            <Button
              label="Open repair check-in"
              tone="secondary"
              onPress={() => router.push('/checkin')}
            />
          ) : null}
        </Card>
      )}

      <Card>
        <Text variant="title">Find rewards</Text>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search rewards or grant history"
        />
        <FilterChips
          options={rewardViewOptions}
          selectedId={rewardView}
          onSelect={setRewardView}
        />
        <Text muted>
          Showing {visibleActiveRewards.length} active, {visibleArchivedRewards.length} archived,{' '}
          {visibleGrants.length} grants.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Add reward</Text>
        <Text muted>
          Rewards are the timed sessions the wheel can grant. Tiers let better cash-ins unlock
          better options.
        </Text>
        <RewardForm
          submitLabel="Add reward"
          onSubmit={(input) => {
            createReward(input);
          }}
        />
      </Card>

      <Card>
        <Text variant="title">Quick reward templates</Text>
        <Text muted>Add common reward tiers now and tune the durations later.</Text>
        <View style={{ gap: spacing.sm }}>
          {quickRewardTemplates.map((template) => {
            const alreadyAdded = rewards.some(
              (reward) => reward.name.toLowerCase() === template.name.toLowerCase(),
            );

            return (
              <Button
                key={template.id}
                disabled={alreadyAdded}
                label={alreadyAdded ? `Added: ${template.name}` : `Add: ${template.name}`}
                tone="secondary"
                onPress={() =>
                  createReward({
                    name: template.name,
                    tier: template.tier,
                    durationMinutes: template.durationMinutes,
                    description: template.description,
                  })
                }
              />
            );
          })}
        </View>
      </Card>

      {shouldShowActive && visibleActiveRewards.length === 0 ? (
        <Card>
          <Text variant="title">No active matches</Text>
          <Text muted>Create, restore, or clear search to see active rewards.</Text>
        </Card>
      ) : null}

      {shouldShowActive && visibleActiveRewards.length > 0 ? (
        <Card>
          <Text variant="title">Active rewards</Text>
          {visibleActiveRewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                gap: spacing.xs,
                padding: spacing.sm,
              }}
            >
              <Text>{reward.name}</Text>
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
              <ConfirmActionButton
                label="Archive"
                confirmLabel="Confirm archive reward"
                message="This hides the reward from new spins but keeps old grant history."
                onConfirm={() => archiveReward(reward.id)}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {shouldShowArchived && visibleArchivedRewards.length > 0 ? (
        <Card>
          <Text variant="title">Archived rewards</Text>
          <Text muted>Archived rewards stay attached to old grants.</Text>
          {visibleArchivedRewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                gap: spacing.xs,
                padding: spacing.sm,
              }}
            >
              <Text>{reward.name}</Text>
              <Text muted>Archived {formatLocalDateTime(reward.archivedAt)}</Text>
              <Button label="Restore" tone="secondary" onPress={() => restoreReward(reward.id)} />
            </View>
          ))}
        </Card>
      ) : null}

      {shouldShowGrants ? (
      <Card>
        <Text variant="title">Grant history</Text>
        {visibleGrants.length === 0 ? <Text muted>No grant matches yet.</Text> : null}
        {visibleGrants.map((grant) => {
          const reward = rewards.find((candidate) => candidate.id === grant.rewardId);
          const status = grantStatusLabel(grant);
          const rewardName = grantRewardName(grant, reward);
          const tier = grantRewardTier(grant, reward);
          const durationMinutes = grantRewardDuration(grant, reward);
          const currentNameChanged = Boolean(
            grant.rewardSnapshot?.name && reward && grant.rewardSnapshot.name !== reward.name,
          );

          return (
            <View
              key={grant.id}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                gap: spacing.xs,
                padding: spacing.sm,
              }}
            >
              <Text variant="title">{rewardName}</Text>
              <Text muted>Granted {formatLocalDateTime(grant.grantedAt)}</Text>
              <Text muted>{status}</Text>
              <Text muted>
                {rewardSourceLabel[grant.source]}
                {tier ? ` - Tier ${tier}` : ''}
                {durationMinutes === undefined ? '' : ` - ${durationMinutes} min`}
              </Text>
              {grant.spinResultId ? (
                <Text muted>Spin result: {shortRecordId(grant.spinResultId)}</Text>
              ) : null}
              {grant.bonusChainId ? (
                <Text muted>Bonus chain: {shortRecordId(grant.bonusChainId)}</Text>
              ) : null}
              {currentNameChanged ? <Text muted>Current reward name: {reward?.name}</Text> : null}
            </View>
          );
        })}
      </Card>
      ) : null}
    </Screen>
  );
}
