import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.dystancee.tirtawana',
  appName: 'TIRTAWANA',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    // Landscape-first: the web layer already handles rotation UX,
    // but we also hint the native side.
    SplashScreen: { launchShowDuration: 0 }
  }
};

export default config;
