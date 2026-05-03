import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Jar } from '@/components/Jar/Jar';
import { JarForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmActionButton } from '@/components/ui/ConfirmActionButton';
import { FilterChips, type FilterChipOption } from '@/components/ui/FilterChips';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildJarProgress } from '@/game/milestones';
import { useAppStore } from '@/store';
import type { Jar as JarRecord } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

type JarView = 'active' | 'archived' | 'all';

const jarViewOptions: FilterChipOption<JarView>[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

export default function JarsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [jarView, setJarView] = useState<JarView>('active');
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const jars = useAppStore((state) => state.jars);
  const tokens = useAppStore((state) => state.tokens);
  const createJar = useAppStore((state) => state.createJar);
  const archiveJar = useAppStore((state) => state.archiveJar);
  const restoreJar = useAppStore((state) => state.restoreJar);
  const activeJars = jars.filter((jar) => !jar.archivedAt);
  const archivedJars = jars.filter((jar) => jar.archivedAt);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (jar: JarRecord): boolean =>
    normalizedSearchQuery.length === 0 || jar.name.toLowerCase().includes(normalizedSearchQuery);
  const visibleActiveJars = activeJars.filter(matchesSearch);
  const visibleArchivedJars = archivedJars.filter(matchesSearch);
  const shouldShowActive = jarView === 'active' || jarView === 'all';
  const shouldShowArchived = jarView === 'archived' || jarView === 'all';
  const jarRow = (jar: JarRecord, status: 'active' | 'archived') => {
    const progress = buildJarProgress(jar, tokens);

    return (
      <View
        key={`${status}-${jar.id}`}
        style={{
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          gap: spacing.sm,
          padding: spacing.sm,
        }}
      >
        <Jar
          jar={jar}
          tokenCount={progress.earnedTokenCount}
          inventoryTokenCount={progress.inventoryTokenCount}
        />
        {status === 'archived' ? (
          <Text muted>Archived {formatLocalDateTime(jar.archivedAt)}</Text>
        ) : progress.nextMilestone ? (
          <Text muted>
            Next: {progress.nextMilestone.label}, {progress.tokensUntilNextMilestone} tokens left
          </Text>
        ) : (
          <Text muted>All milestones unlocked.</Text>
        )}
        <Button label="Details" tone="secondary" onPress={() => router.push(`/jar/${jar.id}`)} />
        {status === 'active' ? (
          <ConfirmActionButton
            label="Archive"
            confirmLabel="Confirm archive jar"
            message="This pauses linked habits until the jar is restored."
            onConfirm={() => archiveJar(jar.id)}
          />
        ) : (
          <Button label="Restore" tone="secondary" onPress={() => restoreJar(jar.id)} />
        )}
      </View>
    );
  };

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
        <Text variant="title">Find jars</Text>
        <Input value={searchQuery} onChangeText={setSearchQuery} placeholder="Search jars" />
        <FilterChips options={jarViewOptions} selectedId={jarView} onSelect={setJarView} />
        <Text muted>
          Showing {visibleActiveJars.length} active and {visibleArchivedJars.length} archived.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Add jar</Text>
        <Text muted>
          A jar groups tokens from related habits. Milestones and optional fun money are tracked
          per jar.
        </Text>
        <JarForm
          submitLabel="Add jar"
          onSubmit={(input) => {
            createJar(input);
          }}
        />
      </Card>

      {shouldShowActive && visibleActiveJars.length === 0 ? (
        <Card>
          <Text variant="title">No active matches</Text>
          <Text muted>Create, restore, or clear search to see active jars.</Text>
        </Card>
      ) : null}

      {shouldShowActive && visibleActiveJars.length > 0 ? (
        <Card>
          <Text variant="title">Active jars</Text>
          {visibleActiveJars.map((jar) => jarRow(jar, 'active'))}
        </Card>
      ) : null}

      {shouldShowArchived && visibleArchivedJars.length > 0 ? (
        <Card>
          <Text variant="title">Archived jars</Text>
          <Text muted>Archived jars keep their historical tokens and milestones.</Text>
          {visibleArchivedJars.map((jar) => jarRow(jar, 'archived'))}
        </Card>
      ) : null}
    </Screen>
  );
}
