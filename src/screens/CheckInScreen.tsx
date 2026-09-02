import { useState, useEffect, useCallback } from 'react';
import { X, Lock, Users, Shield } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createCheckIn, getCheckIns } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleCheckIn } from '@/lib/togetherTypes';
import { CHECK_IN_STATES } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle?: Circle;
  onBack: () => void;
}

export default function CheckInScreen({ profile, circle, onBack }: Props) {
  const [state, setState] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<string>('private');
  const [saving, setSaving] = useState(false);
  const [checkIns, setCheckIns] = useState<CircleCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (circle) {
        const data = await getCheckIns(circle.id);
        setCheckIns(data.filter((c) => c.visibility !== 'private'));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [circle?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!state) return;
    vibrate(15);
    setSaving(true);
    try {
      await createCheckIn(profile.id, state, note.trim() || undefined, visibility, circle?.id);
      setState(null); setNote(''); setVisibility('private');
      await load();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Check In</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Check In</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">How are you arriving? Share with your Circle — or keep it private.</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {CHECK_IN_STATES.map((s) => (
              <button
                key={s}
                onClick={() => { vibrate(8); setState(s); }}
                className={`mood-chip no-tap-highlight ${state === s ? 'bg-gold-500/10 border-gold-500/40' : ''}`}
              >
                <span className={`text-sm font-medium ${state === s ? 'text-gold-300' : 'text-ivory-500'}`}>{s}</span>
              </button>
            ))}
          </div>

          {state && (
            <div className="animate-fade-in-up">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you'd like your Circle to know? (Optional)"
                className="input-field min-h-[80px] resize-none text-sm"
              />

              <p className="ui-label mt-4 mb-2">Share With</p>
              <div className="flex flex-col gap-2 mb-4">
                <button onClick={() => { vibrate(6); setVisibility('private'); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${visibility === 'private' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                  <Lock size={14} /> Keep Private
                </button>
                {circle && (
                  <>
                    <button onClick={() => { vibrate(6); setVisibility('circle'); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${visibility === 'circle' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                      <Users size={14} /> Share With Circle
                    </button>
                    <button onClick={() => { vibrate(6); setVisibility('leader_only'); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${visibility === 'leader_only' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                      <Shield size={14} /> Leader Only
                    </button>
                  </>
                )}
              </div>

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-40">
                {saving ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          )}

          {circle && checkIns.length > 0 && (
            <>
              <p className="ui-label mt-8 mb-3">Recent Circle Check-ins</p>
              <div className="flex flex-col gap-2">
                {checkIns.map((c) => (
                  <div key={c.id} className="premium-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">{c.state}</span>
                      <span className="text-ivory-600 text-xs">{formatRelative(c.created_at)}</span>
                    </div>
                    {c.note && <p className="text-ivory-300 text-sm mt-1 leading-relaxed">{c.note}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {loading && <LoadingState message="Loading..." />}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Shield size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              SOLAPATH does not automatically infer or expose personal struggles. You choose what to share.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
