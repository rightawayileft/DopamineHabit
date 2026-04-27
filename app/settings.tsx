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
import { useAppStore } from '@/store';
import { colors } from '@/theme/colors';

const isValidLocalTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [checkInTime, setCheckInTime] = useState(settings.integrityCheckInTime);
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
        <Text muted>EAS project: {projectIdText}</Text>
        <Text muted>Storage key: {APP_STORE_STORAGE_KEY}</Text>
        <Text muted>
          Reset, export, import, and migration tools are planned for the local DB durability
          checkpoint.
        </Text>
      </Card>
    </Screen>
  );
}
