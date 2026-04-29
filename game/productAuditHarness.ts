import type {
  ActiveRewardSession,
  Habit,
  HabitCompletion,
  IntegrityCheckIn,
  Jar,
  Reward,
  RewardGrant,
  SpinResult,
  Token,
  UserSettings,
} from '@/store/types';

export type ProductAuditPersonaId =
  | 'first-time-user'
  | 'returning-user'
  | 'power-user'
  | 'behavior-change-coach'
  | 'accessibility-constrained'
  | 'competitive-gap';

export type ProductAuditSeedId =
  | 'clean-first-run'
  | 'first-loop-ready'
  | 'returning-with-tokens'
  | 'power-user-mature'
  | 'stale-local-state'
  | 'accessibility-reduced-motion'
  | 'recovery-active-reward';

export interface ProductAuditAgent {
  id: ProductAuditPersonaId;
  name: string;
  usageStyle: string;
  simulatedUsageLength: string;
  primaryQuestion: string;
  seedId: ProductAuditSeedId;
}

export interface ProductAuditSeedState {
  settings: Partial<UserSettings>;
  jars: Jar[];
  habits: Habit[];
  rewards: Reward[];
  completions: HabitCompletion[];
  tokens: Token[];
  spinResults: SpinResult[];
  rewardGrants: RewardGrant[];
  activeRewardSession?: ActiveRewardSession;
  integrityCheckIns: IntegrityCheckIn[];
}

export interface ProductAuditSeed {
  id: ProductAuditSeedId;
  title: string;
  journey: string;
  routeStart: string;
  state: ProductAuditSeedState;
}

export interface RouteSmokeCheck {
  route: string;
  filePath: string;
  userGoal: string;
  mustExpose: string[];
}

export const productAuditAgents: readonly ProductAuditAgent[] = [
  {
    id: 'first-time-user',
    name: 'Impatient First-Timer',
    usageStyle: 'Fast taps, low patience, wants the first reward loop to make sense quickly.',
    simulatedUsageLength: '5 minutes',
    primaryQuestion: 'Where do I get confused before my first reward?',
    seedId: 'clean-first-run',
  },
  {
    id: 'returning-user',
    name: 'Casual Returner',
    usageStyle: 'Comes back with one setup and expects add-more actions to be obvious.',
    simulatedUsageLength: '3 sessions over one week',
    primaryQuestion: 'Where do I think a feature is missing even if it exists?',
    seedId: 'returning-with-tokens',
  },
  {
    id: 'power-user',
    name: 'Optimizer',
    usageStyle: 'Manages multiple jars, rewards, milestones, and history.',
    simulatedUsageLength: '30 days',
    primaryQuestion: 'Which repeated workflows feel slow, hidden, or underpowered?',
    seedId: 'power-user-mature',
  },
  {
    id: 'behavior-change-coach',
    name: 'No-Shame Coach',
    usageStyle: 'Looks for relapse recovery, tone, and motivational clarity.',
    simulatedUsageLength: '2 weeks with one missed day',
    primaryQuestion: 'Where does the product accidentally shame or over-optimize?',
    seedId: 'recovery-active-reward',
  },
  {
    id: 'accessibility-constrained',
    name: 'Constrained Mobile User',
    usageStyle: 'Reduced motion, low vision, slower taps, small-screen scanning.',
    simulatedUsageLength: '10 minutes on mobile web',
    primaryQuestion: 'What cannot be understood without perfect sight, motion, or precision?',
    seedId: 'accessibility-reduced-motion',
  },
  {
    id: 'competitive-gap',
    name: 'Product Strategist',
    usageStyle: 'Compares expected habit-tracker and reward-tool conventions.',
    simulatedUsageLength: 'One evaluation pass',
    primaryQuestion: 'Which expected trust signals or differentiators are still missing?',
    seedId: 'stale-local-state',
  },
];

const baseSettings: Partial<UserSettings> = {
  nakedRuleAcceptedAt: '2026-04-27T12:00:00Z',
  integrityCheckInTime: '21:00',
  checkInReminderEnabled: true,
  hapticsEnabled: true,
  soundEnabled: true,
  reducedMotion: false,
  rateLimitSecondsPerHabit: {},
};

