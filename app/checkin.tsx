import { Redirect } from 'expo-router';

import { buildIntegrityDisplayInputs } from '@/game/integrity';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppStore } from '@/store';
import type { IntegrityCheckIn } from '@/store/types';
import { colors } from '@/theme/colors';
import { toLocalDateKey } from '@/utils/date';

const answerLabel = (answer: IntegrityCheckIn['answer']): string => {
  if (answer === 'yes') {
    return 'Kept the rule';
  }

  if (answer === 'partially') {
    return 'Partially';
  }

  return 'Did not keep it';
};

const yesterdayKey = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return toLocalDateKey(date);
};

export default function IntegrityCheckInScreen() {
  const nakedRuleAcceptedAt = useAppStore((state) => state.settings.nakedRuleAcceptedAt);
  const integrityCheckIns = useAppStore((state) => state.integrityCheckIns);
  const integrityRuntime = useAppStore((state) => state.integrityRuntime);
  const integrityCheckInTime = useAppStore((state) => state.settings.integrityCheckInTime);
  const answerIntegrityCheckIn = useAppStore((state) => state.answerIntegrityCheckIn);
  const todayKey = toLocalDateKey();
  const display = buildIntegrityDisplayInputs({
    checkIns: integrityCheckIns,
    runtime: integrityRuntime,
    todayKey,
    yesterdayKey: yesterdayKey(),
  });
  const sortedCheckIns = integrityCheckIns
    .slice()
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt));

  if (!nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Integrity</Text>
        <Text muted>Daily check-in time: {integrityCheckInTime}</Text>
      </Card>

      <Card>
        <Text variant="title">Today</Text>
        {display.todayCheckIn ? (
          <Text muted>Checked in: {answerLabel(display.todayCheckIn.answer)}</Text>
        ) : (
          <>
            <Text muted>Answer once for today.</Text>
            <Button label="Yes" onPress={() => answerIntegrityCheckIn('yes')} />
            <Button
              label="Partially"
              tone="secondary"
              onPress={() => answerIntegrityCheckIn('partially')}
            />
            <Button label="No" tone="secondary" onPress={() => answerIntegrityCheckIn('no')} />
          </>
        )}
      </Card>

      <Card>
        <Text variant="title">Scoreboard</Text>
        <Text muted style={{ fontVariant: ['tabular-nums'] }}>
          Honesty streak: {integrityRuntime.honestyStreak}
        </Text>
        <Text muted style={{ fontVariant: ['tabular-nums'] }}>
          Honest admissions: {integrityRuntime.honestAdmissionCount}
        </Text>
      </Card>

      {display.warningMessages.length > 0 ? (
        <Card>
          <Text variant="title" style={{ color: colors.warning }}>
            Watch items
          </Text>
          {display.warningMessages.map((warning, index) => (
            <Text key={`${warning}-${index}`} muted>
              {warning}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text variant="title">History</Text>
        {sortedCheckIns.length === 0 ? <Text muted>No check-ins yet.</Text> : null}
        {sortedCheckIns.map((checkIn) => (
          <Card key={checkIn.id}>
            <Text variant="title">{checkIn.date}</Text>
            <Text muted>{answerLabel(checkIn.answer)}</Text>
            <Text muted>{checkIn.answeredAt}</Text>
          </Card>
        ))}
      </Card>
    </Screen>
  );
}
