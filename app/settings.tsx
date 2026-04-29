import Constants from 'expo-constants';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { buildReminderStatusCopy } from '@/game/checkInReminder';
import { useCheckInReminder } from '@/hooks/useCheckInReminder';
import { APP_STORE_STORAGE_KEY, persistenceStatus } from '@/store/persistence';
import { APP_STORE_PERSIST_VERSION, useAppStore, type ImportLocalDataPreview } from '@/store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatLocalDateTime } from '@/utils/dateDisplay';

const isValidLocalTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const habits = useAppStore((state) => state.habits);
  const jars = useAppStore((state) => state.jars);
  const rewards = useAppStore((state) => state.rewards);
  const completions = useAppStore((state) => state.completions);
  const tokens = useAppStore((state) => state.tokens);
  const rewardGrants = useAppStore((state) => state.rewardGrants);
  const integrityCheckIns = useAppStore((state) => state.integrityCheckIns);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const exportLocalData = useAppStore((state) => state.exportLocalData);
  const previewImportLocalData = useAppStore((state) => state.previewImportLocalData);
  const importLocalData = useAppStore((state) => state.importLocalData);
  const resetLocalData = useAppStore((state) => state.resetLocalData);
  const [checkInTime, setCheckInTime] = useState(settings.integrityCheckInTime);
  const [exportJson, setExportJson] = useState('');
  const [lastExportedAt, setLastExportedAt] = useState<string | undefined>(undefined);
  const [importJson, setImportJson] = useState('');
  const [importMessage, setImportMessage] = useState<string | undefined>(undefined);
  const [importPreview, setImportPreview] = useState<ImportLocalDataPreview | undefined>(
    undefined,
  );
  const [reminderMessage, setReminderMessage] = useState<string | undefined>(undefined);
  const [resetArmed, setResetArmed] = useState(false);
  const validCheckInTime = isValidLocalTime(checkInTime);
  const reminder = useCheckInReminder(
    settings.integrityCheckInTime,
    settings.checkInReminderEnabled,
  );
  const reminderStatus = buildReminderStatusCopy({
    enabled: settings.checkInReminderEnabled,
    time: settings.integrityCheckInTime,
    permissionState: reminder.permissionState,
    ...(reminder.errorMessage === undefined ? {} : { errorMessage: reminder.errorMessage }),
  });
  const reminderButtonDisabled =
    !settings.checkInReminderEnabled &&
    (reminder.permissionState === 'unsupported' ||
      reminder.permissionState === 'denied' ||
      reminder.permissionState === 'unknown' ||
      !validCheckInTime);
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const projectIdText = typeof projectId === 'string' ? projectId : 'Not linked';

  const toggleReminder = async () => {
    setReminderMessage(undefined);

    if (settings.checkInReminderEnabled) {
      updateSettings({ checkInReminderEnabled: false });
      setReminderMessage('Daily reminder turned off.');
      return;
    }

    const granted = await reminder.requestPermission();

    if (!granted) {
      setReminderMessage('Reminder permission was not granted. You can still check in manually.');
      return;
    }

    updateSettings({ checkInReminderEnabled: true });
    setReminderMessage(`Daily reminder will use ${settings.integrityCheckInTime}.`);
  };

  if (!settings.nakedRuleAcceptedAt) {
    return <Redirect href="/onboarding/step1" />;
  }

  return (
    <Screen>
      <Card>
        <Text variant="display">Settings</Text>
        <Text muted>
          Tune the loop, confirm which build you are seeing, and manage platform behavior.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Daily integrity check-in</Text>
        <Text muted>
          The app records one answer per local day. Reminders are gentle nudges, not alarms.
        </Text>
        <FieldLabel>Check-in time</FieldLabel>
        <Input
          accessibilityLabel="Integrity check-in time"
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          onChangeText={setCheckInTime}
          placeholder="21:00"
          value={checkInTime}
        />
        {!validCheckInTime ? (
          <Text style={{ color: colors.danger }}>Use 24-hour time, for example 21:00.</Text>
        ) : null}
        <Button
          disabled={!validCheckInTime || checkInTime === settings.integrityCheckInTime}
          label="Save check-in time"
          onPress={() => {
            updateSettings({ integrityCheckInTime: checkInTime });
            setReminderMessage(
              settings.checkInReminderEnabled
                ? `Reminder will reschedule for ${checkInTime}.`
                : 'Check-in time saved.',
            );
          }}
        />
        <Text variant="title">{reminderStatus.title}</Text>
        <Text muted>{reminderStatus.message}</Text>
        <Button
          disabled={reminderButtonDisabled}
          label={
            settings.checkInReminderEnabled
              ? 'Disable daily reminder'
              : reminderStatus.actionLabel
          }
          tone={settings.checkInReminderEnabled ? 'primary' : 'secondary'}
          onPress={() => {
            void toggleReminder();
          }}
        />
        {reminderMessage ? <Text muted>{reminderMessage}</Text> : null}
      </Card>

      <Card>
        <Text variant="title">Feedback</Text>
        <Text muted>Use these if sound, haptics, or wheel motion get in the way.</Text>
        <Button
          label={settings.soundEnabled ? 'Sound on' : 'Sound off'}
          onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          tone={settings.soundEnabled ? 'primary' : 'secondary'}
        />
        <Button
          label={settings.hapticsEnabled ? 'Haptics on' : 'Haptics off'}
          onPress={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
          tone={settings.hapticsEnabled ? 'primary' : 'secondary'}
        />
        <Button
          label={settings.reducedMotion ? 'Reduced motion on' : 'Reduced motion off'}
          onPress={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
          tone={settings.reducedMotion ? 'primary' : 'secondary'}
        />
      </Card>

      <Card>
        <Text variant="title">Data status</Text>
        <Text
          style={{
            color: persistenceStatus.durable ? colors.success : colors.warning,
          }}
        >
          Storage: {persistenceStatus.backend}
        </Text>
        <Text muted>{persistenceStatus.message}</Text>
        <Text muted>
          Local data: {habits.length} habits, {jars.length} jars, {rewards.length} rewards,{' '}
          {tokens.length} tokens
        </Text>
        <Text muted>
          Activity: {completions.length} reps, {rewardGrants.length} reward grants,{' '}
          {integrityCheckIns.length} check-ins
        </Text>
        <Text muted>
          Last export: {lastExportedAt ? formatLocalDateTime(lastExportedAt) : 'Not this session'}
        </Text>
        <Text muted>Version: {Constants.expoConfig?.version ?? '0.1.0'}</Text>
        <Text muted>Local DB version: {APP_STORE_PERSIST_VERSION}</Text>
        <Text muted>EAS project: {projectIdText}</Text>
        <Text muted>Storage key: {APP_STORE_STORAGE_KEY}</Text>
      </Card>

      <Card>
        <Text variant="title">Export local data</Text>
        <Text muted>Creates a JSON snapshot of this device's local DopamineHabit state.</Text>
        <Button
          label="Generate export JSON"
          onPress={() => {
            setExportJson(exportLocalData());
            setLastExportedAt(new Date().toISOString());
          }}
        />
        {exportJson ? (
          <Input
            accessibilityLabel="Exported local data JSON"
            multiline
            style={{ minHeight: 132, textAlignVertical: 'top' }}
            value={exportJson}
          />
        ) : null}
      </Card>

      <Card>
        <Text variant="title">Import local data</Text>
        <Text muted>
          Paste an exported JSON snapshot. Preview it first, then confirm before replacing this
          device.
        </Text>
        <Input
          accessibilityLabel="Import local data JSON"
          multiline
          onChangeText={(value) => {
            setImportJson(value);
            setImportPreview(undefined);
            setImportMessage(undefined);
          }}
          placeholder="Paste exported JSON"
          style={{ minHeight: 132, textAlignVertical: 'top' }}
          value={importJson}
        />
        <Button
          disabled={importJson.trim().length === 0}
          label="Preview import"
          onPress={() => {
            setImportPreview(previewImportLocalData(importJson));
            setImportMessage(undefined);
          }}
        />
        {importPreview?.summary ? (
          <View style={{ gap: spacing.xs }}>
            <Text>{importPreview.message}</Text>
            <Text muted>
              Exported:{' '}
              {importPreview.summary.exportedAt
                ? formatLocalDateTime(importPreview.summary.exportedAt)
                : 'Unknown'}
            </Text>
            <Text muted>
              Version {importPreview.summary.version}; {importPreview.summary.habits} habits,{' '}
              {importPreview.summary.jars} jars, {importPreview.summary.rewards} rewards,{' '}
              {importPreview.summary.tokens} tokens
            </Text>
            <Text muted>
              {importPreview.summary.completions} reps, {importPreview.summary.rewardGrants}{' '}
              reward grants, {importPreview.summary.integrityCheckIns} check-ins
            </Text>
            <Text muted>
              Active reward session:{' '}
              {importPreview.summary.hasActiveRewardSession ? 'yes' : 'no'}
            </Text>
            <Button
              label="Confirm replace local data"
              tone="secondary"
              onPress={() => {
                const result = importLocalData(importJson);
                setImportMessage(result.message);
                if (result.status === 'imported') {
                  setImportPreview(undefined);
                }
              }}
            />
          </View>
        ) : null}
        {importPreview && importPreview.status === 'failed' ? (
          <Text style={{ color: colors.danger }}>{importPreview.message}</Text>
        ) : null}
        {importMessage ? <Text muted>{importMessage}</Text> : null}
      </Card>

      <Card>
        <Text variant="title">Reset local data</Text>
        <Text muted>
          This clears the local app state on this device and returns the app to onboarding.
        </Text>
        <Button
          label={resetArmed ? 'Confirm reset local data' : 'Prepare reset local data'}
          tone="secondary"
          onPress={() => {
            if (!resetArmed) {
              setResetArmed(true);
              return;
            }

            resetLocalData();
          }}
        />
        {resetArmed ? <Text style={{ color: colors.warning }}>Press again to confirm reset.</Text> : null}
      </Card>
    </Screen>
  );
}
