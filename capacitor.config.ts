import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rfgforge.solapath',
  appName: 'SOLAPATH',
  webDir: 'dist',
  server: {
    // Allow the native app to load the production web bundle.
    // androidScheme must be 'https' for Supabase cookie auth to work correctly.
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#b8976a',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',          // dark content on light bg — not used; we use 'light' icons
      backgroundColor: '#0a0a0f',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',         // Body resize keeps safe-area math correct
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge'],  // No alert/sound on lock screen by default — privacy
    },
  },
};

export default config;
