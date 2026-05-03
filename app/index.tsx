import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { soundManager } from '@/audio/SoundManager';
import { HabitCard } from '@/components/HabitCard';
import { FirstRepHero } from '@/components/onboarding/FirstRepHero';
import { LoopMap } from '@/components/onboarding/LoopMap';
import { TokenRevealCard } from '@/components/onboarding/TokenRevealCard';
import { TokenInventory } from '@/components/TokenInventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { findCheckInForDate } from '@/game/integrity';
import { buildReturnBrief } from '@/game/returnBrief';
import { playHapticPattern } from '@/haptics/patterns';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store';
import { spacing } from '@/theme/spacing';
import { toLocalDateKey } from '@/utils/date';

export default function HomeScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const completions = useAppStore((state) => state.completions);
  const integrityCheckIns = useAppStore((state) => state.integrityCheckIns);
  const tokens = useAppStore((state) => state.tokens);
  const spinResults = useAppStore((state) => state.spinResults);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const activeRewardSession = useAppStore((state) => state.activeRewardSession);
  const lastCompletionFeedback = useAppStore((state) => state.lastCompletionFeedback);
  const integrityCheckInTime = useAppStore((state) => state.settings.integrityCheckInTime);
  const lastSeenTimestamp = useAppStore((state) => state.integrityRuntime.lastSeenTimestamp);
  const checkInReminderEnabled = useAppStore(
    (state) => state.settings.checkInReminderEnabled,
  );
  const hapticsEnabled = useAppStore((state) => state.settings.hapticsEnabled);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const logHabitCompletion = useAppStore((state) => state.logHabitCompletion);
  const syncRewardSessionState = useAppStore((state) => state.syncRewardSessionState);
  const remainingRewardMs = useTimer(activeRewardSession?.expiresAt);

  useEffect(() => {
    syncRewardSessionState();
  }, [remainingRewardMs, syncRewardSessionState]);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  if (jars.length === 0 || habits.length === 0 || rewards.length === 0) {
    return <Redirect href="/onboarding/step2" />;
  }

  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const activeJarIds = new Set(activeJars.map((jar) => jar.id));
  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && activeJarIds.has(habit.jarId),
  );
  const activeRewards = rewards.filter((reward) => !reward.archivedAt);
  const firstHabit = activeHabits[0];
  const firstJar = activeJars[0];
  const firstReward = activeRewards[0];
  const inventoryTokens = tokens.filter((token) => token.state === 'in_inventory');
  const todayCheckIn = findCheckInForDate(integrityCheckIns, toLocalDateKey());
  const spunCompletionIds = new Set(spinResults.map((spinResult) => spinResult.habitCompletionId));
  const readyCompletion = completions
    .slice()
    .filter((completion) => !spunCompletionIds.has(completion.id))
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0];
  const feedbackCanSpin =
    lastCompletionFeedback?.status === 'completed' &&
    lastCompletionFeedback.completionId !== undefined &&
    !spunCompletionIds.has(lastCompletionFeedback.completionId);
  const hasRewardLoopStarted = rewardGrants.length > 0;
  const hasLoggedAnyRep = completions.length > 0;
  const showFirstRepHero = Boolean(firstHabit) && !hasLoggedAnyRep && !lastCompletionFeedback;
  const showFirstLoopMode = !hasRewardLoopStarted;
  const returnBrief = buildReturnBrief({
    activeRewardSession,
    completions,
    integrityCheckIns,
    inventoryTokens,
    lastSeenTimestamp,
  });

  const completeHabit = (habitId: string) => {
    const completion = logHabitCompletion({ habitId });

    if (!completion) {
      return;
    }

    soundManager.setEnabled(soundEnabled);
    void soundManager.play('habitDone');
    void soundManager.play('tokenDrawn');
    void playHapticPattern('habitDone', hapticsEnabled);
    void playHapticPattern('tokenDrawn', hapticsEnabled);
  };

  if (showFirstLoopMode) {
    return (
      <Screen>
        {showFirstRepHero && firstHabit ? (
          <FirstRepHero
            habit={firstHabit}
            reward={firstReward}
            onDone={() => completeHabit(firstHabit.id)}
          />
        ) : null}
        {lastCompletionFeedback ? (
          <TokenRevealCard
            canSpin={feedbackCanSpin}
            message={lastCompletionFeedback.message}
            onSpin={() => router.push('/spin')}
            title={lastCompletionFeedback.status === 'completed' ? 'Proof earned' : 'Not yet'}
            tokenColor={lastCompletionFeedback.tokenColor}
          />
        ) : null}
        {!showFirstRepHero && !lastCompletionFeedback ? (
          <Card tone="hero">
            <Text variant="display">Spin for the reward.</Text>
            <Text muted>
              Your tiny rep is logged. The next step is the spin that starts your timed reward.
            </Text>
            <LoopMap activeStep={readyCompletion ? 'token' : 'pause'} compact />
            <Button
              label={readyCompletion ? 'Spin now' : 'Do first rep'}
              size="large"
              onPress={() => {
                if (readyCompletion) {
                  router.push('/spin');
                } else if (firstHabit) {
                  completeHabit(firstHabit.id);
                }
              }}
            />
          </Card>
        ) : null}
        <Card>
          <Text variant="title">Your starter reward</Text>
          <Text muted>
            {firstReward
              ? `${firstReward.name}, ${firstReward.durationMinutes ?? 3} minutes`
              : 'Create a reward to finish setup.'}
          </Text>
          <Text muted>
            Everything else can wait until this first reward starts.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {showFirstRepHero && firstHabit ? (
        <FirstRepHero
          habit={firstHabit}
          reward={firstReward}
          onDone={() => completeHabit(firstHabit.id)}
        />
      ) : null}
      {!showFirstRepHero ? (
        <Card tone={returnBrief.shouldShow ? 'hero' : 'default'}>
          <Text variant="title">DopamineHabit</Text>
          <Text muted>Do one rep, draw one token, then spin for the first reward.</Text>
        </Card>
      ) : null}
      {returnBrief.shouldShow ? (
        <Card tone="hero">
          <Text variant="title">{returnBrief.title}</Text>
          <Text muted>{returnBrief.message}</Text>
          <Button
            label={returnBrief.primaryLabel}
            onPress={() => router.push(returnBrief.primaryRoute)}
          />
        </Card>
      ) : null}
      {lastCompletionFeedback ? (
        <TokenRevealCard
          canSpin={feedbackCanSpin}
          message={lastCompletionFeedback.message}
          onSpin={() => router.push('/spin')}
          title={lastCompletionFeedback.status === 'completed' ? 'Token earned' : 'Not yet'}
          tokenColor={lastCompletionFeedback.tokenColor}
        />
      ) : null}
      <Card>
        <Text variant="title">Today</Text>
        <View style={{ gap: spacing.sm }}>
          <Text muted>Jar: {firstJar?.name ?? 'No active jar'}</Text>
          <Text muted>
            First reward: {firstReward?.name ?? 'No active reward'}
            {firstReward?.durationMinutes ? `, ${firstReward.durationMinutes} min` : ''}
          </Text>
          <Text muted>
            Integrity check-in:{' '}
            {hasRewardLoopStarted ? integrityCheckInTime : `after your first reward loop`}
          </Text>
        </View>
      </Card>
      {hasRewardLoopStarted && !todayCheckIn ? (
        <Card>
          <Text variant="title">Integrity check-in is open</Text>
          <Text muted>
            One honest answer today keeps the gate trustworthy. Reminder:{' '}
            {checkInReminderEnabled ? 'on' : 'off'} at {integrityCheckInTime}.
          </Text>
          <Button
            label="Answer today's check-in"
            tone="secondary"
            onPress={() => router.push('/checkin')}
          />
        </Card>
      ) : null}
      <View style={{ gap: spacing.md }}>
        {activeHabits.length === 0 ? (
          <Card>
            <Text variant="title">No active habits</Text>
            <Text muted>Create or restore a habit from Manage options.</Text>
          </Card>
        ) : null}
        {activeHabits.map((habit) =>
          showFirstRepHero && habit.id === firstHabit?.id ? null : (
            <HabitCard
              key={habit.id}
              habit={habit}
              completionCount={
                completions.filter((completion) => completion.habitId === habit.id).length
              }
              onDone={() => completeHabit(habit.id)}
              onOpen={() =>
                router.push({
                  pathname: '/habit/[id]',
                  params: { id: habit.id },
                })
              }
            />
          ),
        )}
      </View>
      <Card>
        <Text variant="title">Inventory</Text>
        <TokenInventory tokens={inventoryTokens} />
        {firstHabit ? <Button label="Open spin setup" onPress={() => router.push('/spin')} /> : null}
      </Card>
      <Card>
        <Text variant="title">Grow the loop</Text>
        <Text muted>
          Your first loop is only a starting point. Add more habit cues, reward choices, and jars
          as your routines expand.
        </Text>
        <Button label="Manage all options" onPress={() => router.push('/manage')} />
        <Button label="Add habit" tone="secondary" onPress={() => router.push('/habits')} />
        <Button label="Add reward" tone="secondary" onPress={() => router.push('/rewards')} />
        <Button label="Add jar" tone="secondary" onPress={() => router.push('/jars')} />
        {hasRewardLoopStarted ? (
          <Button
            label="Integrity check-in"
            tone="secondary"
            onPress={() => router.push('/checkin')}
          />
        ) : null}
      </Card>
    </Screen>
  );
}
