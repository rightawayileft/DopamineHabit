import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { TokenInventory } from '@/components/TokenInventory';
import { JarForm, MilestoneForm } from '@/components/management/ManagementForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmActionButton } from '@/components/ui/ConfirmActionButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildJarLedgers } from '@/game/jarLedgers';
import { buildJarProgress } from '@/game/milestones';
import { formatCents } from '@/game/stats';
import { useAppStore } from '@/store';
import type { Token } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const tokenStateLabel: Record<Token['state'], string> = {
  cashed_in: 'cashed in',
  in_inventory: 'in inventory',
  in_jar: 'in jar',
};

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
  const ledgers = buildJarLedgers(jar, tokens);

  return (
    <Screen>
      <Card>
        <Text variant="display">{jar.name}</Text>
        <Text muted>
          {jar.archivedAt ? `Archived ${formatLocalDateTime(jar.archivedAt)}` : 'Active jar'}
        </Text>
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
        <Text variant="title">Milestone ledger</Text>
        {jar.milestones.length === 0 ? <Text muted>No milestones yet.</Text> : null}
        {progress.nextMilestone ? (
          <Text muted>
            Next: {progress.nextMilestone.label}, {progress.tokensUntilNextMilestone} tokens left
          </Text>
        ) : (
          <Text muted>All milestones unlocked.</Text>
        )}
        {ledgers.milestoneLedger.map((milestone) => (
          <View
            key={milestone.id}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              borderRadius: radius.sm,
              borderWidth: 1,
              gap: spacing.xs,
              padding: spacing.sm,
            }}
          >
            <Text>{milestone.label}</Text>
            <Text muted>{milestone.tokenThreshold} tokens</Text>
            <Text muted>
              {milestone.status === 'unlocked'
                ? `Unlocked ${formatLocalDateTime(milestone.unlockedAt)}`
                : `${milestone.tokensRemaining} tokens remaining`}
            </Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="title">Fun money ledger</Text>
        {jar.funMoneyEnabled ? (
          <>
            <Text muted>
              Balance: {formatCents(ledgers.funMoneyBalanceCents)} at{' '}
              {formatCents(ledgers.funMoneyPerTokenCents)} per token
            </Text>
            {ledgers.recentFunMoneyEntries.length === 0 ? (
              <Text muted>No fun-money token entries yet.</Text>
            ) : null}
            {ledgers.recentFunMoneyEntries.map((entry) => (
              <View
                key={entry.id}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  gap: spacing.xs,
                  padding: spacing.sm,
                }}
              >
                <Text>
                  {formatCents(entry.amountCents)} from {entry.tokenColor}
                </Text>
                <Text muted>
                  Earned {formatLocalDateTime(entry.earnedAt)} - {tokenStateLabel[entry.tokenState]}
                </Text>
              </View>
            ))}
            {ledgers.totalFunMoneyEntryCount > ledgers.recentFunMoneyEntries.length ? (
              <Text muted>
                Showing {ledgers.recentFunMoneyEntries.length} of{' '}
                {ledgers.totalFunMoneyEntryCount} token entries.
              </Text>
            ) : null}
          </>
        ) : (
          <Text muted>Fun money is off for this jar.</Text>
        )}
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
