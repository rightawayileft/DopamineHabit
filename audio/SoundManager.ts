import { Platform } from 'react-native';

import type { SoundEventName } from '@/audio/events';

export interface SoundManagerOptions {
  enabled: boolean;
}

export class SoundManager {
  private enabled: boolean;

  constructor({ enabled }: SoundManagerOptions = { enabled: true }) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async preloadAll(): Promise<void> {
    return Promise.resolve();
  }

  async play(_eventName: SoundEventName): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return Promise.resolve();
    }

    return Promise.resolve();
  }
}

export const soundManager = new SoundManager();
