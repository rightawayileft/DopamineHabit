import { useState } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  targetRotationForSlice,
  type WheelSliceKind,
} from '@/components/Wheel/wheelGeometry';

export interface SpinAnimationState {
  rotationDegrees: SharedValue<number>;
  animatedWheelStyle: ReturnType<typeof useAnimatedStyle>;
  isAnimating: boolean;
  startSpin: (input: StartSpinAnimationInput) => void;
  reset: () => void;
}

export interface StartSpinAnimationInput {
  rawLandedSlice: WheelSliceKind;
  wasNearMiss: boolean;
  onComplete: () => void;
}

export function useSpinAnimation(): SpinAnimationState {
  const rotationDegrees = useSharedValue(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatedWheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDegrees.value}deg` }],
  }));

  const startSpin = ({ rawLandedSlice, wasNearMiss, onComplete }: StartSpinAnimationInput) => {
    const targetRotation = targetRotationForSlice(rawLandedSlice);
    setIsAnimating(true);

    const finish = () => {
      setIsAnimating(false);
      onComplete();
    };

    if (wasNearMiss) {
      rotationDegrees.value = withSequence(
        withTiming(targetRotation + 15, {
          duration: 4200,
          easing: Easing.bezier(0.17, 0.67, 0.13, 1.02),
        }),
        withTiming(targetRotation, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        }, () => {
          runOnJS(finish)();
        }),
      );
      return;
    }

    rotationDegrees.value = withTiming(
      targetRotation,
      {
        duration: 4200,
        easing: Easing.bezier(0.17, 0.67, 0.13, 1.02),
      },
      () => {
        runOnJS(finish)();
      },
    );
  };

  return {
    rotationDegrees,
    animatedWheelStyle,
    isAnimating,
    startSpin,
    reset: () => {
      rotationDegrees.value = 0;
    },
  };
}
