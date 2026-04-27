import Constants from 'expo-constants';
import { Redirect } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { APP_STORE_STORAGE_KEY } from '@/store/persistence';
import { APP_STORE_PERSIST_VERSION, useAppStore } from '@/store';
import { colors } from '@/theme/colors';

const isValidLocalTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const exportLocalData = useAppStore((state) => state.exportLocalData);
  const importLocalData = useAppStore((state) => state.importLocalData);
  const resetLocalData = useAppStore((state) => state.resetLocalData);
  const [checkInTime, setCheckInTime] = useState(settings.integrityCheckInTime);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importMessage, setImportMessage] = useState<string | undefined>(undefined);
  const [resetArmed, setResetArmed] = useState(false);
  const validCheckInTime = isValidLocalTime(checkInTime);
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const projectIdText = typeof projectId === 'string' ? projectId : 'Not linked';

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
          The app records one answer per local day. Reminder scheduling is planned next.
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
          onPress={() => updateSettings({ integrityCheckInTime: checkInTime })}
        />
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
        <Text variant="title">Build and local data</Text>
        <Text muted>Version: {Constants.expoConfig?.version ?? '0.1.0'}</Text>
        <Text muted>Local DB version: {APP_STORE_PERSIST_VERSION}</Text>
        <Text muted>EAS project: {projectIdText}</Text>
        <Text muted>Storage key: {APP_STORE_STORAGE_KEY}</Text>
      </Card>

      <Card>
        <Text variant="title">Export local data</Text>
        <Text muted>Creates a JSON snapshot of this device’s local DopamineHabit state.</Text>
        <Button label="Generate export JSON" onPress={() => setExportJson(exportLocalData())} />
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
          Paste an exported JSON snapshot. Import replaces the current local state on this
          device.
        </Text>
        <Input
          accessibilityLabel="Import local data JSON"
          multiline
          onChangeText={setImportJson}
          placeholder="Paste exported JSON"
          style={{ minHeight: 132, textAlignVertical: 'top' }}
          value={importJson}
        />
        <Button
          disabled={importJson.trim().length === 0}
          label="Import pasted JSON"
          onPress={() => {
            const result = importLocalData(importJson);
            setImportMessage(result.message);
          }}
        />
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
