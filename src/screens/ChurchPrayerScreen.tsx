import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Heart, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getMyChurchMembership, getChurch, getChurchPrayerItems, createChurchPrayerItem, updateChurchPrayerItem, deleteChurchPrayerItem, isChurchOwner } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { ChurchPrayerItem } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  activeChurchId: string | null;
  onBack: () => void;
}

export default function ChurchPrayerScreen({ profile, activeChurchId, onBack }: Props) {
  const [items, setItems] = useState<ChurchPrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ChurchPrayerItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<ChurchPrayerItem | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const requestVersionRef = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersionRef.current;
    setLoading(true);
    setError(null);
    setItems([]);
    setIsOwner(false);
    setChurchId(null);
    try {
      let cid = activeChurchId;
      if (!cid) {
        const membership = await getMyChurchMembership(profile.id);
        cid = membership?.church_id || null;
      }
      if (!cid) {
        setLoading(false);
        return;
      }
      if (version !== requestVersionRef.current) return;
      setChurchId(cid);
      const church = await getChurch(cid);
      if (version !== requestVersionRef.current) return;
      if (church) {
        const prays = await getChurchPrayerItems(church.id);
        if (version !== requestVersionRef.current) return;
        setItems(prays);
        const owner = await isChurchOwner(profile.id, church.id);
        if (version !== requestVersionRef.current) return;
        setIsOwner(owner);
      }
    } catch {
      if (version !== requestVersionRef.current) return;
      setError('Could not load church prayer items.');
    } finally {
      if (version === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [profile.id, activeChurchId]);

  useEffect(() => { load(); }, [load]);

  async function handleAddItem() {
    if (!newTitle.trim() || saving || !churchId) return;
    setSaving(true);
    setSaveError(null);
    vibrate(10);

    const item = await createChurchPrayerItem(churchId, newTitle.trim(), newDescription.trim() || undefined, newCategory.trim() || undefined);

    setSaving(false);

    if (!item) {
      setSaveError('Could not create prayer item. You may not have permission.');
      return;
    }

    setItems((prev) => [item, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('general');
    setSaveError(null);
    setShowAdd(false);
  }

  function startEdit(item: ChurchPrayerItem) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditCategory(item.category);
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editingItem || !editTitle.trim() || editSaving) return;
    setEditSaving(true);
    setEditError(null);
    vibrate(10);

    const updated = await updateChurchPrayerItem(editingItem.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      category: editCategory.trim(),
    });

    setEditSaving(false);

    if (!updated) {
      setEditError('Could not update prayer item. You may not have permission.');
      return;
    }

    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setEditingItem(null);
  }

  async function handleDelete() {
    if (!deletingItem || deleteSaving) return;
    setDeleteSaving(true);
    vibrate(10);

    const success = await deleteChurchPrayerItem(deletingItem.id);

    setDeleteSaving(false);

    if (!success) {
      setDeletingItem(null);
      return;
    }

    setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
    setDeletingItem(null);
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Church Prayer</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Church Prayer</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Church-managed prayer items. Your private prayers remain opt-in.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showAdd && !editingItem && !deletingItem && (
            <>
              {items.length === 0 ? (
                <>
                  <EmptyState message="No church prayer items available yet." />
                  {isOwner && (
                    <button onClick={() => { vibrate(8); setShowAdd(true); }} className="btn-primary w-full mt-4">
                      <Plus size={18} /> Add Church Prayer
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="premium-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">{item.category}</span>
                          <span className="text-ivory-600 text-xs">{formatRelative(item.created_at)}</span>
                          {isOwner && (
                            <div className="flex items-center gap-1 ml-auto">
                              <button onClick={() => { vibrate(6); startEdit(item); }} className="btn-ghost text-xs" aria-label="Edit prayer item">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => { vibrate(6); setDeletingItem(item); }} className="btn-ghost text-xs hover:text-error" aria-label="Delete prayer item">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-ivory-100 font-medium text-sm">{item.title}</p>
                        {item.description && <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                  {isOwner && (
                    <button onClick={() => { vibrate(8); setShowAdd(true); }} className="btn-secondary w-full mt-4">
                      <Plus size={18} /> Add Church Prayer
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {showAdd && (
            <div className="premium-card p-5 space-y-4">
              <p className="ui-label">Add Church Prayer Item</p>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Prayer request title"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Description (optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details about this prayer request..."
                  className="input-field min-h-[100px] resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field">
                  <option value="general">General</option>
                  <option value="congregation">Congregation</option>
                  <option value="missions">Missions</option>
                  <option value="leadership">Leadership</option>
                  <option value="community">Community</option>
                  <option value="thanksgiving">Thanksgiving</option>
                </select>
              </div>
              {saveError && <p className="text-error text-sm text-center">{saveError}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={handleAddItem} disabled={!newTitle.trim() || saving} className="btn-primary flex-1 disabled:opacity-40">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setShowAdd(false); setSaveError(null); }} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {editingItem && (
            <div className="premium-card p-5 space-y-4">
              <p className="ui-label">Edit Church Prayer Item</p>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Prayer request title"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Details about this prayer request..."
                  className="input-field min-h-[100px] resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-field">
                  <option value="general">General</option>
                  <option value="congregation">Congregation</option>
                  <option value="missions">Missions</option>
                  <option value="leadership">Leadership</option>
                  <option value="community">Community</option>
                  <option value="thanksgiving">Thanksgiving</option>
                </select>
              </div>
              {editError && <p className="text-error text-sm text-center">{editError}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={handleEditSave} disabled={!editTitle.trim() || editSaving} className="btn-primary flex-1 disabled:opacity-40">
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setEditingItem(null); setEditError(null); }} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {deletingItem && (
            <div className="premium-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-error" />
                </div>
                <div>
                  <p className="text-ivory-100 font-medium text-sm">Delete this church prayer?</p>
                  <p className="text-ivory-500 text-xs mt-1 leading-relaxed">{deletingItem.title}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleDelete} disabled={deleteSaving} className="flex-1 px-4 py-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-sm font-medium disabled:opacity-40 transition-all hover:bg-error/25">
                  {deleteSaving ? 'Deleting...' : 'Delete'}
                </button>
                <button onClick={() => setDeletingItem(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
