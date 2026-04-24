import type { ConfigContext, ExpoConfig } from 'expo/config';

const config = (_context: ConfigContext): ExpoConfig => ({
  name: 'DopamineHabit',
  slug: 'dopaminehabit',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'dopaminehabit',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  icon: './assets/images/icon.png',
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: ['expo-router', 'expo-notifications'],
  ios: {
    bundleIdentifier: 'com.dopaminehabit.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.dopaminehabit.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0B0B14',
    },
  },
  extra: {
    eas: {
      projectId: 'dopaminehabit-local-dev',
    },
  },
});

export default config;
