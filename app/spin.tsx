import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { soundManager } from '@/audio/SoundManager';
import { CashInPanel } from '@/components/CashInPanel';
import { Wheel } from '@/components/Wheel/Wheel';
import { useSpinAnimation } from '@/components/Wheel/useSpinAnimation';
import { type WheelSliceKind } from '@/components/Wheel/wheelGeometry';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { resolveCashIn } from '@/game/cashIn';
import {
  buildFirstSpinChecklist,
  type FirstSpinChecklistStatus,
} from '@/game/firstLoopGuidance';
import { playHapticPattern } from '@/haptics/patterns';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const checklistStatusLabel: Record<FirstSpinChecklistStatus, string> = {
  complete: 'Done',
  available: 'Next',
  blocked: 'Blocked',
  locked: 'Locked',
};

const checklistStatusColor: Record<FirstSpinChecklistStatus, string> = {
  complete: colors.success,
  available: colors.primary,
  blocked: colors.danger,
  locked: colors.textMuted,
};

export default function SpinScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const pendingSpin = useAppStore((state) => state.pendingSpin);
  const spinResults = useAppStore((state) => state.spinResults);
  const rewards = useAppStore((state) => state.rewards);
  const habits = useAppStore((state) => state.habits);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeBonusChainId = useAppStore((state) => state.activeBonusChainId);
  const hapticsEnabled = useAppStore((state) => state.settings.hapticsEnabled);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const reducedMotion = useAppStore((state) => state.settings.reducedMotion);
  const prepareSpin = useAppStore((state) => state.prepareSpin);
  const resolvePreparedSpin = useAppStore((state) => state.resolvePreparedSpin);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [lastLockedSlice, setLastLockedSlice] = useState<WheelSliceKind | undefined>(undefined);
  const [spinMessage, setSpinMessage] = useState<string | undefined>(undefined);
  const { animatedWheelStyle, isAnimating, startSpin } = useSpinAnimation();

  const spunCompletionIds = new Set(spinResults.map((spinResult) => spinResult.habitCompletionId));
  const latestCompletion = completions
    .slice()
    .filter((completion) => !spunCompletionIds.has(completion.id))
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0];
  const latestCompletionHabit = latestCompletion
    ? habits.find((habit) => habit.id === latestCompletion.habitId)
    : undefined;
  const inventoryTokens = tokens.filter(
    (token) =>
      token.state === 'in_inventory' &&
      (!latestCompletionHabit || token.jarId === latestCompletionHabit.jarId),
  );
  const selectedTokens = inventoryTokens.filter((token) => selectedTokenIds.includes(token.id));
  const cashIn = useMemo(() => resolveCashIn(selectedTokens), [selectedTokens]);
  const latestSpinResult = spinResults
    .slice()
    .sort((left, right) => right.spunAt.localeCompare(left.spunAt))[0];
  const activeGrant = activeRewardSession
    ? rewardGrants.find((grant) => grant.id === activeRewardSession.rewardGrantId)
    : undefined;
  const activeReward = activeGrant
    ? rewards.find((reward) => reward.id === activeGrant.rewardId)
    : undefined;
  const firstSpinChecklist = buildFirstSpinChecklist({
    hasRepReady: Boolean(latestCompletion),
    hasPendingSpin: Boolean(pendingSpin),
    hasActiveReward: Boolean(activeRewardSession),
    isCashInValid: cashIn.isValid,
    ...(cashIn.reason === undefined ? {} : { cashInReason: cashIn.reason }),
    selectedTokenCount: selectedTokens.length,
    inventoryTokenCount: inventoryTokens.length,
    activatedMaxTier: cashIn.activatedMaxTier,
  });

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  const toggleToken = (tokenId: string) => {
    setSelectedTokenIds((current) =>
      current.includes(tokenId)
        ? current.filter((selectedTokenId) => selectedTokenId !== tokenId)
        : [...current, tokenId],
    );
  };

  const completeSpin = () => {
    const result = resolvePreparedSpin();

    if (!result) {
      return;
    }

    const lockedSlice = result.wasNearMiss ? result.rawLandedSlice : undefined;
    const awardedReward = result.awardedRewardId
      ? rewards.find((reward) => reward.id === result.awardedRewardId)
      : undefined;
    setLastLockedSlice(lockedSlice === 'tier2' || lockedSlice === 'tier3' ? lockedSlice : undefined);
    setSpinMessage(
      result.rawLandedSlice === 'bonus'
        ? 'Bonus round unlocked.'
        : result.wasNearMiss
        ? `Near miss: landed on locked ${result.rawLandedSlice}, awarded Tier 1.`
        : awardedReward
          ? `Awarded ${result.awardedTier}: ${awardedReward.name}.`
          : `Awarded ${result.awardedTier}.`,
    );
    soundManager.setEnabled(soundEnabled);
    void soundManager.play(result.wasNearMiss ? 'nearMiss' : 'spinSettle');
    void playHapticPattern(result.wasNearMiss ? 'nearMiss' : 'spinSettle', hapticsEnabled);
  };

  const spin = () => {
    if (!latestCompletion || !cashIn.isValid || isAnimating || pendingSpin || activeRewardSession) {
      return;
    }

    const nextPendingSpin = prepareSpin({
      habitCompletionId: latestCompletion.id,
      cashedInTokenIds: cashIn.cashedInTokenIds,
      activatedMaxTier: cashIn.activatedMaxTier,
    });

    if (!nextPendingSpin) {
      return;
    }

    setSpinMessage(undefined);
    setLastLockedSlice(undefined);
    setSelectedTokenIds([]);
    soundManager.setEnabled(soundEnabled);
    void soundManager.play('spinStart');
    if (reducedMotion) {
      completeSpin();
      return;
    }

    startSpin({
      rawLandedSlice: nextPendingSpin.resolvedSpin.rawLandedSlice,
      wasNearMiss: nextPendingSpin.resolvedSpin.wasNearMiss,
      onComplete: completeSpin,
    });
  };

  return (
    <Screen>
      <Card>
        <Text variant="display">Spin</Text>
        <Text muted>
          Cash in matching tokens before spinning. Locked Tier 2 or Tier 3 landings visibly fall
          through to Tier 1.
        </Text>
        <Text muted>Leave tokens unselected for a Tier 1 spin.</Text>
      </Card>
      <Card>
        <Text variant="title">{firstSpinChecklist.title}</Text>
        <Text muted>{firstSpinChecklist.summary}</Text>
        <View style={{ gap: spacing.sm }}>
          {firstSpinChecklist.items.map((item) => (
            <View key={item.id} style={{ gap: spacing.xs }}>
              <Text style={{ color: checklistStatusColor[item.status] }}>
                {checklistStatusLabel[item.status]}: {item.label}
              </Text>
              <Text muted>{item.detail}</Text>
            </View>
          ))}
        </View>
      </Card>
      {pendingSpin ? (
        <Card>
          <Text variant="title">Interrupted spin ready</Text>
          <Text muted>Finish the saved spin result to continue.</Text>
          <Button label="Finish interrupted spin" onPress={completeSpin} />
        </Card>
      ) : null}
      {activeRewardSession && activeReward ? (
        <Card>
          <Text variant="title">Reward active: {activeReward.name}</Text>
          <Text muted>Finish or end the active reward before spinning again.</Text>
          <Button
            label="Open active reward"
            onPress={() =>
              router.push({
                pathname: '/reward/[id]',
                params: { id: activeReward.id },
              })
            }
          />
        </Card>
      ) : null}
      {!latestCompletion && !pendingSpin ? (
        <Card>
          <Text variant="title">No rep ready</Text>
          <Text muted>Complete a new habit rep before spinning.</Text>
        </Card>
      ) : null}
      <Card>
        <CashInPanel
          inventoryTokens={inventoryTokens}
          selectedTokens={selectedTokens}
          activatedMaxTier={cashIn.activatedMaxTier}
          isValid={cashIn.isValid}
          reason={cashIn.reason}
          onToggleToken={toggleToken}
          onClear={() => setSelectedTokenIds([])}
        />
      </Card>
      <Wheel
        activeTier={cashIn.activatedMaxTier}
        highlightedSlice={pendingSpin?.resolvedSpin.rawLandedSlice ?? latestSpinResult?.rawLandedSlice}
        lockedSlice={lastLockedSlice}
        animatedStyle={animatedWheelStyle}
      />
      {spinMessage ? (
        <Card>
          <Text variant="title" style={{ color: lastLockedSlice ? colors.warning : colors.success }}>
            Result
          </Text>
          <Text muted>{spinMessage}</Text>
        </Card>
      ) : null}
      {activeBonusChainId ? (
        <Button label="Open bonus round" tone="secondary" onPress={() => router.push('/bonus')} />
      ) : null}
      {activeRewardSession && activeReward ? (
        <Button
          label="Open active reward"
          tone="secondary"
          onPress={() =>
            router.push({
              pathname: '/reward/[id]',
              params: { id: activeReward.id },
            })
          }
        />
      ) : null}
      <Button
        disabled={
          !latestCompletion ||
          !cashIn.isValid ||
          isAnimating ||
          Boolean(pendingSpin) ||
          Boolean(activeRewardSession)
        }
        label={isAnimating || pendingSpin ? 'Spinning' : 'Spin'}
        onPress={spin}
      />
    </Screen>
  );
}
