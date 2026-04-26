import { Redirect, useLocalSearchParams } from 'expo-router';

import { TokenInventory } from '@/components/TokenInventory';
import { JarForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
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

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  const jar = jars.find((candidate) => candidate.id === id);

  if (!jar) {
    return <Redirect href="/jars" />;
  }

  const jarHabits = habits.filter((habit) => habit.jarId === jar.id);
  const jarTokens = tokens.filter((token) => token.jarId === jar.id);

  return (
    <Screen>
      <Card>
        <Text variant="display">{jar.name}</Text>
        <Text muted>{jar.archivedAt ? `Archived at ${jar.archivedAt}` : 'Active jar'}</Text>
        <Text muted>{jarHabits.length} linked habits</Text>
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
        <Text variant="title">Inventory</Text>
        <TokenInventory tokens={jarTokens} />
      </Card>

      <Card>
        <Text variant="title">Archive state</Text>
        {jar.archivedAt ? (
          <Button label="Restore jar" tone="secondary" onPress={() => restoreJar(jar.id)} />
        ) : (
          <Button label="Archive jar" tone="secondary" onPress={() => archiveJar(jar.id)} />
        )}
      </Card>
    </Screen>
  );
}
