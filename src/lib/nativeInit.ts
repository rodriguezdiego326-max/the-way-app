import { Capacitor } from '@capacitor/core';

// All initialization is no-op in the web browser.
// Capacitor.isNativePlatform() returns false on web.

export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform(); // 'ios' | 'android'

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // Dark background with light icon tints matches SOLAPATH's visual identity.
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
    if (platform === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.warn('[nativeInit] StatusBar init failed', e);
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    // Splash is hidden automatically after launchShowDuration (set in capacitor.config.ts).
    // Explicit hide here covers slower cold starts.
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[nativeInit] SplashScreen hide failed', e);
  }

  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    // Prevent the keyboard from resizing the viewport in a way that clips fixed elements.
    await Keyboard.setResizeMode({ mode: 'body' } as Parameters<typeof Keyboard.setResizeMode>[0]);
  } catch (e) {
    console.warn('[nativeInit] Keyboard init failed', e);
  }

  try {
    const { App: CapApp } = await import('@capacitor/app');
    // Handle Android hardware back button — let the app state machine manage navigation.
    // Individual screens register their own backButton listeners where needed.
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        // At the root — do nothing (don't exit silently).
        // Pressing back twice in 500ms could exit; not implemented here to prevent accidents.
      }
    });
  } catch (e) {
    console.warn('[nativeInit] App backButton init failed', e);
  }
}

/** Returns true only when running inside a native Capacitor shell. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns 'ios', 'android', or 'web'. */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}
