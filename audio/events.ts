export const soundEvents = {
  habitDone: 'soft-confirm-click',
  tokenDrawn: 'single-metallic-clink',
  tokenDroppedIntoJar: 'glass-clink',
  cashInTwo: 'two-ascending-clinks',
  cashInThree: 'three-ascending-clinks',
  spinStart: 'mechanical-whirr-loop',
  spinTick: 'soft-tick',
  spinSettle: 'wooden-thunk',
  nearMiss: 'descending-womp',
  tierTwoReward: 'ascending-chime',
  tierThreeReward: 'triumphant-sting',
  jackpot: 'casino-fanfare',
  bonusRoundLanding: 'sparkling-synth-riser',
  goldenTokenDrop: 'magical-chime',
  timerWarning: 'alarm-chirp',
} as const;

export type SoundEventName = keyof typeof soundEvents;
