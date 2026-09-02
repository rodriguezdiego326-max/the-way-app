import { useState, useEffect, useCallback } from 'react';
import { X, Archive, Lock, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getVaultEvents, getMilestones, getLetters } from '@/lib/legacyEngine';
import { SOURCE_LABELS } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyEvent, LegacyMilestone, LegacyLetter } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function LegacyVaultScreen({ profile, onBack }: Props) {
  const [vaultEvents, setVaultEvents] = useState<LegacyEvent[]>([]);
  const [vaultMilestones, setVaultMilestones] = useState<LegacyMilestone[]>([]);
  const [vaultLetters, setVaultLetters] = useState<LegacyLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [events, milestones, letters] = await Promise.all([
        getVaultEvents(profile.id),
        getMilestones(profile.id),
        getLetters(profile.id),
      ]);
      setVaultEvents(events);
      setVaultMilestones(milestones.filter(m => m.in_vault));
      setVaultLetters(letters);
    } catch {
      setError('Could not load your Legacy Vault.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const totalItems = vaultEvents.length + vaultMilestones.length + vaultLetters.length;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Legacy Vault</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Archive size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">LEGACY VAULT</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Your most important records.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading vault..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && totalItems === 0 && (
            <div className="premium-card p-6 text-center">
              <Archive size={28} className="text-gold-400/40 mx-auto mb-3" />
              <p className="text-ivory-400 text-sm">Your vault is empty.</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Designate important records for your Legacy Vault — testimony, letters, major prayers, milestones.</p>
            </div>
          )}

          {!loading && !error && totalItems > 0 && (
            <div className="space-y-4">
              {vaultEvents.length > 0 && (
                <div>
                  <p className="ui-label mb-2">Events</p>
                  <div className="space-y-2">
                    {vaultEvents.map(e => (
                      <div key={e.id} className="premium-card p-4">
                        <p className="text-ivory-100 font-medium text-sm">{e.title}</p>
                        <p className="text-ivory-600 text-xs mt-0.5">{formatDate(e.event_date)}</p>
                        {e.user_text && <p className="text-ivory-400 text-xs mt-2 leading-relaxed line-clamp-2">{e.user_text}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {vaultMilestones.length > 0 && (
                <div>
                  <p className="ui-label mb-2">Milestones</p>
                  <div className="space-y-2">
                    {vaultMilestones.map(m => (
                      <div key={m.id} className="premium-card p-4">
                        <p className="text-ivory-100 font-medium text-sm">{m.title}</p>
                        <p className="text-ivory-600 text-xs mt-0.5">{formatDate(m.milestone_date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {vaultLetters.length > 0 && (
                <div>
                  <p className="ui-label mb-2">Letters</p>
                  <div className="space-y-2">
                    {vaultLetters.map(l => (
                      <div key={l.id} className="premium-card p-4">
                        <p className="text-ivory-100 font-medium text-sm">{l.recipient_label || 'Letter'}</p>
                        <p className="text-ivory-600 text-xs mt-0.5">{formatDate(l.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              The Vault is private. Future export and inheritance features will allow you to share selected records with a trusted person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
