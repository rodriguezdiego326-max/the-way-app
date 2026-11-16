import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  PushNotifications,
  type ActionPerformed,
  type PermissionStatus,
} from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { secureStorageAdapter } from '@/lib/secureStorage';

const INSTALLATION_KEY = 'push_installation_id';
const APNS_ENVIRONMENT = 'production';
const REGISTRATION_TIMEOUT_MS = 15000;
const NATIVE_CLEANUP_TIMEOUT_MS = 8000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PushSystemStatus = 'allowed' | 'off_in_settings' | 'not_requested';
export type EnablePushResult = 'enabled' | 'denied' | 'failed';
export type TurnOffPushResult = 'off' | 'device_pending';

export interface PushRuntimeHandlers {
  onTap: (activityId: string) => void;
  onForeground: () => void;
}

export function isPushSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

function toSystemStatus(state: PermissionStatus['receive']): PushSystemStatus {
  if (state === 'granted') return 'allowed';
  if (state === 'denied') return 'off_in_settings';
  return 'not_requested';
}

export async function getPushSystemStatus(): Promise<PushSystemStatus> {
  return toSystemStatus((await PushNotifications.checkPermissions()).receive);
}

export async function requestSystemPushPermission(): Promise<PushSystemStatus> {
  return toSystemStatus((await PushNotifications.requestPermissions()).receive);
}

async function getInstallationId(): Promise<string> {
  const existing = await secureStorageAdapter.getItem(INSTALLATION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  await secureStorageAdapter.setItem(INSTALLATION_KEY, created);
  return created;
}

async function currentAppBuild(): Promise<number> {
  const info = await App.getInfo();
  const build = Number.parseInt(info.build, 10);
  if (!Number.isInteger(build)) throw new Error('app build unavailable');
  return build;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), ms);
  });
  return Promise.race([work, limit]).finally(() => clearTimeout(timer));
}

async function registerDevice(token: string): Promise<void> {
  const { error } = await supabase.rpc('register_push_device', {
    p_installation_id: await getInstallationId(),
    p_token: token,
    p_environment: APNS_ENVIRONMENT,
    p_app_build: await currentAppBuild(),
  });
  if (error) throw error;
}

// Listeners are attached and awaited before register(), so no registration event can be missed.
async function registerAndAwaitToken(): Promise<string> {
  const handles: PluginListenerHandle[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveToken!: (token: string) => void;
  let rejectToken!: (error: Error) => void;
  const token = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });
  try {
    handles.push(await PushNotifications.addListener('registration', (event) => resolveToken(event.value)));
    handles.push(await PushNotifications.addListener('registrationError', () => rejectToken(new Error('registration failed'))));
    timer = setTimeout(() => rejectToken(new Error('registration timed out')), REGISTRATION_TIMEOUT_MS);
    await PushNotifications.register();
    return await token;
  } finally {
    clearTimeout(timer);
    await Promise.all(handles.map((handle) => handle.remove()));
  }
}

export async function enablePushNotifications(): Promise<EnablePushResult> {
  if (!isPushSupported()) return 'failed';
  if ((await getPushSystemStatus()) !== 'allowed') return 'denied';
  try {
    const token = await registerAndAwaitToken();
    await registerDevice(token);
    await setPushPreference(true);
    return 'enabled';
  } catch {
    return 'failed';
  }
}

export async function setPushPreference(enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_push_enabled', { p_enabled: enabled });
  if (error) throw error;
}

export async function loadPushPreference(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('push_preferences')
    .select('push_enabled')
    .eq('profile_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.push_enabled === true;
}

async function deactivateThisDevice(): Promise<void> {
  const installationId = await secureStorageAdapter.getItem(INSTALLATION_KEY);
  if (!installationId) return;
  const { error } = await supabase.rpc('deactivate_push_device', { p_installation_id: installationId });
  if (error) throw error;
}

export async function turnOffPushNotifications(): Promise<TurnOffPushResult> {
  await setPushPreference(false);
  try {
    await withTimeout(deactivateThisDevice(), NATIVE_CLEANUP_TIMEOUT_MS);
    return 'off';
  } catch {
    return 'device_pending';
  }
}

export async function retryDeactivateThisDevice(): Promise<boolean> {
  try {
    await withTimeout(deactivateThisDevice(), NATIVE_CLEANUP_TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
}

// Best-effort: never blocks sign-out. Deactivation runs while still authenticated.
export async function releasePushForSignOut(): Promise<void> {
  if (!isPushSupported()) return;
  await withTimeout(deactivateThisDevice(), NATIVE_CLEANUP_TIMEOUT_MS).catch(() => undefined);
  await withTimeout(PushNotifications.unregister(), NATIVE_CLEANUP_TIMEOUT_MS).catch(() => undefined);
}

// Turns push off on this device when the system permission is no longer granted, and
// refreshes registration when it is still granted. Never prompts the user.
export async function refreshPushState(): Promise<void> {
  if (!isPushSupported()) return;
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  if (!(await loadPushPreference(userId))) return;

  if ((await getPushSystemStatus()) !== 'allowed') {
    await turnOffPushNotifications();
    return;
  }
  await PushNotifications.register();
}

async function reconcileToken(token: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  if (!(await loadPushPreference(userId))) return;
  await registerDevice(token);
}

function activityIdFromPush(event: ActionPerformed): string | null {
  const data = event.notification?.data as Record<string, unknown> | undefined;
  if (data?.solapath_type !== 'activity') return null;
  const id = data.activity_id;
  return typeof id === 'string' && UUID_PATTERN.test(id) ? id : null;
}

// Installed once at app start, before sign-in, so a tap that launches the app is captured.
export async function startPushRuntime(handlers: PushRuntimeHandlers): Promise<() => void> {
  if (!isPushSupported()) return () => {};
  const handles = await Promise.all([
    PushNotifications.addListener('registration', (event) => {
      void reconcileToken(event.value).catch(() => undefined);
    }),
    PushNotifications.addListener('pushNotificationReceived', () => handlers.onForeground()),
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const activityId = activityIdFromPush(event);
      if (activityId) handlers.onTap(activityId);
    }),
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void refreshPushState().catch(() => undefined);
    }),
  ]);
  return () => {
    handles.forEach((handle) => void handle.remove());
  };
}

export async function subscribeToAppResume(onResume: () => void): Promise<() => void> {
  if (!isPushSupported()) return () => {};
  const handle = await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) onResume();
  });
  return () => { void handle.remove(); };
}
