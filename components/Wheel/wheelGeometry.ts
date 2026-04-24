export type WheelSliceKind = 'tier1' | 'tier2' | 'tier3' | 'jackpot' | 'bonus';

export interface WheelSlice {
  id: string;
  kind: WheelSliceKind;
  startAngle: number;
  endAngle: number;
}

export const WHEEL_SLICE_KINDS: WheelSliceKind[] = [
  'tier1',
  'tier2',
  'tier1',
  'tier3',
  'tier2',
  'tier1',
  'jackpot',
  'tier1',
  'tier3',
  'tier2',
  'bonus',
  'tier1',
];

export const buildWheelSlices = (): WheelSlice[] => {
  const sliceSize = 360 / WHEEL_SLICE_KINDS.length;

  return WHEEL_SLICE_KINDS.map((kind, index) => ({
    id: `${kind}-${index}`,
    kind,
    startAngle: index * sliceSize,
    endAngle: (index + 1) * sliceSize,
  }));
};
