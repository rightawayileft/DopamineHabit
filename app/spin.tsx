import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

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
import {
  buildSpinDisabledReason,
  buildSpinOutcomeDetails,
  type SpinOutcomeDetails,
} from '@/game/spinComprehension';
import { playHapticPattern } from '@/haptics/patterns';
import { useAppStore } from '@/store';
import { useTimer } from '@/hooks/useTimer';
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
  const syncRewardSessionState = useAppStore((state) => state.syncRewardSessionState);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [lastLockedSlice, setLastLockedSlice] = useState<WheelSliceKind | undefined>(undefined);
  const [lastOutcomeDetails, setLastOutcomeDetails] = useState<SpinOutcomeDetails | undefined>(
    undefined,
  );
  const { animatedWheelStyle, isAnimating, startSpin } = useSpinAnimation();
  const remainingRewardMs = useTimer(activeRewardSession?.expiresAt);

  useEffect(() => {
    syncRewardSessionState();
  }, [remainingRewardMs, syncRewardSessionState]);

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
  const isBeforeFirstReward = rewardGrants.length === 0;
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
  const spinDisabledReason = buildSpinDisabledReason({
    hasRepReady: Boolean(latestCompletion),
    hasPendingSpin: Boolean(pendingSpin),
    hasActiveReward: Boolean(activeRewardSession),
    isAnimating,
    isCashInValid: cashIn.isValid,
    ...(cashIn.reason === undefined ? {} : { cashInReason: cashIn.reason }),
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
    setLastOutcomeDetails(
      buildSpinOutcomeDetails({
        result,
        ...(awardedReward === undefined ? {} : { awardedReward }),
        cashedInTokenCount: result.cashedInTokenIds.length,
      }),
    );
    if (reducedMotion) {
      AccessibilityInfo.announceForAccessibility(
        result.rawLandedSlice === 'bonus'
          ? 'Bonus round unlocked.'
          : 'Spin resolved. Reward outcome is ready.',
      );
    }
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

    setLastOutcomeDetails(undefined);
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
          {isBeforeFirstReward
            ? 'First spin: leave tokens unselected and earn the starter reward.'
            : 'Spin now, or save matching tokens to activate higher tiers.'}
        </Text>
        <Text muted>Locked Tier 2 or Tier 3 landings visibly fall through to Tier 1.</Text>
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
          <Text muted>
            Finish it, stop clean, or log a boundary slip before the next spin.
          </Text>
          <Button
            label="Open reward boundary"
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
        {isBeforeFirstReward ? (
          <>
            <Text variant="title">First reward path</Text>
            <Text muted>
              No cash-in needed yet. Keep the token you just earned; matching-token strategy
              unlocks after the first reward.
            </Text>
            <Text muted>Tier 1 is active for this starter spin.</Text>
          </>
        ) : (
          <CashInPanel
            inventoryTokens={inventoryTokens}
            selectedTokens={selectedTokens}
            activatedMaxTier={cashIn.activatedMaxTier}
            isValid={cashIn.isValid}
            reason={cashIn.reason}
            onToggleToken={toggleToken}
            onClear={() => setSelectedTokenIds([])}
          />
        )}
      </Card>
      <Wheel
        activeTier={cashIn.activatedMaxTier}
        highlightedSlice={pendingSpin?.resolvedSpin.rawLandedSlice ?? latestSpinResult?.rawLandedSlice}
        lockedSlice={lastLockedSlice}
        animatedStyle={animatedWheelStyle}
      />
      {lastOutcomeDetails ? (
        <Card>
          <Text variant="title" style={{ color: lastLockedSlice ? colors.warning : colors.success }}>
            {lastOutcomeDetails.title}
          </Text>
          {lastOutcomeDetails.lines.map((line) => (
            <Text key={line} muted>
              {line}
            </Text>
          ))}
          {activeRewardSession && activeReward ? (
            <>
              <Button
                label={`Open active reward: ${activeReward.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/reward/[id]',
                    params: { id: activeReward.id },
                  })
                }
              />
              <Text muted>Timer is already running.</Text>
            </>
          ) : null}
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
      {spinDisabledReason ? (
        <Card>
          <Text variant="title">Spin not ready</Text>
          <Text muted>{spinDisabledReason}</Text>
        </Card>
      ) : null}
      <Button
        disabled={
          !latestCompletion ||
          !cashIn.isValid ||
          isAnimating ||
          Boolean(pendingSpin) ||
          Boolean(activeRewardSession)
        }
        label={
          isAnimating
            ? 'Spinning'
            : pendingSpin
              ? 'Finish saved spin first'
              : !cashIn.isValid
                ? 'Fix token selection'
                : 'Spin'
        }
        onPress={spin}
      />
    </Screen>
  );
}
