import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export interface SpinAnimationState {
  rotationDegrees: SharedValue<number>;
  reset: () => void;
}

export function useSpinAnimation(): SpinAnimationState {
  const rotationDegrees = useSharedValue(0);

  return {
    rotationDegrees,
    reset: () => {
      rotationDegrees.value = 0;
    },
  };
}
