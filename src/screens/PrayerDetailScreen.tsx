import { useState, useEffect, useRef, useCallback } from 'react';
import { X, BookOpen, Calendar, Plus, Clock, Check, Heart, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative, formatDate } from '@/lib/utils';
import { createLegacyEvent } from '@/lib/legacyEngine';
import type { Prayer, PrayerStatus, PrayerUpdate, Profile } from '@/lib/types';

const statusConfig: Record<PrayerStatus, { label: string; color: string; bg: string; border: string }> = {
  praying: { label: 'Praying', color: 'text-gold-300', bg: 'bg-gold-500/10', border: 'border-gold-500/30' },
  waiting: { label: 'Waiting', color: 'text-ivory-300', bg: 'bg-ink-700/50', border: 'border-ink-600/40' },
  answered: { label: 'Answered', color: 'text-sage-400', bg: 'bg-sage-500/10', border: 'border-sage-500/30' },
  closed: { label: 'Closed · Continuing to Trust', color: 'text-ivory-500', bg: 'bg-ink-800/40', border: 'border-ink-700/40' },
};

type UpdateType = 'update' | 'reflection';

interface PrayerUpdateRow extends PrayerUpdate {
  update_type?: UpdateType;
}

interface Props {
  prayer: Prayer;
  profile: Profile | null;
  onClose: () => void;
  onPrayerChanged: (prayer: Prayer) => void;
}

