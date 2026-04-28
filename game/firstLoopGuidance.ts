import type { Reward } from '@/store/types';

export interface QuickHabitTemplate {
  id: string;
  name: string;
  cue: string;
}

export interface QuickRewardTemplate {
  id: string;
  name: string;
  tier: Reward['tier'];
  durationMinutes: number;
  description: string;
}

export interface StarterLoopBundle {
  id: string;
  label: string;
  summary: string;
  jarName: string;
  jarColorHex: string;
  habitName: string;
  habitCue: string;
  rewardName: string;
  rewardDurationMinutes: number;
  rewardDescription: string;
}

export interface GatePreviewInput {
  habitCue: string;
  habitName: string;
  rewardName: string;
  rewardDurationMinutes: string | number;
}

export type FirstSpinChecklistStatus = 'complete' | 'available' | 'blocked' | 'locked';

export interface FirstSpinChecklistItem {
  id: 'rep' | 'cash-in' | 'reward' | 'spin';
  label: string;
  detail: string;
  status: FirstSpinChecklistStatus;
}

export interface FirstSpinChecklistInput {
  hasRepReady: boolean;
  hasPendingSpin: boolean;
  hasActiveReward: boolean;
  isCashInValid: boolean;
  selectedTokenCount: number;
  inventoryTokenCount: number;
  activatedMaxTier: 1 | 2 | 3;
  cashInReason?: string;
}

export interface FirstSpinChecklist {
  title: string;
  summary: string;
  canStartSpin: boolean;
  items: FirstSpinChecklistItem[];
}

export const quickHabitTemplates: readonly QuickHabitTemplate[] = [
  {
    id: 'water',
    name: 'Drink water',
    cue: 'After opening the app',
  },
  {
    id: 'walk',
    name: 'Two-minute walk',
    cue: 'When I want the reward',
  },
  {
    id: 'tidy',
    name: 'Clear one surface',
    cue: 'Before sitting down',
  },
  {
    id: 'breathing',
    name: 'Five slow breaths',
    cue: 'When the urge spikes',
  },
];

export const quickRewardTemplates: readonly QuickRewardTemplate[] = [
  {
    id: 'short-video',
    name: 'Short video break',
    tier: 1,
    durationMinutes: 3,
    description: 'A small, contained reward session.',
  },
  {
    id: 'favorite-game',
    name: 'Favorite game',
    tier: 2,
    durationMinutes: 7,
    description: 'A better reward for matched-token cash-ins.',
  },
  {
    id: 'long-scroll',
    name: 'Long scroll pass',
    tier: 3,
    durationMinutes: 12,
    description: 'A high-tier session for stronger cash-ins.',
  },
  {
    id: 'jackpot-choice',
    name: 'Jackpot choice',
    tier: 'jackpot',
    durationMinutes: 20,
    description: 'A rare top reward for the biggest outcome.',
  },
];

export const starterLoopBundles: readonly StarterLoopBundle[] = [
  {
    id: 'focus-scroll',
    label: 'Focus + scroll',
    summary: 'Pause the phone pull with one tiny reset.',
    jarName: 'Focus',
    jarColorHex: '#6BE3FF',
    habitName: 'Five slow breaths',
    habitCue: 'When I reach for my phone',
    rewardName: 'Short scroll break',
    rewardDurationMinutes: 3,
    rewardDescription: 'A short, bounded scroll session after a real pause.',
  },
  {
    id: 'fitness-phone',
    label: 'Fitness + phone',
    summary: 'Trade a quick body rep for a timed phone reward.',
    jarName: 'Fitness',
    jarColorHex: '#46D56E',
    habitName: 'Drink water',
    habitCue: 'Before opening a reward app',
    rewardName: 'Favorite phone game',
    rewardDurationMinutes: 3,
    rewardDescription: 'A quick game session that starts only after the rep.',
  },
  {
    id: 'chores-video',
    label: 'Chores + video',
    summary: 'Make the first minute of cleanup unlock a video break.',
    jarName: 'Home',
    jarColorHex: '#FF9933',
    habitName: 'Clear one surface',
    habitCue: 'Before sitting down to watch',
    rewardName: 'Short video break',
    rewardDurationMinutes: 5,
    rewardDescription: 'One contained video break after a visible reset.',
  },
  {
    id: 'study-game',
    label: 'Study + game',
    summary: 'Start with one study action before a game window.',
    jarName: 'Study',
    jarColorHex: '#B866FF',
    habitName: 'Open notes for two minutes',
    habitCue: 'When I want to play',
    rewardName: 'Favorite game',
    rewardDurationMinutes: 7,
    rewardDescription: 'A stronger reward window after starting the study loop.',
  },
];

