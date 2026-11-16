import { useEffect, useState } from 'react';
import { vibrate } from '@/lib/utils';
import {
  enablePushNotifications,
  isPushSupported,
  loadPushPreference,
  setPushPreference,
} from '@/lib/pushNotifications';

interface Props {
  userId: string;
}

export default function PushNotificationsSection({ userId }: Props) {
  const [supported] = useState(isPushSupported);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    loadPushPreference(userId)
      .then((value) => { if (!cancelled) setEnabled(value); })
      .catch(() => { if (!cancelled) setMessage('Could not load your notification setting.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [supported, userId]);

  if (!supported) return null;

  async function toggle() {
    vibrate(8);
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        await setPushPreference(false);
        setEnabled(false);
        return;
      }
      const result = await enablePushNotifications();
      if (result === 'enabled') {
        setEnabled(true);
      } else if (result === 'denied') {
        setMessage('Notifications are off for SOLAPATH. Turn them on in your iPhone Settings to receive alerts.');
      } else {
        setMessage('Notifications could not be turned on. Please try again.');
      }
    } catch {
      setMessage('That change did not save. Please try again.');
    } finally {
      setBusy(false);
    }
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
          onClick={toggle}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300 disabled:opacity-50 ${enabled ? 'bg-gold-500' : 'bg-ink-700'}`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>
      {message && <p className="text-ivory-500 text-xs mt-3 leading-relaxed">{message}</p>}
    </div>
  );
}
