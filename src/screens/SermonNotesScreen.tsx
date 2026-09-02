import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Plus, ChevronRight, Calendar, User, FileText, ArrowRight } from 'lucide-react';
import { vibrate, formatDate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  createSermon, createSermonNote, getSermonNotes, getRecentSermons, getSermonNoteForSermon,
  updateSermonNote,
} from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { Sermon, SermonNote } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenSermonFollowUp: (sermon: Sermon) => void;
  onOpenContinueSunday: () => void;
  onOpenSermonCompanion: (sermon: Sermon) => void;
  onOpenAskMyPastor: (sermon: Sermon) => void;
}

export default function SermonNotesScreen({
  profile, onBack, onOpenSermonFollowUp, onOpenContinueSunday, onOpenSermonCompanion, onOpenAskMyPastor,
}: Props) {
  const [notes, setNotes] = useState<Array<SermonNote & { sermons: Sermon }>>([]);
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [passage, setPassage] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [title, setTitle] = useState('');
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [activeNote, setActiveNote] = useState<SermonNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [mainPoint, setMainPoint] = useState('');
  const [questions, setQuestions] = useState('');
  const [application, setApplication] = useState('');
  const [prayer, setPrayer] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, recent] = await Promise.all([
        getSermonNotes(profile.id),
        getRecentSermons(10),
      ]);
      setNotes(n);
      setRecentSermons(recent);
    } catch {
      setError('Could not load sermon notes.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreateSermon() {
    if (!passage.trim()) return;
    vibrate(15);
    setCreating(true);
    try {
      const sermon = await createSermon(
        passage.trim(),
        new Date(sermonDate).toISOString(),
        undefined,
        speaker.trim() || undefined,
        title.trim() || undefined,
      );
      if (sermon) {
        setPassage(''); setSpeaker(''); setTitle('');
        setShowCreate(false);
        await load();
        handleOpenSermon(sermon);
      }
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  }

  async function handleOpenSermon(sermon: Sermon) {
    vibrate(10);
    setActiveSermon(sermon);
    const existingNote = await getSermonNoteForSermon(sermon.id, profile.id);
    setActiveNote(existingNote);
    setNoteText(existingNote?.notes || '');
    setMainPoint(existingNote?.main_point || '');
    setQuestions(existingNote?.questions || '');
    setApplication(existingNote?.application || '');
    setPrayer(existingNote?.prayer || '');
  }

  async function handleSaveNote() {
    if (!activeSermon) return;
    vibrate(15);
    setSaving(true);
    try {
      if (activeNote) {
        await updateSermonNote(activeNote.id, {
          notes: noteText || null,
          main_point: mainPoint || null,
          questions: questions || null,
          application: application || null,
          prayer: prayer || null,
        });
      } else {
        await createSermonNote(
          profile.id, activeSermon.id,
          noteText || undefined, mainPoint || undefined,
          questions || undefined, application || undefined,
          prayer || undefined,
        );
      }
      await load();
      setActiveSermon(null);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  // Note editor view
  if (activeSermon) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setActiveSermon(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Sermon Notes</p><span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">{activeSermon.passage}</p>
              {activeSermon.title && <h2 className="font-serif text-2xl text-ivory-50">{activeSermon.title}</h2>}
              {activeSermon.speaker && <p className="text-ivory-500 text-sm mt-1">{activeSermon.speaker} · {formatDate(activeSermon.date)}</p>}
            </div>

            <div className="flex flex-col gap-4">
              <NoteField label="Notes" value={noteText} onChange={setNoteText} placeholder="What was taught?" minLines={4} />
              <NoteField label="Main Point" value={mainPoint} onChange={setMainPoint} placeholder="The central message" minLines={2} />
              <NoteField label="Questions" value={questions} onChange={setQuestions} placeholder="Questions you have" minLines={2} />
              <NoteField label="Application" value={application} onChange={setApplication} placeholder="How should this affect your life?" minLines={2} />
              <NoteField label="Prayer" value={prayer} onChange={setPrayer} placeholder="Your response to God" minLines={2} />
            </div>

            <button onClick={handleSaveNote} disabled={saving} className="btn-primary w-full mt-4 disabled:opacity-40">
              {saving ? 'Saving...' : 'Save Notes'}
            </button>

            {/* Follow-up actions */}
            <div className="gold-divider my-6" />
            <p className="ui-label mb-3">After the Sermon</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { vibrate(8); onOpenSermonFollowUp(activeSermon); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                <ArrowRight size={16} className="text-gold-300" />
                <div className="flex-1"><p className="text-ivory-100 text-sm font-medium">Sermon Follow-Up</p><p className="text-ivory-600 text-xs">What stood out? Read it again.</p></div>
                <ChevronRight size={14} className="text-ivory-600" />
              </button>
              <button onClick={() => { vibrate(8); onOpenSermonCompanion(activeSermon); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                <BookOpen size={16} className="text-gold-300" />
                <div className="flex-1"><p className="text-ivory-100 text-sm font-medium">Sermon Companion</p><p className="text-ivory-600 text-xs">Go deeper with verified RAG</p></div>
                <ChevronRight size={14} className="text-ivory-600" />
              </button>
              <button onClick={() => { vibrate(8); onOpenAskMyPastor(activeSermon); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                <User size={16} className="text-gold-300" />
                <div className="flex-1"><p className="text-ivory-100 text-sm font-medium">Ask My Pastor</p><p className="text-ivory-600 text-xs">Formulate thoughtful questions</p></div>
                <ChevronRight size={14} className="text-ivory-600" />
              </button>
              <button onClick={() => { vibrate(8); onOpenContinueSunday(); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                <Calendar size={16} className="text-gold-300" />
                <div className="flex-1"><p className="text-ivory-100 text-sm font-medium">Continue Sunday</p><p className="text-ivory-600 text-xs">Carry Sunday into the week</p></div>
                <ChevronRight size={14} className="text-ivory-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Sermon Notes</p>
        <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-ghost"><Plus size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Sermon Notes</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Private notes from Sunday's sermon.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && notes.length === 0 && (
            <EmptyState message="No sermon notes yet. Tap + to create one." />
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {notes.map((n) => (
                <button key={n.id} onClick={() => handleOpenSermon(n.sermons)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-ivory-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-100 font-medium text-sm font-serif">{n.sermons.passage}</p>
                    {n.sermons.title && <p className="text-ivory-500 text-xs">{n.sermons.title}</p>}
                    <p className="text-ivory-600 text-xs mt-0.5">{formatRelative(n.created_at)}</p>
                  </div>
                  <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <FileText size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Sermon notes are private by default. SOLAPATH does not automatically judge the pastor or sermon from limited notes.
            </p>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ivory-50">New Sermon</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Passage (e.g., John 15)" className="input-field" autoFocus />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sermon title (optional)" className="input-field" />
              <input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Speaker (optional)" className="input-field" />
              <input type="date" value={sermonDate} onChange={(e) => setSermonDate(e.target.value)} className="input-field" />
              <button onClick={handleCreateSermon} disabled={creating || !passage.trim()} className="btn-primary w-full disabled:opacity-40">
                <Plus size={16} /> {creating ? 'Creating...' : 'Create & Take Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteField({ label, value, onChange, placeholder, minLines = 2 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; minLines?: number }) {
  return (
    <div>
      <p className="ui-label mb-1.5">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field resize-none text-sm"
        style={{ minHeight: `${minLines * 40}px` }}
      />
    </div>
  );
}