export default function PrayerDetailScreen({ prayer: initialPrayer, profile, onClose, onPrayerChanged }: Props) {
  const [prayer, setPrayer] = useState<Prayer>(initialPrayer);
  const [updates, setUpdates] = useState<PrayerUpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<UpdateType>('update');
  const [editorText, setEditorText] = useState('');
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadUpdates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prayer_updates')
      .select('*')
      .eq('prayer_id', initialPrayer.id)
      .order('created_at', { ascending: true });
    setUpdates((data as PrayerUpdateRow[]) || []);
    setLoading(false);
  }, [initialPrayer.id]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

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
      setEditorError('Could not identify user. Please try again.');
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
        setEditorError('Could not save. Please try again.');
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
        setEditorError('Could not save. Please try again.');
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

  const cfg = statusConfig[prayer.status];
  const reflectionUpdates = updates.filter((u) => (u.update_type || 'update') === 'reflection');
  const reflection = reflectionUpdates.length > 0 ? reflectionUpdates[reflectionUpdates.length - 1] : undefined;
  const otherUpdates = updates.filter((u) => (u.update_type || 'update') !== 'reflection');

  return (
    <>
      {/* Main Prayer Detail — full-screen overlay */}
      <div
        className="fixed inset-0 z-[70] bg-ink-950 bg-parchment flex flex-col"
        style={{ height: `${viewportHeight}px` }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={onClose} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Prayer</p>
          <span className="w-10" />
        </header>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in-up">
            {/* Status badge */}
            <span className={`inline-block px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-xs font-medium mb-4`}>
              {cfg.label}
            </span>

            {/* Title */}
            <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-3">
              {prayer.title}
            </h2>

            {/* Description */}
            {prayer.description && (
              <p className="text-ivory-300 leading-relaxed mb-4">{prayer.description}</p>
            )}

            {/* Scripture reference */}
            {prayer.related_scripture && (
              <div className="flex items-center gap-2 text-gold-300 text-sm mb-4">
                <BookOpen size={14} />
                <span className="font-serif italic">{prayer.related_scripture}</span>
              </div>
            )}

            {/* Date started */}
            <div className="flex items-center gap-2 text-ivory-600 text-xs mb-6">
              <Calendar size={12} />
              <span>Started {formatDate(prayer.started_at)}</span>
            </div>

            <div className="gold-divider mb-6" />

            {/* Update Status */}
            <p className="ui-label mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(statusConfig) as PrayerStatus[]).map((s) => {
                const sc = statusConfig[s];
                const isActive = prayer.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                      isActive
                        ? `${sc.bg} ${sc.border} ${sc.color}`
                        : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            <div className="gold-divider mb-6" />

            {/* How is God at work — display mode */}
            <p className="ui-label mb-3">How is God at work in this?</p>
            {reflection ? (
              <div className="premium-card p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={12} className="text-gold-400/70" />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-gold-400/70">Reflection</span>
                  <span className="text-ivory-600 text-xs ml-auto">{formatDate(reflection.created_at)}</span>
                </div>
                <p className="text-ivory-300 text-sm leading-relaxed">{reflection.body}</p>
                <button
                  onClick={() => { vibrate(6); openEditExisting(reflection); }}
                  className="btn-ghost text-xs mt-3"
                >
                  Edit Reflection
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <p className="text-ivory-600 text-sm italic mb-2">No reflection added yet.</p>
                <button onClick={() => { vibrate(6); openEditor('reflection'); }} className="btn-secondary text-sm">
                  <Plus size={15} /> Add Reflection
                </button>
              </div>
            )}

            <div className="gold-divider mb-6" />

            {/* Updates */}
            <div className="flex items-center justify-between mb-3">
              <p className="ui-label">Updates</p>
              {otherUpdates.length > 0 && (
                <span className="text-ivory-600 text-xs">{otherUpdates.length} {otherUpdates.length === 1 ? 'entry' : 'entries'}</span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="premium-card h-20 animate-pulse" />
                ))}
              </div>
            ) : otherUpdates.length === 0 ? (
              <p className="text-ivory-600 text-sm italic mb-6">No updates yet. Add one as you see God at work.</p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {otherUpdates.map((u) => (
                  <div key={u.id} className="premium-card p-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-ivory-500" />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-ivory-500">Update</span>
                      <span className="text-ivory-600 text-xs ml-auto">{formatDate(u.created_at)}</span>
                    </div>
                    <p className="text-ivory-300 text-sm leading-relaxed">{u.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Update button */}
            <button onClick={() => openEditor('update')} className="btn-secondary text-sm mb-4">
              <Plus size={15} /> Add Update
            </button>
          </div>
        </div>
      </div>

      {/* Focused Reflection/Update Editor — full-screen above Prayer Detail */}
      {showEditor && (
        <div
          className="fixed inset-0 z-[80] bg-ink-950 bg-parchment flex flex-col"
          style={{ height: `${viewportHeight}px` }}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => { setShowEditor(false); setEditorError(null); setEditingRowId(null); }} className="btn-ghost text-sm">
              <X size={18} /> Cancel
            </button>
            <p className="ui-label">{editorType === 'reflection' ? 'Reflection' : 'Update'}</p>
            <button
              onClick={saveUpdate}
              disabled={!editorText.trim() || saving}
              className="btn-ghost text-sm text-gold-300 disabled:opacity-30"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </header>

          {/* Segmented type selector */}
          <div className="shrink-0 px-6 pt-3 pb-2">
            <div className="flex gap-1 p-1 rounded-xl bg-ink-800/60 border border-ink-700/40">
              <button
                onClick={() => { vibrate(4); setEditorType('update'); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all no-tap-highlight ${
                  editorType === 'update' ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30' : 'text-ivory-500 border border-transparent'
                }`}
              >
                Update
              </button>
              <button
                onClick={() => { vibrate(4); setEditorType('reflection'); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all no-tap-highlight ${
                  editorType === 'reflection' ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30' : 'text-ivory-500 border border-transparent'
                }`}
              >
                Reflection
              </button>
            </div>
          </div>

          {/* Textarea — fills available space */}
          <div className="flex-1 min-h-0 px-6 pt-2 pb-2">
            <textarea
              autoFocus
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder={editorType === 'reflection' ? 'How is God at work in this?' : 'What is happening with this prayer?'}
              aria-label={editorType === 'reflection' ? 'Add a reflection' : 'Add an update'}
              className="w-full h-full bg-ink-800/40 border border-ink-600/30 rounded-2xl p-4 text-ivory-100 placeholder:text-ivory-600 text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto"
            />
          </div>

          {/* Error message */}
          {editorError && (
            <div className="shrink-0 px-6 pb-2">
              <p className="text-error text-sm text-center">{editorError}</p>
            </div>
          )}

          {/* Safe area */}
          <div className="shrink-0 safe-bottom" />
        </div>
      )}
    </>
  );
}