const fitnessJar: Jar = {
  id: 'jar-fitness',
  name: 'Fitness',
  colorHex: '#46D56E',
  milestones: [
    {
      id: 'milestone-first-token',
      tokenThreshold: 1,
      label: 'First token',
      unlockedAt: '2026-04-27T12:05:00Z',
    },
  ],
  funMoneyEnabled: true,
  funMoneyPerTokenCents: 50,
  funMoneyBalanceCents: 150,
  createdAt: '2026-04-27T12:00:00Z',
};

const pushupsHabit: Habit = {
  id: 'habit-pushups',
  name: '10 pushups',
  cue: 'Walking to the kitchen',
  jarId: fitnessJar.id,
  createdAt: '2026-04-27T12:01:00Z',
};

const phoneReward: Reward = {
  id: 'reward-phone-game',
  name: 'Favorite phone game',
  tier: 1,
  durationMinutes: 3,
  description: 'A tiny reward session.',
};

const firstCompletion: HabitCompletion = {
  id: 'completion-first',
  habitId: pushupsHabit.id,
  completedAt: '2026-04-27T12:05:00Z',
  tokenDrawnId: 'token-blue',
  wasBonusRep: false,
};

const blueToken: Token = {
  id: 'token-blue',
  color: 'blue',
  earnedAt: '2026-04-27T12:05:00Z',
  sourceCompletionId: firstCompletion.id,
  state: 'in_inventory',
  jarId: fitnessJar.id,
};

const firstLoopReadyState: ProductAuditSeedState = {
  settings: baseSettings,
  jars: [fitnessJar],
  habits: [pushupsHabit],
  rewards: [phoneReward],
  completions: [],
  tokens: [],
  spinResults: [],
  rewardGrants: [],
  integrityCheckIns: [],
};

