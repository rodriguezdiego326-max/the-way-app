import { useState, useEffect, useCallback } from 'react';
import { X, Church, Plus, ChevronRight, Search, MapPin, Globe, BookOpen, Heart, Users, Sun, LogOut, Check } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  createChurch, searchChurches, joinChurch, getAllChurchMemberships, getChurch, updateChurch,
  leaveChurch, isChurchOwner,
  getChurchStudies, getChurchPrayerItems, getChurchGroups,
} from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { ChurchProfile, ChurchMembership, ChurchStudy, ChurchPrayerItem, ChurchGroup } from '@/lib/togetherTypes';
import { CHURCH_ROLES } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  activeChurchId: string | null;
  onActiveChurchChange: (churchId: string | null) => void;
  onBack: () => void;
  onOpenSundayMode: () => void;
  onOpenSermonNotes: () => void;
  onOpenChurchStudies: () => void;
  onOpenChurchPrayer: () => void;
  onOpenSmallGroups: () => void;
}

interface ChurchWithMeta {
  church: ChurchProfile;
  membership: ChurchMembership;
  isOwner: boolean;
  studies: ChurchStudy[];
  prayerItems: ChurchPrayerItem[];
  groups: ChurchGroup[];
}

export default function MyChurchScreen({
  profile, activeChurchId, onActiveChurchChange, onBack, onOpenSundayMode, onOpenSermonNotes, onOpenChurchStudies, onOpenChurchPrayer, onOpenSmallGroups,
}: Props) {
  const [memberships, setMemberships] = useState<ChurchWithMeta[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChurchProfile[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Regular Attender');
  const [creating, setCreating] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchCity, setNewChurchCity] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<ChurchWithMeta | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mems = await getAllChurchMemberships(profile.id);
      const enriched: ChurchWithMeta[] = [];
      for (const m of mems) {
        const c = await getChurch(m.church_id);
        if (!c) continue;
        const owner = await isChurchOwner(profile.id, c.id);
        const [studs, prays, grps] = await Promise.all([
          getChurchStudies(c.id),
          getChurchPrayerItems(c.id),
          getChurchGroups(c.id),
        ]);
        enriched.push({
          church: c,
          membership: m,
          isOwner: owner,
          studies: studs,
          prayerItems: prays,
          groups: grps,
        });
      }
      setMemberships(enriched);
      // Sync active church: use provided activeChurchId if it matches a membership, else first
      if (enriched.length > 0) {
        const matchIdx = enriched.findIndex((m) => m.church.id === activeChurchId);
        const newIdx = matchIdx >= 0 ? matchIdx : 0;
        setActiveIndex(newIdx);
        onActiveChurchChange(enriched[newIdx].church.id);
      } else {
        onActiveChurchChange(null);
      }
    } catch {
      setError('Could not load your church.');
    } finally {
      setLoading(false);
    }
  }, [profile.id, activeIndex]);

  useEffect(() => { load(); }, [load]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    vibrate(8);
    const results = await searchChurches(searchQuery.trim());
    setSearchResults(results);
  }

  async function handleJoin(churchId: string) {
    vibrate(15);
    try {
      const result = await joinChurch(profile, churchId, selectedRole);
      if (!result) {
        setError('Could not join church. Please try again.');
        return;
      }
      setShowJoin(false);
      setSearchQuery('');
      setSearchResults([]);
      await load();
    } catch {
      setError('Could not join church. Please try again.');
    }
  }

  async function handleCreateChurch() {
    if (!newChurchName.trim()) return;
    vibrate(15);
    setCreating(true);
    setError(null);
    try {
      const c = await createChurch(newChurchName.trim(), newChurchCity.trim() || undefined);
      if (!c) {
        setError('Could not create church. Please try again.');
        return;
      }
      const joined = await joinChurch(profile, c.id, selectedRole);
      if (!joined) {
        setError('Church created but could not join. Please try again.');
        return;
      }
      setNewChurchName(''); setNewChurchCity('');
      setShowJoin(false);
      await load();
    } catch (err) {
      console.error('[Church] create and join failed', {
        operation: 'create_and_join',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError('Could not create church. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditChurch() {
    if (!active || !editName.trim() || savingEdit) return;
    setSavingEdit(true);
    setEditError(null);
    const updated = await updateChurch(active.church.id, {
      name: editName.trim(),
      city: editCity.trim() || null,
      website: editWebsite.trim() || null,
    });
    setSavingEdit(false);
    if (!updated) {
      setEditError('Could not update church. You may not have permission.');
      return;
    }
    setShowEdit(false);
    await load();
  }

  function openEdit() {
    if (!active) return;
    setEditName(active.church.name);
    setEditCity(active.church.city || '');
    setEditWebsite(active.church.website || '');
    setEditError(null);
    setShowEdit(true);
  }

  async function handleLeaveChurch(m: ChurchWithMeta) {
    if (m.isOwner) return;
    setLeaving(true);
    const success = await leaveChurch(m.membership.id);
    setLeaving(false);
    setShowLeaveConfirm(null);
    if (!success) {
      setError('Could not leave church. Please try again.');
      return;
    }
    vibrate(15);
    await load();
  }

  const active = memberships[activeIndex];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">My Church</p>
        <button onClick={() => { vibrate(8); setShowJoin(true); }} className="btn-ghost"><Plus size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Church size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">My Church</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Strengthen your relationship with your local church.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && memberships.length === 0 && (
            <div className="premium-card p-6 text-center">
              <p className="text-ivory-400 text-sm">You haven't connected a church yet.</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Join your church to access studies, prayer items, and small groups.</p>
              <button onClick={() => { vibrate(10); setShowJoin(true); }} className="btn-primary mt-4">
                <Plus size={16} /> Join My Church
              </button>
            </div>
          )}

          {!loading && !error && memberships.length > 0 && active && (
            <>
              {/* Church switcher if multiple */}
              {memberships.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                  {memberships.map((m, i) => (
                    <button
                      key={m.membership.id}
                      onClick={() => { vibrate(6); setActiveIndex(i); onActiveChurchChange(m.church.id); }}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all no-tap-highlight ${
                        i === activeIndex
                          ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                          : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
                      }`}
                    >
                      {i === activeIndex && <Check size={10} className="inline mr-1" />}
                      {m.church.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Church info */}
              <div className="premium-card p-5 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl text-ivory-50">{active.church.name}</h3>
                  {active.isOwner && (
                    <button onClick={() => { vibrate(8); openEdit(); }} className="btn-ghost text-xs shrink-0">
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-ivory-500">
                  {active.church.city && <span className="flex items-center gap-1"><MapPin size={11} /> {active.church.city}</span>}
                  {active.church.website && <span className="flex items-center gap-1"><Globe size={11} /> {active.church.website}</span>}
                  <span>· Your role: {active.membership.personal_role}</span>
                </div>
              </div>

              {/* Privacy boundary */}
              <div className="premium-card p-4 mb-4 border-clay-500/20">
                <p className="text-ivory-200 text-xs font-medium">Privacy Boundary</p>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">Joining a church never gives church leaders access to your private Ask SOLAPATH conversations, memory, journal, prayers, Family, REACH, or accountability data.</p>
              </div>

              {/* Church features */}
              <p className="ui-label mb-3">Church Features</p>
              <div className="flex flex-col gap-2 mb-4">
                <ChurchActionCard icon={Sun} label="Sunday Mode" desc="Prepare your heart for worship" onClick={onOpenSundayMode} />
                <ChurchActionCard icon={BookOpen} label="Sermon Notes" desc={`${active.studies.length} studies available`} onClick={onOpenSermonNotes} />
                <ChurchActionCard icon={BookOpen} label="From My Church" desc={`${active.studies.length} church studies`} onClick={onOpenChurchStudies} />
                <ChurchActionCard icon={Heart} label="Church Prayer" desc={`${active.prayerItems.length} prayer items`} onClick={onOpenChurchPrayer} />
                <ChurchActionCard icon={Users} label="Small Groups" desc={`${active.groups.length} groups`} onClick={onOpenSmallGroups} />
              </div>

              {/* Leave church — blocked for owners */}
              {active.isOwner ? (
                <div className="premium-card p-4 mb-4 border-clay-500/20">
                  <p className="text-ivory-300 text-xs font-medium">Church Owner</p>
                  <p className="text-ivory-500 text-xs mt-1 leading-relaxed">You created this church. You cannot leave while you are the owner. The church profile must remain managed.</p>
                </div>
              ) : (
                <button
                  onClick={() => { vibrate(8); setShowLeaveConfirm(active); }}
                  className="btn-secondary w-full text-sm text-clay-400 mb-4"
                >
                  <LogOut size={14} /> Leave This Church
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Join church modal */}
      {showJoin && (
        <div className="fixed inset-0 z-[60] h-[100dvh] bg-ink-950 bg-parchment flex flex-col">
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => setShowJoin(false)} className="btn-ghost"><X size={20} /></button>
            <p className="ui-label">Join My Church</p>
            <span className="w-10" />
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 animate-fade-in">
            <p className="ui-label mb-2">Your Role</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CHURCH_ROLES.map((r) => (
                <button type="button" key={r} onClick={() => { vibrate(6); setSelectedRole(r); }} className={`px-3 py-2 rounded-xl border text-xs font-medium ${selectedRole === r ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>{r}</button>
              ))}
            </div>
            <p className="text-ivory-600 text-xs mb-4">Selecting "Pastor" does not grant privileged church administration rights.</p>

            <div className="flex gap-2 mb-4">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search churches..." className="input-field flex-1" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <button type="button" onClick={handleSearch} className="btn-secondary"><Search size={16} /></button>
            </div>

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {searchResults.map((c) => (
                  <button type="button" key={c.id} onClick={() => handleJoin(c.id)} className="premium-card p-3 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                    <Church size={14} className="text-ivory-400" />
                    <div className="flex-1">
                      <p className="text-ivory-200 text-sm">{c.name}</p>
                      {c.city && <p className="text-ivory-600 text-xs">{c.city}</p>}
                    </div>
                    <ChevronRight size={14} className="text-ivory-600" />
                  </button>
                ))}
              </div>
            )}

            <div className="gold-divider my-4" />
            <p className="ui-label mb-2">Create a New Church</p>
            <input value={newChurchName} onChange={(e) => setNewChurchName(e.target.value)} placeholder="Church name" className="input-field mb-2" />
            <input value={newChurchCity} onChange={(e) => setNewChurchCity(e.target.value)} placeholder="City (optional)" className="input-field mb-4" />
            {error && (
              <div className="premium-card p-3 mb-4 border-error/30">
                <p className="text-error text-xs">{error}</p>
              </div>
            )}
            <button type="button" onClick={handleCreateChurch} disabled={creating || !newChurchName.trim()} className="btn-primary w-full disabled:opacity-40 mb-8">
              <Plus size={16} /> {creating ? 'Creating...' : 'Create & Join'}
            </button>
          </div>
        </div>
      )}

      {/* Edit church modal */}
      {showEdit && active && (
        <div className="fixed inset-0 z-[70] h-[100dvh] bg-ink-950 bg-parchment flex flex-col">
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => setShowEdit(false)} className="btn-ghost"><X size={20} /></button>
            <p className="ui-label">Edit Church</p><span className="w-10" />
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 animate-fade-in">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Church Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Church name" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">City (optional)</label>
                <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Website (optional)</label>
                <input type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." className="input-field" />
              </div>
              {editError && <p className="text-error text-sm text-center">{editError}</p>}
              <button onClick={handleEditChurch} disabled={!editName.trim() || savingEdit} className="btn-primary w-full disabled:opacity-40">
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave church confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] bg-ink-950/90 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="premium-card p-6 max-w-sm w-full animate-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-clay-500/10 border border-clay-500/20 flex items-center justify-center mb-4">
              <LogOut size={20} className="text-clay-400" />
            </div>
            <h3 className="font-serif text-xl text-ivory-50 mb-2">Leave {showLeaveConfirm.church.name}?</h3>
            <p className="text-ivory-500 text-sm leading-relaxed mb-4">
              You will no longer have access to this church's studies, prayer items, and small groups. You can rejoin at any time.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(null)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleLeaveChurch(showLeaveConfirm)}
                disabled={leaving}
                className="btn-primary flex-1 text-sm disabled:opacity-40 text-clay-400"
              >
                {leaving ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChurchActionCard({ icon: Icon, label, desc, onClick }: { icon: typeof Church; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={() => { vibrate(8); onClick(); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
      <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-ivory-100 font-medium text-sm">{label}</p>
        <p className="text-ivory-600 text-xs">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-ivory-600 shrink-0" />
    </button>
  );
}
