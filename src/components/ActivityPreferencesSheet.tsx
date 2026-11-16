import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { LoadingState } from '@/components/States';
import { vibrate } from '@/lib/utils';
import { DEFAULT_ACTIVITY_PREFERENCES, type ActivityPreferences } from '@/lib/activityTypes';
import { loadActivityPreferences, saveActivityPreferences } from '@/lib/activityEngine';
import PushNotificationsSection from '@/components/PushNotificationsSection';

interface Props {
  userId: string;
  onClose: () => void;
}

const OPTIONS: { key: keyof ActivityPreferences; label: string; hint: string }[] = [
  { key: 'family_activity', label: 'Family updates', hint: 'New family members joining' },
  { key: 'circle_activity', label: 'Circle updates', hint: 'New members joining your Circles' },
  { key: 'prayer_activity', label: 'Prayer requests', hint: 'New and updated prayer requests' },
  { key: 'encouragement_activity', label: 'Encouragement', hint: 'Encouragement sent to you' },
  { key: 'sermon_activity', label: 'Sermon discussions', hint: 'New sermon discussions' },
];

export default function ActivityPreferencesSheet({ userId, onClose }: Props) {
  const [prefs, setPrefs] = useState<ActivityPreferences>(DEFAULT_ACTIVITY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefsRef = useRef(prefs);
  const keySeq = useRef<Partial<Record<keyof ActivityPreferences, number>>>({});
  const seqCounter = useRef(0);

  function applyPref(key: keyof ActivityPreferences, value: boolean) {
    prefsRef.current = { ...prefsRef.current, [key]: value };
    setPrefs(prefsRef.current);
  }

  useEffect(() => {
    let cancelled = false;
    loadActivityPreferences(userId)
      .then((p) => {
        if (cancelled) return;
        prefsRef.current = p;
        setPrefs(p);
      })
      .catch(() => { if (!cancelled) setError('Could not load your settings.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  async function toggle(key: keyof ActivityPreferences) {
    vibrate(8);
    const before = prefsRef.current[key];
    const seq = ++seqCounter.current;
    keySeq.current[key] = seq;
    applyPref(key, !before);
    setError(null);
    try {
      await saveActivityPreferences(userId, { [key]: !before });
    } catch {
      if (keySeq.current[key] === seq) {
        applyPref(key, before);
        setError('That change did not save. Please try again.');
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-ink-900 border border-ink-700 rounded-t-3xl sm:rounded-3xl p-6 pb-10 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-xl text-ivory-50">Activity settings</h3>
          <button onClick={onClose} className="btn-ghost" aria-label="Close settings"><X size={18} /></button>
        </div>
        <p className="text-ivory-500 text-sm mb-6 leading-relaxed">Choose what appears in your Activity feed.</p>

        {loading && <LoadingState message="Loading settings..." />}

        {!loading && (
          <ul className="flex flex-col divide-y divide-ink-700">
            {OPTIONS.map((opt) => (
              <li key={opt.key} className="flex items-center justify-between py-4 gap-4">
                <div>
                  <p className="text-ivory-100 text-sm font-medium">{opt.label}</p>
                  <p className="text-ivory-600 text-xs mt-0.5">{opt.hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs[opt.key]}
                  aria-label={opt.label}
                  onClick={() => toggle(opt.key)}
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300 ${prefs[opt.key] ? 'bg-gold-500' : 'bg-ink-700'}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${prefs[opt.key] ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && <PushNotificationsSection userId={userId} />}

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
      </div>
    </div>
  );
}
