import { Redirect, useLocalSearchParams } from 'expo-router';

import { MilestoneLine } from '@/components/MilestoneLine';
import { TokenInventory } from '@/components/TokenInventory';
import { JarForm, MilestoneForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmActionButton } from '@/components/ui/ConfirmActionButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildJarProgress } from '@/game/milestones';
import { useAppStore } from '@/store';

export default function JarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const jars = useAppStore((state) => state.jars);
  const habits = useAppStore((state) => state.habits);
  const tokens = useAppStore((state) => state.tokens);
  const updateJar = useAppStore((state) => state.updateJar);
  const archiveJar = useAppStore((state) => state.archiveJar);
  const restoreJar = useAppStore((state) => state.restoreJar);
  const addJarMilestone = useAppStore((state) => state.addJarMilestone);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  const jar = jars.find((candidate) => candidate.id === id);

  if (!jar) {
    return <Redirect href="/jars" />;
  }

  const jarHabits = habits.filter((habit) => habit.jarId === jar.id);
  const jarTokens = tokens.filter((token) => token.jarId === jar.id);
  const progress = buildJarProgress(jar, tokens);

  return (
    <Screen>
      <Card>
        <Text variant="display">{jar.name}</Text>
        <Text muted>{jar.archivedAt ? `Archived at ${jar.archivedAt}` : 'Active jar'}</Text>
        <Text muted>{jarHabits.length} linked habits</Text>
        <Text muted>{progress.earnedTokenCount} tokens earned</Text>
        <Text muted>
          Milestones: {progress.unlockedMilestoneCount}/{progress.totalMilestoneCount}
        </Text>
        {jar.funMoneyEnabled ? (
          <Text muted>Fun money: ${(jar.funMoneyBalanceCents / 100).toFixed(2)}</Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="title">Edit jar</Text>
        <JarForm
          initialJar={jar}
          submitLabel="Save jar"
          onSubmit={(input) => {
            updateJar({ ...input, id: jar.id });
          }}
        />
      </Card>

      <Card>
        <Text variant="title">Token ledger</Text>
        <Text muted>Inventory stays spendable; cashed-in tokens remain here as history.</Text>
        <TokenInventory tokens={jarTokens} showLedger />
      </Card>

      <Card>
        <Text variant="title">Milestones</Text>
        {jar.milestones.length === 0 ? <Text muted>No milestones yet.</Text> : null}
        {progress.nextMilestone ? (
          <Text muted>
            Next: {progress.nextMilestone.label}, {progress.tokensUntilNextMilestone} tokens left
          </Text>
        ) : (
          <Text muted>All milestones unlocked.</Text>
        )}
        {jar.milestones.map((milestone) => (
          <MilestoneLine
            key={milestone.id}
            milestone={milestone}
            earnedTokenCount={progress.earnedTokenCount}
          />
        ))}
      </Card>

      <Card>
        <Text variant="title">Add milestone</Text>
        <MilestoneForm
          jarId={jar.id}
          submitLabel="Add milestone"
          onSubmit={(input) => {
            addJarMilestone(input);
          }}
        />
      </Card>

      <Card>
        <Text variant="title">Archive state</Text>
        {jar.archivedAt ? (
          <Button label="Restore jar" tone="secondary" onPress={() => restoreJar(jar.id)} />
        ) : (
          <ConfirmActionButton
            label="Archive jar"
            confirmLabel="Confirm archive jar"
            message="This pauses linked habits until the jar is restored."
            onConfirm={() => archiveJar(jar.id)}
          />
        )}
      </Card>
    </Screen>
  );
}
