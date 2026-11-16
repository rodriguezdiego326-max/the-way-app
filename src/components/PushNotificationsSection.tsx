import { useEffect, useState } from 'react';
import { vibrate } from '@/lib/utils';
import PushPermissionSheet from '@/components/PushPermissionSheet';
import {
  enablePushNotifications,
  getPushSystemStatus,
  isPushSupported,
  loadPushPreference,
  refreshPushState,
  requestSystemPushPermission,
  retryDeactivateThisDevice,
  subscribeToAppResume,
  turnOffPushNotifications,
  type PushSystemStatus,
} from '@/lib/pushNotifications';

interface Props {
  userId: string;
}

const STATUS_LABEL: Record<PushSystemStatus, string> = {
  allowed: 'Allowed',
  off_in_settings: 'Off in iPhone Settings',
  not_requested: 'Not requested',
};

const SETTINGS_MESSAGE = 'Notifications are off for SOLAPATH. Turn them on in iPhone Settings to receive alerts.';

export default function PushNotificationsSection({ userId }: Props) {
  const [supported] = useState(isPushSupported);
  const [enabled, setEnabled] = useState(false);
  const [systemStatus, setSystemStatus] = useState<PushSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [needsDeviceRetry, setNeedsDeviceRetry] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [pref, status] = await Promise.all([loadPushPreference(userId), getPushSystemStatus()]);
    setEnabled(pref);
    setSystemStatus(status);
  }

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    refresh()
      .catch(() => { if (!cancelled) setMessage('Could not load your notification setting.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    void subscribeToAppResume(() => {
      void refreshPushState().then(refresh).catch(() => undefined);
    }).then((off) => {
      if (cancelled) off();
      else unsubscribe = off;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, userId]);

  if (!supported) return null;

  async function turnOn(permissionAlreadyAllowed: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (!permissionAlreadyAllowed) {
        const status = await requestSystemPushPermission();
        setSystemStatus(status);
        if (status !== 'allowed') {
          setMessage(SETTINGS_MESSAGE);
          return;
        }
      }
      const result = await enablePushNotifications();
      if (result === 'enabled') {
        setEnabled(true);
      } else if (result === 'denied') {
        setMessage(SETTINGS_MESSAGE);
      } else {
        setMessage('Notifications could not be turned on. Please try again.');
      }
    } catch {
      setMessage('That change did not save. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    vibrate(8);
    if (busy) return;
    if (enabled) {
      setBusy(true);
      setMessage(null);
      try {
        const result = await turnOffPushNotifications();
        setEnabled(false);
        setNeedsDeviceRetry(result === 'device_pending');
        if (result === 'device_pending') {
          setMessage('Alerts are off, but this iPhone has not fully unregistered yet. Try again.');
        }
      } catch {
        setMessage('That change did not save. Please try again.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (systemStatus === 'off_in_settings') {
      setMessage(SETTINGS_MESSAGE);
      return;
    }
    if (systemStatus === 'not_requested') {
      setShowExplainer(true);
      return;
    }
    await turnOn(true);
  }

  async function handleRetryDevice() {
    setBusy(true);
    const ok = await retryDeactivateThisDevice();
    setNeedsDeviceRetry(!ok);
    setMessage(ok ? null : 'This iPhone has not fully unregistered yet. Try again.');
    setBusy(false);
  }

  async function handleAllowFromExplainer() {
    setShowExplainer(false);
    await turnOn(false);
  }

  return (
    <div className="mt-6 pt-6 border-t border-ink-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-ivory-100 text-sm font-medium">Phone alerts</p>
          <p className="text-ivory-600 text-xs mt-0.5">A short alert when there is new Activity</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Phone alerts"
          disabled={loading || busy}
          onClick={handleToggle}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300 disabled:opacity-50 ${enabled ? 'bg-gold-500' : 'bg-ink-700'}`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>
      {systemStatus && (
        <p className="text-ivory-600 text-xs mt-3">
          System status: <span className="text-ivory-300">{STATUS_LABEL[systemStatus]}</span>
        </p>
      )}
      {message && <p className="text-ivory-500 text-xs mt-3 leading-relaxed">{message}</p>}
      {needsDeviceRetry && (
        <button
          type="button"
          onClick={handleRetryDevice}
          disabled={busy}
          className="mt-3 text-gold-400 text-xs font-medium underline underline-offset-4 disabled:opacity-50"
        >
          Try again
        </button>
      )}
      {showExplainer && (
        <PushPermissionSheet
          busy={busy}
          onNotNow={() => setShowExplainer(false)}
          onAllow={handleAllowFromExplainer}
        />
      )}
    </div>
  );
}
