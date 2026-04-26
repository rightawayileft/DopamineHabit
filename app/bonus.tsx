import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { bonusAwardLabel } from '@/game/bonus';
import { BONUS_CHAIN_MAX } from '@/game/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';
import { spacing } from '@/theme/spacing';

const formatRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

export default function BonusScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const bonusChains = useAppStore((state) => state.bonusChains);
  const activeBonusChainId = useAppStore((state) => state.activeBonusChainId);
  const startBonusSpin = useAppStore((state) => state.startBonusSpin);
  const completeBonusTimer = useAppStore((state) => state.completeBonusTimer);
  const syncBonusChainState = useAppStore((state) => state.syncBonusChainState);
  const activeBonusChain = activeBonusChainId
    ? bonusChains.find((chain) => chain.id === activeBonusChainId)
    : undefined;
  const activeBonusSpin = activeBonusChain?.spins[activeBonusChain.spins.length - 1];
  const remainingMs = useTimer(
    activeBonusSpin?.completedCompletionId ? undefined : activeBonusSpin?.timerExpiresAt,
  );
  const activeJarIds = new Set(jars.filter((jar) => !jar.archivedAt).map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );

  useEffect(() => {
    syncBonusChainState();
  }, [remainingMs, syncBonusChainState]);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Bonus</Text>
        <Text muted>
          Chain {activeBonusChain ? activeBonusChain.spins.length : 0}/{BONUS_CHAIN_MAX}
        </Text>
      </Card>

      {!activeBonusChain ? (
        <Card>
          <Text variant="title">No active bonus</Text>
          <Text muted>Land on Bonus from the spin wheel to start a chain.</Text>
        </Card>
      ) : null}

      {activeBonusChain && !activeBonusSpin ? (
        <Card>
          <Text variant="title">Bonus ready</Text>
          <Button label="Start bonus timer" onPress={() => startBonusSpin()} />
        </Card>
      ) : null}

      {activeBonusChain && activeBonusSpin ? (
        <Card>
          <Text variant="title">{bonusAwardLabel(activeBonusSpin.bonusAwardLanded)}</Text>
          <Text muted style={{ fontVariant: ['tabular-nums'] }}>
            {formatRemaining(remainingMs)}
          </Text>
          {activeBonusSpin.completedCompletionId ? (
            <Text muted>Claimed</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {activeHabits.map((habit) => (
                <Button
                  key={habit.id}
                  label={`Claim with ${habit.name}`}
                  onPress={() => completeBonusTimer({ habitId: habit.id })}
                />
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {activeBonusChain?.outcome === 'in_progress' && activeBonusSpin?.completedCompletionId ? (
        <Card>
          <Text variant="title">Chain continues</Text>
          <Button label="Start next bonus spin" onPress={() => startBonusSpin()} />
        </Card>
      ) : null}
    </Screen>
  );
}
