import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';

export default function ManageScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const activeHabitCount = useAppStore(
    (state) => state.habits.filter((habit) => !habit.archivedAt).length,
  );
  const activeRewardCount = useAppStore(
    (state) => state.rewards.filter((reward) => !reward.archivedAt).length,
  );
  const activeJarCount = useAppStore(
    (state) => state.jars.filter((jar) => !jar.archivedAt).length,
  );

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Manage</Text>
        <Text muted>
          Onboarding creates the first loop. This is where you add more habits,
          reward options, jars, milestones, and product settings.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Loop options</Text>
        <Text muted>{activeHabitCount} active habits</Text>
        <Button label="Add or edit habits" onPress={() => router.push('/habits')} />
        <Text muted>{activeRewardCount} active rewards</Text>
        <Button label="Add or edit rewards" onPress={() => router.push('/rewards')} />
        <Text muted>{activeJarCount} active jars</Text>
        <Button label="Add or edit jars" onPress={() => router.push('/jars')} />
      </Card>

      <Card>
        <Text variant="title">Product controls</Text>
        <Button label="Settings" tone="secondary" onPress={() => router.push('/settings')} />
        <Button label="Stats" tone="secondary" onPress={() => router.push('/stats')} />
      </Card>
    </Screen>
  );
}
