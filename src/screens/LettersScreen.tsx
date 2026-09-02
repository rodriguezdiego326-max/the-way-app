import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Plus, Sparkles, Calendar, Lock } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createLetter, getLetters, softDeleteLetter } from '@/lib/legacyEngine';
import { LETTER_TYPES } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyLetter } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function LettersScreen({ profile, onBack }: Props) {
  const [letters, setLetters] = useState<LegacyLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [letterType, setLetterType] = useState('to_my_child');
  const [recipient, setRecipient] = useState('');
  const [body, setBody] = useState('');
  const [scripture, setScripture] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLetters(profile.id);
      setLetters(data);
    } catch {
      setError('Could not load your letters.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!body.trim()) return;
    vibrate(10);
    await createLetter(profile.id, letterType, body, {
      recipientLabel: recipient || undefined,
      scriptureReference: scripture || undefined,
      targetDate: targetDate || undefined,
    });
    setShowCreate(false);
    setLetterType('to_my_child'); setRecipient(''); setBody(''); setScripture(''); setTargetDate('');
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Letters</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">LETTERS</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Words for those you love.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading letters..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showCreate && (
            <>
              {letters.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No letters yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Write a letter to your child, spouse, future self, or family.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {letters.map(letter => (
                    <div key={letter.id} className="premium-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-ivory-100 font-medium text-sm">{LETTER_TYPES.find(t => t.id === letter.letter_type)?.label || letter.letter_type}</p>
                        {letter.target_date && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gold-500/10 text-gold-300/80 text-[10px] font-medium shrink-0">
                            <Calendar size={9} /> {formatDate(letter.target_date)}
                          </span>
                        )}
                      </div>
                      {letter.recipient_label && <p className="text-ivory-600 text-xs">To: {letter.recipient_label}</p>}
                      <p className="text-ivory-400 text-xs mt-2 leading-relaxed line-clamp-3">{letter.body}</p>
                      {letter.scripture_reference && <p className="text-gold-300/80 text-xs mt-1 font-medium">{letter.scripture_reference}</p>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { vibrate(10); setShowCreate(true); }} className="btn-primary w-full">
                <Plus size={16} /> Write a Letter
              </button>
            </>
          )}

          {showCreate && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">New Letter</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Type</label>
                <select value={letterType} onChange={e => setLetterType(e.target.value)} className="input-field">
                  {LETTER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Recipient</label>
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g., My daughter" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Letter</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your words..." className="input-field min-h-[120px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture (optional)</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Psalm 23" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Open on a Future Date (optional)</label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="input-field" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} className="btn-primary flex-1">Save Letter</button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Letters are private. They are not sent automatically. Future letters are stored for future delivery or export.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
