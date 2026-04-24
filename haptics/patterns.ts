import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticPattern =
  | 'habitDone'
  | 'tokenDrawn'
  | 'tokenDroppedIntoJar'
  | 'cashInTwo'
  | 'cashInThree'
  | 'spinTick'
  | 'spinSettle'
  | 'nearMiss'
  | 'tierTwoReward'
  | 'tierThreeReward'
  | 'jackpot'
  | 'bonusRoundLanding'
  | 'goldenTokenDrop'
  | 'timerWarning';

export const playHapticPattern = async (
  pattern: HapticPattern,
  enabled = true,
): Promise<void> => {
  if (!enabled || Platform.OS === 'web') {
    return;
  }

  if (pattern === 'nearMiss' || pattern === 'timerWarning') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }

  if (pattern === 'tierThreeReward' || pattern === 'jackpot' || pattern === 'bonusRoundLanding') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }

  if (pattern === 'spinTick') {
    await Haptics.selectionAsync();
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
