import { useState, useEffect, useCallback } from 'react';
import { X, Plus, BookOpen, Lock, Users, ChevronRight, Eye, EyeOff, ArrowDown } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  createScriptureStudy, getScriptureStudies, createReflection, getReflections,
} from '@/lib/togetherEngine';
import { retrieveSources } from '@/lib/libraryEngine';
import type { Profile } from '@/lib/types';
import type { Circle, SharedScriptureStudy, SharedReflection } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle?: Circle;
  onBack: () => void;
}

type StudyPhase = 'list' | 'open' | 'read' | 'reflect' | 'share' | 'discuss';

export default function ScriptureTogetherScreen({ profile, circle, onBack }: Props) {
  const [studies, setStudies] = useState<SharedScriptureStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [passage, setPassage] = useState('');
  const [objective, setObjective] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeStudy, setActiveStudy] = useState<SharedScriptureStudy | null>(null);
  const [phase, setPhase] = useState<StudyPhase>('list');
  const [reflection, setReflection] = useState('');
  const [reflectionVisibility, setReflectionVisibility] = useState<string>('private');
  const [sharedReflections, setSharedReflections] = useState<SharedReflection[]>([]);
  const [savingReflection, setSavingReflection] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (circle) {
        const data = await getScriptureStudies(circle.id);
        setStudies(data);
      }
    } catch {
      setError('Could not load studies.');
    } finally {
      setLoading(false);
    }
  }, [circle?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!passage.trim() || !circle) return;
    vibrate(15);
    setCreating(true);
    try {
      const study = await createScriptureStudy(
        circle.id, profile.id, passage.trim(),
        objective.trim() || undefined,
      );
      if (study) {
        setPassage(''); setObjective('');
        setShowCreate(false);
        await load();
      }
    } catch {
      setError('Could not create study.');
    } finally {
      setCreating(false);
    }
  }

  async function handleOpenStudy(study: SharedScriptureStudy) {
    vibrate(10);
    setActiveStudy(study);
    setPhase('open');
    setReflection('');
    setReflectionVisibility('private');
    const refs = await getReflections(circle?.id, study.id);
    setSharedReflections(refs.filter((r) => r.visibility === 'circle'));
  }

  async function handleSaveReflection() {
    if (!reflection.trim() || !activeStudy) return;
    vibrate(15);
    setSavingReflection(true);
    try {
      await createReflection(
        profile.id, reflection.trim(),
        reflectionVisibility,
        circle?.id, activeStudy.id,
      );
      setReflection('');
      setPhase('discuss');
      const refs = await getReflections(circle?.id, activeStudy.id);
      setSharedReflections(refs.filter((r) => r.visibility === 'circle'));
    } catch {
      setError('Could not save reflection.');
    } finally {
      setSavingReflection(false);
    }
  }

  if (phase !== 'list' && activeStudy) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => { setPhase('list'); setActiveStudy(null); }} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Scripture Together</p><span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            {/* Phase: Open */}
            {phase === 'open' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={28} className="text-gold-300" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-4">Open Your Bible</p>
                <h2 className="font-serif text-4xl text-ivory-50 mb-4">{activeStudy.passage_reference}</h2>
                {activeStudy.reading_objective && (
                  <p className="text-ivory-300 text-sm leading-relaxed mb-8 max-w-xs mx-auto">{activeStudy.reading_objective}</p>
                )}
                <button onClick={() => { vibrate(10); setPhase('read'); }} className="btn-primary">
                  <ArrowDown size={16} /> Read
                </button>
              </div>
            )}

            {/* Phase: Read */}
            {phase === 'read' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-3">Read</p>
                <h2 className="font-serif text-3xl text-ivory-50 mb-4">{activeStudy.passage_reference}</h2>
                <div className="premium-card p-5 mb-6">
                  <p className="text-ivory-300 text-sm leading-relaxed">
                    Open your Bible to {activeStudy.passage_reference}. Read the passage slowly. Let the text speak before you reflect.
                  </p>
                </div>
                <div className="space-y-3 mb-6">
                  {activeStudy.observe_prompt && <StudyPrompt label="Observe" text={activeStudy.observe_prompt} />}
                  {activeStudy.understand_prompt && <StudyPrompt label="Understand" text={activeStudy.understand_prompt} />}
                </div>
                <button onClick={() => { vibrate(10); setPhase('reflect'); }} className="btn-primary w-full">
                  <ArrowDown size={16} /> Personal Reflection
                </button>
              </div>
            )}

            {/* Phase: Reflect */}
            {phase === 'reflect' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-3">Personal Reflection</p>
                <p className="text-ivory-400 text-sm leading-relaxed mb-4">Write your reflection privately. You can choose to share it with the Circle afterwards.</p>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="What is God teaching you through this passage?"
                  className="input-field min-h-[160px] resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-4 mb-4">
                  <Lock size={12} className="text-ivory-600" />
                  <p className="text-ivory-600 text-xs">Your reflection is private by default.</p>
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { vibrate(6); setReflectionVisibility('private'); }} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium ${reflectionVisibility === 'private' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                    <EyeOff size={12} className="inline mr-1" /> Keep Private
                  </button>
                  <button onClick={() => { vibrate(6); setReflectionVisibility('circle'); }} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium ${reflectionVisibility === 'circle' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                    <Users size={12} className="inline mr-1" /> Share With Circle
                  </button>
                </div>
                <button onClick={handleSaveReflection} disabled={savingReflection || !reflection.trim()} className="btn-primary w-full disabled:opacity-40">
                  {savingReflection ? 'Saving...' : reflectionVisibility === 'circle' ? 'Share With Circle' : 'Save Privately'}
                </button>
                <button onClick={() => { vibrate(8); setPhase('discuss'); }} className="btn-secondary w-full mt-2">
                  Skip to Discussion
                </button>
              </div>
            )}

            {/* Phase: Discuss */}
            {phase === 'discuss' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-3">Discussion</p>
                <h2 className="font-serif text-2xl text-ivory-50 mb-2">{activeStudy.passage_reference}</h2>
                {activeStudy.discuss_prompt && (
                  <div className="premium-card p-4 mb-4">
                    <p className="text-ivory-300 text-sm leading-relaxed">{activeStudy.discuss_prompt}</p>
                  </div>
                )}
                {activeStudy.apply_prompt && <StudyPrompt label="Apply" text={activeStudy.apply_prompt} />}
                {activeStudy.prayer_prompt && <StudyPrompt label="Pray" text={activeStudy.prayer_prompt} />}

                {sharedReflections.length > 0 && (
                  <>
                    <p className="ui-label mt-6 mb-3">Shared Reflections</p>
                    <div className="space-y-2">
                      {sharedReflections.map((r) => (
                        <div key={r.id} className="premium-card p-3">
                          <p className="text-ivory-300 text-sm leading-relaxed">{r.body}</p>
                          <p className="text-ivory-600 text-xs mt-2">{formatRelative(r.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {sharedReflections.length === 0 && (
                  <div className="premium-card p-4 mt-4 text-center">
                    <p className="text-ivory-500 text-xs">No one has shared a reflection yet. You encounter Scripture before seeing others' responses.</p>
                  </div>
                )}

                {activeStudy.go_deeper_prompt && (
                  <button onClick={() => { vibrate(8); }} className="btn-secondary w-full mt-4">
                    Go Deeper (Verified RAG)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Scripture Together</p>
        {circle && <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-ghost"><Plus size={18} /></button>}
        {!circle && <span className="w-10" />}
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Scripture Together</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Read, reflect, then discuss. You encounter Scripture first.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading studies..." />}
          {error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && studies.length === 0 && (
            <EmptyState message={circle ? 'No studies assigned yet. Tap + to assign a passage.' : 'Open a Circle to start a group study.'} />
          )}

          {!loading && !error && studies.length > 0 && (
            <div className="flex flex-col gap-2">
              {studies.map((s) => (
                <button key={s.id} onClick={() => handleOpenStudy(s)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-100 font-medium text-sm font-serif">{s.passage_reference}</p>
                    <p className="text-ivory-600 text-xs">{formatRelative(s.created_at)}</p>
                  </div>
                  <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Eye size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              The default order matters. You encounter Scripture and reflect before seeing everyone else's responses.
            </p>
          </div>
        </div>
      </div>

      {showCreate && circle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ivory-50">Assign a Passage</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Romans 8:1–17" className="input-field" autoFocus />
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Reading objective (optional)" className="input-field min-h-[60px] resize-none text-sm" />
              <button onClick={handleCreate} disabled={creating || !passage.trim()} className="btn-primary w-full disabled:opacity-40">
                <Plus size={16} /> {creating ? 'Creating...' : 'Assign Study'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudyPrompt({ label, text }: { label: string; text: string }) {
  return (
    <div className="premium-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium mb-1">{label}</p>
      <p className="text-ivory-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
