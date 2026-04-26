import { Redirect, router } from 'expo-router';

import { Jar } from '@/components/Jar/Jar';
import { JarForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';

export default function JarsScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const jars = useAppStore((state) => state.jars);
  const tokens = useAppStore((state) => state.tokens);
  const createJar = useAppStore((state) => state.createJar);
  const archiveJar = useAppStore((state) => state.archiveJar);
  const restoreJar = useAppStore((state) => state.restoreJar);
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const archivedJars = jars.filter((jar) => jar.archivedAt);

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Jars</Text>
        <Text muted>Manage token destinations while preserving existing token references.</Text>
      </Card>

      <Card>
        <Text variant="title">Add jar</Text>
        <JarForm
          submitLabel="Add jar"
          onSubmit={(input) => {
            createJar(input);
          }}
        />
      </Card>

      {activeJars.length === 0 ? (
        <Card>
          <Text variant="title">No active jars</Text>
          <Text muted>Create or restore a jar before adding habits.</Text>
        </Card>
      ) : null}

      {activeJars.map((jar) => {
        const tokenCount = tokens.filter((token) => token.jarId === jar.id).length;

        return (
          <Card key={jar.id}>
            <Jar jar={jar} tokenCount={tokenCount} />
            <Button label="Details" onPress={() => router.push(`/jar/${jar.id}`)} />
            <Button label="Archive" tone="secondary" onPress={() => archiveJar(jar.id)} />
          </Card>
        );
      })}

      {archivedJars.length > 0 ? (
        <Card>
          <Text variant="title">Archived jars</Text>
          <Text muted>Archived jars keep their historical tokens and milestones.</Text>
        </Card>
      ) : null}

      {archivedJars.map((jar) => {
        const tokenCount = tokens.filter((token) => token.jarId === jar.id).length;

        return (
          <Card key={jar.id}>
            <Jar jar={jar} tokenCount={tokenCount} />
            <Text muted>Archived at {jar.archivedAt}</Text>
            <Button label="Restore" tone="secondary" onPress={() => restoreJar(jar.id)} />
          </Card>
        );
      })}
    </Screen>
  );
}
