import { useEffect, useState } from 'react';
import {
  X, Plus, Heart, BookOpen, Calendar, Check, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatDate, formatRelative } from '@/lib/utils';
import type { FamilyProfile, FamilyPrayer, FamilyPrayerUpdate } from '@/lib/familyTypes';

interface FamilyPrayerScreenProps {
  familyProfile: FamilyProfile | null;
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  praying: { label: 'Praying', color: 'text-gold-300', bg: 'bg-gold-500/10', border: 'border-gold-500/30' },
  waiting: { label: 'Waiting', color: 'text-ivory-300', bg: 'bg-ink-700/50', border: 'border-ink-600/40' },
  answered: { label: 'Answered', color: 'text-sage-400', bg: 'bg-sage-500/10', border: 'border-sage-500/30' },
  closed: { label: 'Closed', color: 'text-ivory-500', bg: 'bg-ink-800/40', border: 'border-ink-700/40' },
};

export default function FamilyPrayerScreen({ familyProfile, onBack }: FamilyPrayerScreenProps) {
  const [prayers, setPrayers] = useState<FamilyPrayer[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<FamilyPrayer | null>(null);
  const [updates, setUpdates] = useState<FamilyPrayerUpdate[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scripture, setScripture] = useState('');
  const [updateText, setUpdateText] = useState('');

  useEffect(() => {
    if (familyProfile) loadPrayers();
  }, [familyProfile]);

  async function loadPrayers() {
    if (!familyProfile) return;
    const { data } = await supabase
      .from('family_prayers')
      .select('*')
      .eq('family_profile_id', familyProfile.id)
      .order('created_at', { ascending: false });
    setPrayers((data as FamilyPrayer[]) || []);
  }

  async function createPrayer() {
    if (!title.trim() || !familyProfile) return;
    vibrate(12);
    const { data } = await supabase
      .from('family_prayers')
      .insert({
        family_profile_id: familyProfile.id,
        title: title.trim(),
        description: description.trim() || null,
        related_scripture: scripture.trim() || null,
        status: 'praying',
      })
      .select('*')
      .single();
    if (data) {
      setPrayers((prev) => [data as FamilyPrayer, ...prev]);
      setTitle('');
      setDescription('');
      setScripture('');
      setShowNew(false);
    }
  }

  async function openPrayer(prayer: FamilyPrayer) {
    vibrate(8);
    setSelectedPrayer(prayer);
    const { data } = await supabase
      .from('family_prayer_updates')
      .select('*')
      .eq('family_prayer_id', prayer.id)
      .order('created_at', { ascending: true });
    setUpdates((data as FamilyPrayerUpdate[]) || []);
  }

  async function addUpdate() {
    if (!updateText.trim() || !selectedPrayer) return;
    vibrate(8);
    const { data } = await supabase
      .from('family_prayer_updates')
      .insert({ family_prayer_id: selectedPrayer.id, body: updateText.trim() })
      .select('*')
      .single();
    if (data) {
      setUpdates((prev) => [...prev, data as FamilyPrayerUpdate]);
      setUpdateText('');
    }
  }

  async function changeStatus(prayer: FamilyPrayer, status: FamilyPrayer['status']) {
    vibrate(10);
    const updates: Partial<FamilyPrayer> = { status };
    if (status === 'answered' || status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }
    await supabase.from('family_prayers').update(updates).eq('id', prayer.id);
    const updated = { ...prayer, ...updates } as FamilyPrayer;
    setSelectedPrayer(updated);
    setPrayers((prev) => prev.map((p) => (p.id === prayer.id ? updated : p)));
  }

  // Prayer detail
  if (selectedPrayer) {
    const cfg = statusConfig[selectedPrayer.status];
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSelectedPrayer(null)} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Family Prayer</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in-up">
            <span className={`inline-block px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-xs font-medium mb-4`}>
              {cfg.label}
            </span>
            <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-3">{selectedPrayer.title}</h2>
            {selectedPrayer.description && (
              <p className="text-ivory-300 leading-relaxed mb-4">{selectedPrayer.description}</p>
            )}
            {selectedPrayer.related_scripture && (
              <div className="flex items-center gap-2 text-gold-300 text-sm mb-4">
                <BookOpen size={14} />
                <span className="font-serif italic">{selectedPrayer.related_scripture}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-ivory-600 text-xs mb-6">
              <Calendar size={12} />
              <span>Started {formatDate(selectedPrayer.started_at)}</span>
            </div>
            <div className="gold-divider mb-6" />

            <p className="ui-label mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(statusConfig) as FamilyPrayer['status'][]).map((s) => {
                const sc = statusConfig[s];
                const isActive = selectedPrayer.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStatus(selectedPrayer, s)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                      isActive ? `${sc.bg} ${sc.border} ${sc.color}` : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            <p className="ui-label mb-3">Updates & Reflections</p>
            {updates.length === 0 ? (
              <p className="text-ivory-600 text-sm italic">No updates yet. Add one as you see God at work.</p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {updates.map((u) => (
                  <div key={u.id} className="premium-card p-4 animate-fade-in">
                    <p className="text-ivory-300 text-sm leading-relaxed">{u.body}</p>
                    <p className="text-ivory-600 text-xs mt-2">{formatRelative(u.created_at)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUpdate()}
                placeholder="How is God at work in this?"
                className="input-field flex-1 text-sm"
              />
              <button onClick={addUpdate} disabled={!updateText.trim()} className="btn-primary px-4 disabled:opacity-40">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New prayer form
  if (showNew) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowNew(false)} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">New Family Prayer</p>
          <span className="w-10" />
        </header>
        <div className="flex-1 px-6 py-6 animate-fade-in">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Title</label>
              <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grandparent's health" className="input-field" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who or what are you praying for as a family?" className="input-field min-h-[120px] resize-none" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Related Scripture (optional)</label>
              <input type="text" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Philippians 4:6–7" className="input-field" />
            </div>
          </div>
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <button onClick={createPrayer} disabled={!title.trim()} className="btn-primary w-full disabled:opacity-40">
            <Heart size={18} />
            Begin Praying Together
          </button>
        </div>
      </div>
    );
  }

  // Main list
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-14 safe-top">
        <div>
          <p className="ui-label animate-fade-in-down">Family Prayer</p>
          <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">Pray Together</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-ghost">
          <Plus size={20} />
        </button>
      </header>

      <div className="px-6 mt-6">
        {prayers.length === 0 ? (
          <div className="premium-card p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <Heart size={24} className="text-gold-300" />
            </div>
            <p className="text-ivory-400 text-sm mb-2">No family prayers yet.</p>
            <p className="text-ivory-600 text-xs leading-relaxed">
              Create prayer threads for your family — a grandparent's health, a friend at school, a family decision, or thanksgiving.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {prayers.map((prayer) => {
              const cfg = statusConfig[prayer.status];
              return (
                <button
                  key={prayer.id}
                  onClick={() => openPrayer(prayer)}
                  className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-[10px] font-medium mb-2`}>
                        {cfg.label}
                      </span>
                      <p className="text-ivory-100 font-medium text-sm">{prayer.title}</p>
                      {prayer.related_scripture && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <BookOpen size={11} className="text-gold-400/60" />
                          <span className="text-ivory-500 text-xs italic">{prayer.related_scripture}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2 mt-5 px-1">
          <Check size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">
            Family prayer records are private. They are never exposed publicly or used for social discovery.
          </p>
        </div>
      </div>
    </div>
  );
}
