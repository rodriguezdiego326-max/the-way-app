import { useState, useEffect, useRef, useCallback } from 'react';
import { X, BookOpen, Calendar, Plus, Pencil, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { createLegacyEvent } from '@/lib/legacyEngine';
import { formatPrayerDate, getPrayerCopy, getPrayerLang } from '@/lib/prayerCopy';
import { buildJourneyEvents, type PrayerUpdateRow, type UpdateType } from '@/lib/prayerJourney';
import PrayerEditor from '@/components/PrayerEditor';
import PrayerJourneyTimeline from '@/components/PrayerJourneyTimeline';
import PrayerMode from '@/components/PrayerMode';
import type { Prayer, PrayerSession, PrayerStatus, Profile } from '@/lib/types';

const statusConfig: Record<PrayerStatus, { color: string; bg: string; border: string }> = {
  praying: { color: 'text-gold-300', bg: 'bg-gold-500/10', border: 'border-gold-500/30' },
  waiting: { color: 'text-ivory-300', bg: 'bg-ink-700/50', border: 'border-ink-600/40' },
  answered: { color: 'text-sage-400', bg: 'bg-sage-500/10', border: 'border-sage-500/30' },
  closed: { color: 'text-ivory-500', bg: 'bg-ink-800/40', border: 'border-ink-700/40' },
};

const ACTIVE_STATUSES: PrayerStatus[] = ['praying', 'waiting'];
const RETURNED_NOTE_THRESHOLD = 3;

interface Props {
  prayer: Prayer;
  profile: Profile | null;
  onClose: () => void;
  onPrayerChanged: (prayer: Prayer) => void;
}

export default function PrayerDetailScreen({ prayer: initialPrayer, profile, onClose, onPrayerChanged }: Props) {
  const [prayer, setPrayer] = useState<Prayer>(initialPrayer);
  const [updates, setUpdates] = useState<PrayerUpdateRow[]>([]);
  const [sessions, setSessions] = useState<PrayerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<UpdateType>('update');
  const [editorText, setEditorText] = useState('');
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [saving, setSaving] = useState(false);
  const [showPrayerEditor, setShowPrayerEditor] = useState(false);
  const [showPrayerMode, setShowPrayerMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lang = getPrayerLang();
  const copy = getPrayerCopy(lang);

  const loadJourney = useCallback(async () => {
    setLoading(true);
    const [updatesResult, sessionsResult] = await Promise.all([
      supabase
        .from('prayer_updates')
        .select('*')
        .eq('prayer_id', initialPrayer.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('prayer_sessions')
        .select('*')
        .eq('prayer_id', initialPrayer.id)
        .order('prayed_at', { ascending: true }),
    ]);
    setUpdates((updatesResult.data as PrayerUpdateRow[]) || []);
    setSessions((sessionsResult.data as PrayerSession[]) || []);
    setLoading(false);
  }, [initialPrayer.id]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      setViewportHeight(vv.height);
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  async function changeStatus(status: PrayerStatus) {
    vibrate(10);
    const updates: Partial<Prayer> = { status };
    if (status === 'answered' || status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    await supabase.from('prayers').update(updates).eq('id', initialPrayer.id);

    const updated = { ...prayer, ...updates } as Prayer;
    setPrayer(updated);
    onPrayerChanged(updated);

    if (status === 'answered') {
      const uid = prayer.user_id || profile?.id || '';
      if (uid) {
        const { data: existing } = await supabase
          .from('legacy_events')
          .select('id')
          .eq('prayer_id', initialPrayer.id)
          .eq('event_type', 'answered_prayer')
          .maybeSingle();
        if (!existing) {
          createLegacyEvent(uid, 'answered_prayer', `Answered: ${prayer.title}`, new Date().toISOString(), 'user_created', {
            prayerId: initialPrayer.id,
            summary: prayer.description || undefined,
          }).catch(() => {});
        }
      }
    }
  }

  const [editorError, setEditorError] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  async function saveUpdate() {
    if (!editorText.trim() || saving) return;
    setSaving(true);
    setEditorError(null);
    vibrate(8);

    const userId = prayer.user_id || profile?.id || '';
    if (!userId) {
      setSaving(false);
      setEditorError(copy.identifyError);
      return;
    }

    if (editingRowId) {
      const { data, error: updateError } = await supabase
        .from('prayer_updates')
        .update({ body: editorText.trim() })
        .eq('id', editingRowId)
        .select('*')
        .single();

      setSaving(false);

      if (updateError || !data) {
        setEditorError(copy.saveError);
        return;
      }

      setUpdates((prev) => prev.map((u) => (u.id === editingRowId ? data as PrayerUpdateRow : u)));
    } else {
      const { data, error: insertError } = await supabase
        .from('prayer_updates')
        .insert({
          prayer_id: initialPrayer.id,
          body: editorText.trim(),
          update_type: editorType,
          user_id: userId,
        })
        .select('*')
        .single();

      setSaving(false);

      if (insertError || !data) {
        setEditorError(copy.saveError);
        return;
      }

      setUpdates((prev) => [...prev, data as PrayerUpdateRow]);
    }

    setEditorText('');
    setEditingRowId(null);
    setShowEditor(false);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }

  function openEditor(type: UpdateType) {
    setEditorType(type);
    setEditorText('');
    setEditorError(null);
    setEditingRowId(null);
    setShowEditor(true);
  }

  function openEditExisting(row: PrayerUpdateRow) {
    setEditorType(row.update_type || 'update');
    setEditorText(row.body);
    setEditorError(null);
    setEditingRowId(row.id);
    setShowEditor(true);
  }

  function editReflectionById(id: string) {
    const row = updates.find((u) => u.id === id);
    if (row) {
      vibrate(6);
      openEditExisting(row);
    }
  }

  const cfg = statusConfig[prayer.status];
  const isActive = ACTIVE_STATUSES.includes(prayer.status);
  const events = buildJourneyEvents(prayer, sessions, updates);

  return (
    <>
      {/* Prayer Journey — full-screen overlay */}
      <div
        className="fixed inset-0 z-[70] bg-ink-950 bg-parchment flex flex-col"
        style={{ height: `${viewportHeight}px` }}
      >
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={onClose} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">{copy.prayerLabel}</p>
          <span className="w-10" />
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in-up">
            <span className={`inline-block px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-xs font-medium mb-4`}>
              {copy.status[prayer.status]}
            </span>

            <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-3">
              {prayer.title}
            </h2>

            {prayer.description && (
              <p className="text-ivory-300 leading-relaxed mb-4 whitespace-pre-wrap">{prayer.description}</p>
            )}

            {prayer.related_scripture && (
              <div className="flex items-center gap-2 text-gold-300 text-sm mb-4">
                <BookOpen size={14} />
                <span className="font-serif italic">{prayer.related_scripture}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 text-ivory-600 text-xs mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={12} />
                <span>{copy.started(formatPrayerDate(prayer.started_at, lang))}</span>
              </div>
              <button onClick={() => { vibrate(6); setShowPrayerEditor(true); }} className="btn-ghost text-xs text-gold-300 flex items-center gap-1.5">
                <Pencil size={12} /> {copy.editPrayer}
              </button>
            </div>

            {isActive && (
              <button onClick={() => { vibrate(8); setShowPrayerMode(true); }} className="btn-primary w-full mb-6">
                <Heart size={16} /> {copy.pray}
              </button>
            )}

            <div className="gold-divider mb-6" />

            <p className="ui-label mb-4">{copy.journeyHeading}</p>

            {!loading && sessions.length >= RETURNED_NOTE_THRESHOLD && (
              <p className="text-ivory-400 text-sm italic mb-4">{copy.returnedSeveralTimes}</p>
            )}

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="premium-card h-20 animate-pulse" />
                ))}
              </div>
            ) : (
              <PrayerJourneyTimeline events={events} copy={copy} lang={lang} onEditReflection={editReflectionById} />
            )}

            <div className="flex flex-wrap gap-2 mt-6 mb-6">
              <button onClick={() => openEditor('update')} className="btn-secondary text-sm">
                <Plus size={15} /> {copy.addUpdate}
              </button>
              <button onClick={() => openEditor('reflection')} className="btn-secondary text-sm">
                <Plus size={15} /> {copy.addReflection}
              </button>
            </div>

            <div className="gold-divider mb-6" />

            <p className="ui-label mb-3">{copy.updateStatus}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(statusConfig) as PrayerStatus[]).map((s) => {
                const sc = statusConfig[s];
                const isCurrent = prayer.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                      isCurrent
                        ? `${sc.bg} ${sc.border} ${sc.color}`
                        : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
                    }`}
                  >
                    {copy.status[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Focused Reflection/Update Editor — full-screen above Prayer Journey */}
      {showEditor && (
        <div
          className="fixed inset-0 z-[80] bg-ink-950 bg-parchment flex flex-col"
          style={{ height: `${viewportHeight}px` }}
        >
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => { setShowEditor(false); setEditorError(null); setEditingRowId(null); }} className="btn-ghost text-sm">
              <X size={18} /> {copy.cancel}
            </button>
            <p className="ui-label">{editorType === 'reflection' ? copy.reflection : copy.update}</p>
            <button
              onClick={saveUpdate}
              disabled={!editorText.trim() || saving}
              className="btn-ghost text-sm text-gold-300 disabled:opacity-30"
            >
              {saving ? copy.saving : copy.save}
            </button>
          </header>

          <div className="shrink-0 px-6 pt-3 pb-2">
            <div className="flex gap-1 p-1 rounded-xl bg-ink-800/60 border border-ink-700/40">
              <button
                onClick={() => { vibrate(4); setEditorType('update'); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all no-tap-highlight ${
                  editorType === 'update' ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30' : 'text-ivory-500 border border-transparent'
                }`}
              >
                {copy.updateTab}
              </button>
              <button
                onClick={() => { vibrate(4); setEditorType('reflection'); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all no-tap-highlight ${
                  editorType === 'reflection' ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30' : 'text-ivory-500 border border-transparent'
                }`}
              >
                {copy.reflectionTab}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 px-6 pt-2 pb-2">
            <textarea
              autoFocus
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder={editorType === 'reflection' ? copy.reflectionPlaceholder : copy.updatePlaceholder}
              aria-label={editorType === 'reflection' ? copy.addReflectionLabel : copy.addUpdateLabel}
              className="w-full h-full bg-ink-800/40 border border-ink-600/30 rounded-2xl p-4 text-ivory-100 placeholder:text-ivory-600 text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto"
            />
          </div>

          {editorError && (
            <div className="shrink-0 px-6 pb-2">
              <p className="text-error text-sm text-center">{editorError}</p>
            </div>
          )}

          <div className="shrink-0 safe-bottom" />
        </div>
      )}

      {showPrayerMode && (
        <PrayerMode
          prayer={prayer}
          copy={copy}
          viewportHeight={viewportHeight}
          onClose={() => setShowPrayerMode(false)}
          onRecorded={(session) => {
            setSessions((prev) => [...prev, session]);
            setShowPrayerMode(false);
          }}
        />
      )}

      {showPrayerEditor && (
        <PrayerEditor
          prayer={prayer}
          copy={copy}
          viewportHeight={viewportHeight}
          onSaved={(saved) => {
            setPrayer(saved);
            onPrayerChanged(saved);
            setShowPrayerEditor(false);
          }}
          onCancel={() => setShowPrayerEditor(false)}
        />
      )}
    </>
  );
}
