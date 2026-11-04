import { useState, useEffect, useCallback } from 'react';
import { X, Plus, ChevronRight, BookOpen } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getChurchMembershipForChurch, getChurchStudies } from '@/lib/churchEngine';
import { createChurchStudy } from '@/lib/churchStudyEngine';
import ChurchStudyEditor from '@/components/church/ChurchStudyEditor';
import type { Profile } from '@/lib/types';
import type { ChurchStudy, ChurchStudyStatus } from '@/lib/togetherTypes';
import { isVerifiedChurchPublisher, VERIFIED_CHURCH_ROLE_LABELS } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  churchId: string | null;
  onBack: () => void;
}

type ScreenState = 'loading' | 'no_church' | 'denied' | 'error' | 'ready';

const SECTIONS: { status: ChurchStudyStatus; label: string; empty: string }[] = [
  { status: 'published', label: 'Published', empty: 'No published studies yet.' },
  { status: 'draft', label: 'Drafts', empty: 'No drafts. Create a study to start one.' },
  { status: 'archived', label: 'Archived', empty: 'No archived studies.' },
];

export default function ManageChurchStudiesScreen({ profile, churchId, onBack }: Props) {
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [studies, setStudies] = useState<ChurchStudy[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!churchId) {
      setScreenState('no_church');
      return;
    }
    setScreenState('loading');
    try {
      const membership = await getChurchMembershipForChurch(profile.id, churchId);
      const role = membership?.verified_church_role;
      if (!membership || !isVerifiedChurchPublisher(role)) {
        setScreenState('denied');
        return;
      }
      setRoleLabel(VERIFIED_CHURCH_ROLE_LABELS[role]);
      setStudies(await getChurchStudies(churchId));
      setScreenState('ready');
    } catch {
      setScreenState('error');
    }
  }, [profile.id, churchId]);

  useEffect(() => { load(); }, [load]);

  const activeStudy = studies.find((s) => s.id === activeStudyId) ?? null;

  function openCreate() {
    vibrate(8);
    setNewTitle('');
    setNewDescription('');
    setCreateError(null);
    setCreating(true);
  }

  async function handleCreate() {
    if (!churchId || !newTitle.trim() || saving) return;
    vibrate(15);
    setSaving(true);
    setCreateError(null);
    const created = await createChurchStudy(churchId, newTitle, newDescription || null);
    setSaving(false);
    if (!created) {
      setCreateError('Could not create this study. Please try again.');
      return;
    }
    setCreating(false);
    await load();
    setActiveStudyId(created.id);
  }

  if (activeStudy) {
    return (
      <ChurchStudyEditor
        key={activeStudy.id}
        study={activeStudy}
        onChanged={load}
        onClose={() => { setActiveStudyId(null); load(); }}
      />
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Close"><X size={20} /></button>
        <p className="ui-label">Church Studies</p>
        <button onClick={openCreate} disabled={screenState !== 'ready'} className="btn-ghost disabled:opacity-40" aria-label="New study">
          <Plus size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-ivory-50">Manage Church Studies</h2>
            {roleLabel && (
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                Signed in as Verified Church Publisher ({roleLabel}). Studies you publish appear to your church as CHURCH CONTENT.
              </p>
            )}
          </div>

          {screenState === 'loading' && <LoadingState message="Loading..." />}
          {screenState === 'error' && <ErrorState message="Could not load church studies." onRetry={load} />}
          {screenState === 'no_church' && <EmptyState message="Choose a church in My Church to manage its studies." />}
          {screenState === 'denied' && (
            <EmptyState message="Only Verified Church Publishers can manage this church's studies." />
          )}

          {screenState === 'ready' && (
            <div className="flex flex-col gap-6">
              {SECTIONS.map((section) => {
                const items = studies.filter((s) => s.status === section.status);
                return (
                  <section key={section.status}>
                    <p className="ui-label mb-3">{section.label} ({items.length})</p>
                    {items.length === 0 ? (
                      <p className="text-ivory-600 text-xs">{section.empty}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {items.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { vibrate(6); setActiveStudyId(s.id); }}
                            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all"
                          >
                            <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                              <BookOpen size={16} className="text-ivory-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-ivory-100 font-medium text-sm truncate">{s.title}</p>
                              <p className="text-ivory-600 text-xs">Updated {formatRelative(s.updated_at)}</p>
                            </div>
                            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-[70] bg-ink-950/90 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="premium-card p-6 max-w-sm w-full animate-fade-in-up">
            <h3 className="font-serif text-xl text-ivory-50 mb-4">New Church Study</h3>
            <div className="flex flex-col gap-3 mb-4">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Study title" className="input-field" />
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Short description (optional)" rows={3} className="input-field" />
            </div>
            <p className="text-ivory-600 text-xs leading-relaxed mb-4">New studies start as drafts. Members cannot see them until you publish.</p>
            {createError && <p className="text-error text-xs mb-3">{createError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(false)} disabled={saving} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={saving || !newTitle.trim()} className="btn-primary flex-1 text-sm disabled:opacity-40">
                {saving ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
