import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import type { CreateHabitInput, CreateJarInput, CreateRewardInput } from '@/store';
import type { Habit, Jar, Reward } from '@/store/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const defaultJarColor = '#46D56E';
const jarColors = [defaultJarColor, '#3D9BFF', '#FF9933', '#FF4D5E', '#B866FF'];
const rewardTiers: Reward['tier'][] = [1, 2, 3, 'jackpot'];

export interface JarFormProps {
  initialJar?: Jar;
  submitLabel: string;
  onSubmit: (input: CreateJarInput) => void;
}

export function JarForm({ initialJar, submitLabel, onSubmit }: JarFormProps) {
  const [name, setName] = useState(initialJar?.name ?? '');
  const [colorHex, setColorHex] = useState(initialJar?.colorHex ?? defaultJarColor);
  const [funMoneyPerTokenCents, setFunMoneyPerTokenCents] = useState(
    `${initialJar?.funMoneyPerTokenCents ?? 50}`,
  );
  const amount = Number(funMoneyPerTokenCents);
  const canSubmit = name.trim().length > 0 && Number.isFinite(amount) && amount >= 0;

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel>Jar name</FieldLabel>
      <Input value={name} onChangeText={setName} placeholder="Fitness" />
      <FieldLabel>Color</FieldLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {jarColors.map((candidateColor) => (
          <Button
            key={candidateColor}
            accessibilityLabel={`Use jar color ${candidateColor}`}
            onPress={() => setColorHex(candidateColor)}
            style={{
              backgroundColor: candidateColor,
              borderColor: colorHex === candidateColor ? colors.textPrimary : candidateColor,
              borderRadius: radius.pill,
              height: 40,
              width: 40,
            }}
          />
        ))}
      </View>
      <FieldLabel>Fun money per token, cents</FieldLabel>
      <Input
        keyboardType="number-pad"
        value={funMoneyPerTokenCents}
        onChangeText={setFunMoneyPerTokenCents}
        placeholder="50"
      />
      <Button
        disabled={!canSubmit}
        label={submitLabel}
        onPress={() =>
          onSubmit({
            ...(initialJar ? { id: initialJar.id } : {}),
            name,
            colorHex,
            funMoneyEnabled: amount > 0,
            funMoneyPerTokenCents: amount,
          })
        }
      />
    </View>
  );
}

export interface HabitFormProps {
  activeJars: Jar[];
  initialHabit?: Habit;
  submitLabel: string;
  onSubmit: (input: CreateHabitInput) => void;
}

export function HabitForm({ activeJars, initialHabit, submitLabel, onSubmit }: HabitFormProps) {
  const firstJarId = activeJars[0]?.id;
  const [name, setName] = useState(initialHabit?.name ?? '');
  const [cue, setCue] = useState(initialHabit?.cue ?? '');
  const [jarId, setJarId] = useState(initialHabit?.jarId ?? firstJarId);
  const canSubmit = name.trim().length > 0 && Boolean(jarId);

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel>Habit name</FieldLabel>
      <Input value={name} onChangeText={setName} placeholder="10 pushups" />
      <FieldLabel>Cue</FieldLabel>
      <Input value={cue} onChangeText={setCue} placeholder="Walking to the kitchen" />
      <FieldLabel>Jar</FieldLabel>
      {activeJars.length === 0 ? <Text muted>Create an active jar first.</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {activeJars.map((jar) => (
          <Button
            key={jar.id}
            label={jar.name}
            tone={jar.id === jarId ? 'primary' : 'secondary'}
            onPress={() => setJarId(jar.id)}
          />
        ))}
      </View>
      <Button
        disabled={!canSubmit || !jarId}
        label={submitLabel}
        onPress={() => {
          if (!jarId) {
            return;
          }

          onSubmit({
            ...(initialHabit ? { id: initialHabit.id } : {}),
            name,
            cue,
            jarId,
          });
        }}
      />
    </View>
  );
}

export interface RewardFormProps {
  initialReward?: Reward;
  submitLabel: string;
  onSubmit: (input: CreateRewardInput) => void;
}

export function RewardForm({ initialReward, submitLabel, onSubmit }: RewardFormProps) {
  const [name, setName] = useState(initialReward?.name ?? '');
  const [tier, setTier] = useState<Reward['tier']>(initialReward?.tier ?? 1);
  const [durationMinutes, setDurationMinutes] = useState(
    `${initialReward?.durationMinutes ?? 3}`,
  );
  const [description, setDescription] = useState(initialReward?.description ?? '');
  const duration = Number(durationMinutes);
  const canSubmit = name.trim().length > 0 && Number.isFinite(duration) && duration > 0;

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel>Reward name</FieldLabel>
      <Input value={name} onChangeText={setName} placeholder="Favorite phone game" />
      <FieldLabel>Tier</FieldLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {rewardTiers.map((candidateTier) => (
          <Button
            key={candidateTier}
            label={candidateTier === 'jackpot' ? 'Jackpot' : `Tier ${candidateTier}`}
            tone={candidateTier === tier ? 'primary' : 'secondary'}
            onPress={() => setTier(candidateTier)}
          />
        ))}
      </View>
      <FieldLabel>Duration, minutes</FieldLabel>
      <Input
        keyboardType="number-pad"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        placeholder="3"
      />
      <FieldLabel>Description</FieldLabel>
      <Input value={description} onChangeText={setDescription} placeholder="Optional" />
      <Button
        disabled={!canSubmit}
        label={submitLabel}
        onPress={() =>
          onSubmit({
            ...(initialReward ? { id: initialReward.id } : {}),
            name,
            tier,
            durationMinutes: duration,
            description,
          })
        }
      />
    </View>
  );
}
