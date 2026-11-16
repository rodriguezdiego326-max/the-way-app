import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { secureStorageAdapter } from '@/lib/secureStorage';

const INSTALLATION_KEY = 'push_installation_id';
const APNS_ENVIRONMENT = 'production';
const REGISTRATION_TIMEOUT_MS = 15000;

export type EnablePushResult = 'enabled' | 'denied' | 'failed';

export function isPushSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
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

async function waitForRegistration(): Promise<string> {
  const handles: { remove: () => Promise<void> }[] = [];
  return new Promise<string>((resolve, reject) => {
    const finish = (settle: () => void) => {
      clearTimeout(timer);
      handles.forEach((handle) => void handle.remove());
      settle();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error('registration timed out'))),
      REGISTRATION_TIMEOUT_MS,
    );

    void PushNotifications.addListener('registration', (token) =>
      finish(() => resolve(token.value)),
    ).then((handle) => handles.push(handle));
    void PushNotifications.addListener('registrationError', () =>
      finish(() => reject(new Error('registration failed'))),
    ).then((handle) => handles.push(handle));
  });
}

export async function enablePushNotifications(): Promise<EnablePushResult> {
  if (!isPushSupported()) return 'failed';

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return 'denied';

  try {
    const tokenPromise = waitForRegistration();
    await PushNotifications.register();
    const token = await tokenPromise;

    const { error: registerError } = await supabase.rpc('register_push_device', {
      p_installation_id: await getInstallationId(),
      p_token: token,
      p_environment: APNS_ENVIRONMENT,
      p_app_build: await currentAppBuild(),
    });
    if (registerError) throw registerError;

    const { error: prefError } = await supabase.rpc('set_push_enabled', { p_enabled: true });
    if (prefError) throw prefError;
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

export async function deactivateThisDevice(): Promise<void> {
  if (!isPushSupported()) return;
  const installationId = await secureStorageAdapter.getItem(INSTALLATION_KEY);
  if (!installationId) return;
  const { error } = await supabase.rpc('deactivate_push_device', { p_installation_id: installationId });
  if (error) throw error;
}

export async function subscribeToPushTaps(onTap: () => void): Promise<() => void> {
  if (!isPushSupported()) return () => {};
  const handle = await PushNotifications.addListener('pushNotificationActionPerformed', () => onTap());
  return () => { void handle.remove(); };
}
