export type WheelSliceKind = 'tier1' | 'tier2' | 'tier3' | 'jackpot' | 'bonus';

export interface WheelSlice {
  id: string;
  kind: WheelSliceKind;
  startAngle: number;
  endAngle: number;
  centerAngle: number;
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
    centerAngle: (index + 0.5) * sliceSize,
  }));
};

export const wheelSliceColor = (kind: WheelSliceKind): string => {
  if (kind === 'tier1') return '#FFB84D';
  if (kind === 'tier2') return '#3DDC97';
  if (kind === 'tier3') return '#6BE3FF';
  if (kind === 'jackpot') return '#FF3B6B';
  return '#B866FF';
};

export const wheelSliceLabel = (kind: WheelSliceKind): string => {
  if (kind === 'tier1') return 'T1';
  if (kind === 'tier2') return 'T2';
  if (kind === 'tier3') return 'T3';
  if (kind === 'jackpot') return 'JP';
  return 'BON';
};

export const findSliceCenterAngle = (kind: WheelSliceKind): number => {
  const slice = buildWheelSlices().find((candidate) => candidate.kind === kind);

  return slice?.centerAngle ?? 15;
};

export const targetRotationForSlice = (kind: WheelSliceKind, baseRotations = 4): number =>
  baseRotations * 360 - findSliceCenterAngle(kind);
