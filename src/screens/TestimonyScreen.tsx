import { useState, useEffect, useCallback } from 'react';
import { X, Scroll, Sparkles, Edit3, FileText } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getTestimony, upsertTestimony, setTestimonyAiOrganized, deleteTestimonyAiOrganized } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';
import type { LegacyTestimony } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

const PROMPTS = [
  { key: 'before_christ', label: 'Before Christ', placeholder: 'What did you believe? What was life like?' },
  { key: 'how_i_came_to_understand', label: 'How I Came to Understand the Gospel', placeholder: 'How did you hear and understand the gospel?' },
  { key: 'repentance_and_faith', label: 'Repentance and Faith', placeholder: 'How did you turn to Christ?' },
  { key: 'how_christ_changed_my_life', label: 'How Christ Has Changed My Life', placeholder: 'What has changed since you believed?' },
  { key: 'what_im_still_learning', label: 'What I\'m Still Learning', placeholder: 'What is God still teaching you?' },
  { key: 'scripture_that_matters', label: 'Scripture That Matters to Me', placeholder: 'Which passages have shaped your faith?' },
] as const;

export default function TestimonyScreen({ profile, onBack }: Props) {
  const [testimony, setTestimony] = useState<LegacyTestimony | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAiVersion, setShowAiVersion] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestimony(profile.id);
      setTestimony(data);
      if (data) {
        const f: Record<string, string> = {};
        for (const p of PROMPTS) f[p.key] = (data as unknown as Record<string, string | null>)[p.key] || '';
        setFields(f);
      }
    } catch {
      setError('Could not load your testimony.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    vibrate(10);
    const updates: Partial<LegacyTestimony> = {};
    for (const p of PROMPTS) {
      (updates as unknown as Record<string, string>)[p.key] = fields[p.key] || null;
    }
    await upsertTestimony(profile.id, updates);
    setEditing(false);
    load();
  };

  const handleOrganize = async () => {
    vibrate(10);
    const sections = PROMPTS.map(p => {
      const text = fields[p.key]?.trim();
      return text ? `${p.label}\n\n${text}` : null;
    }).filter(Boolean);
    const organized = sections.join('\n\n---\n\n');
    await setTestimonyAiOrganized(profile.id, organized);
    setShowAiVersion(true);
    load();
  };

  const handleDeleteAi = async () => {
    vibrate(10);
    await deleteTestimonyAiOrganized(profile.id);
    setShowAiVersion(false);
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">My Testimony</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Scroll size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">MY TESTIMONY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Your story. Your words.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading testimony..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !editing && (
            <>
              {!testimony ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">Your testimony is not yet written.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Write it yourself, or let SOLAPATH help organize what you've written.</p>
                  <button onClick={() => { vibrate(10); setEditing(true); }} className="btn-primary mt-4">
                    <Edit3 size={16} /> Begin My Testimony
                  </button>
                </div>
              ) : (
                <>
                  <p className="ui-label mb-2">Your Words</p>
                  <div className="premium-card p-4 mb-4 space-y-3">
                    {PROMPTS.map(p => {
                      const text = (testimony as unknown as Record<string, string | null>)[p.key];
                      return text ? (
                        <div key={p.key}>
                          <p className="text-ivory-600 text-[10px] uppercase tracking-wider font-medium mb-1">{p.label}</p>
                          <p className="text-ivory-300 text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
                        </div>
                      ) : null;
                    })}
                  </div>

                  {testimony.ai_organized_version && showAiVersion && (
                    <div className="premium-card p-4 mb-4 border-gold-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gold-300 text-xs font-medium">Draft organized from your own words.</p>
                        <button onClick={handleDeleteAi} className="text-ivory-600 text-xs hover:text-error transition-colors">Delete</button>
                      </div>
                      <p className="text-ivory-400 text-xs leading-relaxed whitespace-pre-wrap">{testimony.ai_organized_version}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { vibrate(8); setEditing(true); }} className="btn-secondary flex-1 text-sm">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={handleOrganize} className="btn-secondary flex-1 text-sm">
                      <FileText size={14} /> Help Me Organize
                    </button>
                  </div>
                  {testimony.ai_organized_version && !showAiVersion && (
                    <button onClick={() => setShowAiVersion(true)} className="btn-secondary w-full mt-2 text-sm">
                      View AI-Organized Version
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {editing && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Write Your Testimony</p>
              {PROMPTS.map(p => (
                <div key={p.key}>
                  <label className="text-ivory-600 text-xs font-medium mb-1 block">{p.label}</label>
                  <textarea
                    value={fields[p.key] || ''}
                    onChange={e => setFields(prev => ({ ...prev, [p.key]: e.target.value }))}
                    placeholder={p.placeholder}
                    className="input-field min-h-[70px]"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn-primary flex-1">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              AI may reorder, improve clarity, and remove repetition. It uses only your words. It does not invent conversion details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