export const productAuditSeeds: readonly ProductAuditSeed[] = [
  {
    id: 'clean-first-run',
    title: 'Clean first run',
    journey: 'Fresh user has not accepted the Naked Rule.',
    routeStart: '/onboarding/step1',
    state: {
      settings: {
        ...baseSettings,
        nakedRuleAcceptedAt: '',
        checkInReminderEnabled: false,
      },
      jars: [],
      habits: [],
      rewards: [],
      completions: [],
      tokens: [],
      spinResults: [],
      rewardGrants: [],
      integrityCheckIns: [],
    },
  },
  {
    id: 'first-loop-ready',
    title: 'First loop ready',
    journey: 'Onboarding is complete and the user can start the first rep or add variety.',
    routeStart: '/onboarding/next',
    state: firstLoopReadyState,
  },
  {
    id: 'returning-with-tokens',
    title: 'Returning with tokens',
    journey: 'One habit has been completed and the user should understand spin setup.',
    routeStart: '/spin',
    state: {
      ...firstLoopReadyState,
      completions: [firstCompletion],
      tokens: [blueToken],
    },
  },
  {
    id: 'power-user-mature',
    title: 'Power user mature state',
    journey: 'Multiple rewards, tokens, milestones, and stats should remain scannable.',
    routeStart: '/stats',
    state: {
      ...firstLoopReadyState,
      rewards: [
        phoneReward,
        {
          id: 'reward-chess',
          name: 'Chess puzzle',
          tier: 2,
          durationMinutes: 10,
        },
        {
          id: 'reward-long-break',
          name: 'Long break',
          tier: 3,
          durationMinutes: 15,
        },
      ],
      completions: [firstCompletion],
      tokens: [
        blueToken,
        {
          id: 'token-green',
          color: 'green',
          earnedAt: '2026-04-28T12:05:00Z',
          sourceCompletionId: firstCompletion.id,
          state: 'cashed_in',
          jarId: fitnessJar.id,
        },
      ],
      spinResults: [
        {
          id: 'spin-first',
          spunAt: '2026-04-28T12:07:00Z',
          habitCompletionId: firstCompletion.id,
          cashedInTokenIds: ['token-green'],
          activatedMaxTier: 3,
          rawLandedSlice: 'tier1',
          awardedTier: 1,
          awardedRewardId: phoneReward.id,
          wasNearMiss: false,
          seed: 'audit-seed',
        },
      ],
      rewardGrants: [
        {
          id: 'grant-first',
          rewardId: phoneReward.id,
          grantedAt: '2026-04-28T12:07:00Z',
          source: 'spin',
          spinResultId: 'spin-first',
          durationMinutes: 3,
          endedAt: '2026-04-28T12:10:00Z',
        },
      ],
      integrityCheckIns: [
        {
          id: 'checkin-1',
          date: '2026-04-27',
          answer: 'yes',
          answeredAt: '2026-04-27T21:00:00Z',
        },
      ],
    },
  },
  {
    id: 'stale-local-state',
    title: 'Stale local state',
    journey: 'Old local data should be explainable and recoverable from Settings.',
    routeStart: '/settings',
    state: {
      ...firstLoopReadyState,
      settings: {
        nakedRuleAcceptedAt: '2026-04-20T12:00:00Z',
      },
    },
  },
  {
    id: 'accessibility-reduced-motion',
    title: 'Reduced motion constrained use',
    journey: 'Reduced-motion user should understand controls without animation or sound.',
    routeStart: '/spin',
    state: {
      ...firstLoopReadyState,
      settings: {
        ...baseSettings,
        reducedMotion: true,
        hapticsEnabled: false,
        soundEnabled: false,
      },
      completions: [firstCompletion],
      tokens: [blueToken],
    },
  },
  {
    id: 'recovery-active-reward',
    title: 'Recovery active reward',
    journey: 'User has an active reward and a missed check-in recovery moment.',
    routeStart: '/reward/reward-phone-game',
    state: {
      ...firstLoopReadyState,
      rewardGrants: [
        {
          id: 'grant-active',
          rewardId: phoneReward.id,
          grantedAt: '2026-04-28T12:07:00Z',
          source: 'spin',
          spinResultId: 'spin-first',
          durationMinutes: 3,
        },
      ],
      activeRewardSession: {
        rewardGrantId: 'grant-active',
        expiresAt: '2026-04-28T12:10:00Z',
      },
      integrityCheckIns: [
        {
          id: 'checkin-miss',
          date: '2026-04-26',
          answer: 'partially',
          answeredAt: '2026-04-26T21:00:00Z',
        },
      ],
    },
  },
];

export const coreRouteSmokeChecks: readonly RouteSmokeCheck[] = [
  {
    route: '/',
    filePath: 'app/index.tsx',
    userGoal: 'Log a rep, see inventory, and reach the next loop action.',
    mustExpose: ['DopamineHabit', 'Today', 'Inventory'],
  },
  {
    route: '/spin',
    filePath: 'app/spin.tsx',
    userGoal: 'Understand spin readiness, cash in tokens, and recover interrupted spins.',
    mustExpose: ['Spin', 'First-spin checklist', 'Spin not ready'],
  },
  {
    route: '/rewards',
    filePath: 'app/rewards.tsx',
    userGoal: 'Create rewards, inspect active sessions, and review grant history.',
    mustExpose: ['Rewards', 'Quick reward templates', 'Grant history'],
  },
  {
    route: '/checkin',
    filePath: 'app/checkin.tsx',
    userGoal: 'Answer the daily integrity check-in without shame-heavy copy.',
    mustExpose: ['Repair check-in', 'Today', 'Repair signal'],
  },
  {
    route: '/settings',
    filePath: 'app/settings.tsx',
    userGoal: 'Control reminders, feedback, build visibility, and local data recovery.',
    mustExpose: ['Settings', 'Daily integrity check-in', 'Build and local data'],
  },
  {
    route: '/stats',
    filePath: 'app/stats.tsx',
    userGoal: 'Review filtered progress and choose the next coached action.',
    mustExpose: ['Stats', 'Focus', 'Coaching'],
  },
];

export const backlogSynthesisFields = [
  'ID',
  'Title',
  'Persona',
  'Journey',
  'Evidence',
  'User impact',
  'Severity',
  'Effort',
  'Opportunity',
  'Acceptance criteria',
  'Dependencies',
] as const;