export const buildGatePreviewText = ({
  habitCue,
  habitName,
  rewardDurationMinutes,
  rewardName,
}: GatePreviewInput): string =>
  `When ${habitCue.trim() || 'the pull starts'}, I will do ${
    habitName.trim() || 'one tiny rep'
  } to unlock ${String(rewardDurationMinutes).trim() || '3'} minutes of ${
    rewardName.trim() || 'my reward'
  }.`;

const tierLabel = (tier: 1 | 2 | 3): string => `Tier ${tier}`;

const cashInDetail = ({
  activatedMaxTier,
  inventoryTokenCount,
  selectedTokenCount,
}: Pick<
  FirstSpinChecklistInput,
  'activatedMaxTier' | 'inventoryTokenCount' | 'selectedTokenCount'
>): string => {
  if (selectedTokenCount > 0) {
    return `${selectedTokenCount} selected token${selectedTokenCount === 1 ? '' : 's'} activates ${tierLabel(
      activatedMaxTier,
    )}.`;
  }

  if (inventoryTokenCount === 0) {
    return 'No saved tokens yet, so this will be a simple Tier 1 spin.';
  }

  return 'No cash-in selected. You can spin at Tier 1 or save matching tokens for later.';
};

export const buildFirstSpinChecklist = (
  input: FirstSpinChecklistInput,
): FirstSpinChecklist => {
  const repReady = input.hasRepReady || input.hasPendingSpin;
  const canStartSpin =
    input.hasRepReady &&
    !input.hasPendingSpin &&
    !input.hasActiveReward &&
    input.isCashInValid;
  const summary = input.hasPendingSpin
    ? 'An interrupted spin is saved and ready to finish.'
    : !input.hasRepReady
      ? 'Complete a habit rep to unlock spin setup.'
      : input.hasActiveReward
        ? 'Finish or end the active reward before starting another spin.'
        : !input.isCashInValid
          ? input.cashInReason ?? 'Adjust the selected tokens before spinning.'
          : input.selectedTokenCount === 0
            ? 'Ready for a Tier 1 spin with no cash-in.'
            : `Ready for a ${tierLabel(input.activatedMaxTier)} spin.`;

  return {
    title: 'First-spin checklist',
    summary,
    canStartSpin,
    items: [
      {
        id: 'rep',
        label: 'Habit rep',
        detail: repReady
          ? 'A fresh completion is available for the wheel.'
          : 'Complete one habit rep on Home first.',
        status: repReady ? 'complete' : 'available',
      },
      {
        id: 'cash-in',
        label: 'Cash-in',
        detail: repReady
          ? input.isCashInValid
            ? cashInDetail(input)
            : input.cashInReason ?? 'This token selection is not valid.'
          : 'Token choices unlock after a rep is ready.',
        status: !repReady ? 'locked' : input.isCashInValid ? 'complete' : 'blocked',
      },
      {
        id: 'reward',
        label: 'Reward slot',
        detail: repReady
          ? input.hasActiveReward
            ? 'A reward is already active.'
            : 'No active reward is blocking this spin.'
          : 'Reward checks unlock after a rep is ready.',
        status: !repReady ? 'locked' : input.hasActiveReward ? 'blocked' : 'complete',
      },
      {
        id: 'spin',
        label: 'Wheel',
        detail: input.hasPendingSpin
          ? 'Finish the saved wheel result.'
          : canStartSpin
            ? 'The wheel is ready.'
            : repReady
              ? 'Resolve the blocking item above.'
              : 'The wheel unlocks after the first rep.',
        status: input.hasPendingSpin
          ? 'available'
          : canStartSpin
            ? 'available'
            : repReady
              ? 'blocked'
              : 'locked',
      },
    ],
  };
};
