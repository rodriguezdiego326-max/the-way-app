import { useState, useEffect, useCallback } from 'react';
import { X, Shield, Lock, Check, AlertCircle } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState } from '@/components/States';
import { getAccountability, setAccountability } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { AccountabilityRelationship } from '@/lib/togetherTypes';
import { ACCOUNTABILITY_AREAS } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function AccountabilityScreen({ profile, onBack }: Props) {
  const [existing, setExisting] = useState<AccountabilityRelationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [optIn, setOptIn] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAccountability(profile.id);
      setExisting(data);
      if (data) {
        setOptIn(data.opt_in);
        setSelectedAreas(data.areas);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  function toggleArea(area: string) {
    vibrate(6);
    setSelectedAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  }

  async function handleSave() {
    vibrate(15);
    setSaving(true);
    try {
      await setAccountability(profile.id, selectedAreas, optIn);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      await load();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Accountability</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Accountability</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Private. Opt-in. User-controlled. No scores, no streaks, no shame.</p>
            </div>
          </div>

          {loading ? <LoadingState message="Loading..." /> : (
            <>
              {/* Opt-in toggle */}
              <div className="premium-card p-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-ivory-100 font-medium text-sm">Enable Accountability</p>
                    <p className="text-ivory-500 text-xs mt-1 leading-relaxed">You control what information is shared. Nothing is automatic.</p>
                  </div>
                  <button onClick={() => { vibrate(10); setOptIn(!optIn); }} className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${optIn ? 'bg-gold-500/40' : 'bg-ink-700'}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${optIn ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {optIn && (
                <>
                  <p className="ui-label mb-3">Areas</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {ACCOUNTABILITY_AREAS.map((a) => (
                      <button
                        key={a}
                        onClick={() => toggleArea(a)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                          selectedAreas.includes(a) ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  <div className="premium-card p-4 mb-4">
                    <p className="text-ivory-200 text-sm font-medium mb-2">What This Does</p>
                    <p className="text-ivory-500 text-xs leading-relaxed">You may send quiet signals to your accountability partner or circle:</p>
                    <div className="flex flex-col gap-1.5 mt-3">
                      {['"I could use prayer today."', '"I\'d like to talk."', '"I completed my reflection."'].map((s) => (
                        <p key={s} className="text-ivory-400 text-xs italic">{s}</p>
                      ))}
                    </div>
                  </div>

                  <div className="premium-card p-4 mb-4 border-clay-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-clay-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-ivory-200 text-xs font-medium">Never Automatically Shared</p>
                        <p className="text-ivory-500 text-xs mt-1 leading-relaxed">Journal entries, Ask SOLAPATH conversations, memory, private prayers, confessions, Family records, and REACH contacts are never shared automatically.</p>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-4 mb-4 border-clay-500/20">
                    <div className="flex items-start gap-2">
                      <Lock size={14} className="text-clay-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-ivory-200 text-xs font-medium">No Scores</p>
                        <p className="text-ivory-500 text-xs mt-1 leading-relaxed">No Faith Score. No Holiness Score. No Failure Score. No Spiritual Rank. No streak-based shame.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-40">
                {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : 'Save'}
              </button>

              {existing && (
                <p className="text-ivory-600 text-xs text-center mt-3">Last updated {formatRelative(existing.updated_at)}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
