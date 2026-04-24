import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';

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
import { playHapticPattern } from '@/haptics/patterns';
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';

export default function SpinScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const pendingSpin = useAppStore((state) => state.pendingSpin);
  const spinResults = useAppStore((state) => state.spinResults);
  const hapticsEnabled = useAppStore((state) => state.settings.hapticsEnabled);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const prepareSpin = useAppStore((state) => state.prepareSpin);
  const resolvePreparedSpin = useAppStore((state) => state.resolvePreparedSpin);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [lastLockedSlice, setLastLockedSlice] = useState<WheelSliceKind | undefined>(undefined);
  const [spinMessage, setSpinMessage] = useState<string | undefined>(undefined);
  const { animatedWheelStyle, isAnimating, startSpin } = useSpinAnimation();

  const latestCompletion = completions
    .slice()
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0];
  const inventoryTokens = tokens.filter((token) => token.state === 'in_inventory');
  const selectedTokens = inventoryTokens.filter((token) => selectedTokenIds.includes(token.id));
  const cashIn = useMemo(() => resolveCashIn(selectedTokens), [selectedTokens]);
  const latestSpinResult = spinResults
    .slice()
    .sort((left, right) => right.spunAt.localeCompare(left.spunAt))[0];

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
    setLastLockedSlice(lockedSlice === 'tier2' || lockedSlice === 'tier3' ? lockedSlice : undefined);
    setSpinMessage(
      result.wasNearMiss
        ? `Near miss: landed on locked ${result.rawLandedSlice}, awarded Tier 1.`
        : `Awarded ${result.awardedTier}.`,
    );
    soundManager.setEnabled(soundEnabled);
    void soundManager.play(result.wasNearMiss ? 'nearMiss' : 'spinSettle');
    void playHapticPattern(result.wasNearMiss ? 'nearMiss' : 'spinSettle', hapticsEnabled);
  };

  const spin = () => {
    if (!latestCompletion || !cashIn.isValid || isAnimating || pendingSpin) {
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
      </Card>
      {!latestCompletion ? (
        <Card>
          <Text variant="title">No rep ready</Text>
          <Text muted>Complete a habit on Home before spinning.</Text>
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
      <Button
        disabled={!latestCompletion || !cashIn.isValid || isAnimating || Boolean(pendingSpin)}
        label={isAnimating || pendingSpin ? 'Spinning' : 'Spin'}
        onPress={spin}
      />
    </Screen>
  );
}
