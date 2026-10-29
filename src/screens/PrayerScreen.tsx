import { useEffect, useState } from 'react';
import { Plus, Check, X, ChevronRight, Heart, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { createLegacyEvent } from '@/lib/legacyEngine';
import PrayerDetailScreen from '@/screens/PrayerDetailScreen';
import { formatPrayerDate, getPrayerCopy, getPrayerLang } from '@/lib/prayerCopy';
import type { Prayer, PrayerSession, PrayerStatus, Profile } from '@/lib/types';

type Tab = 'active' | 'faithfulness';

const statusConfig: Record<PrayerStatus, { color: string; bg: string; border: string }> = {
  praying: { color: 'text-gold-300', bg: 'bg-gold-500/10', border: 'border-gold-500/30' },
  waiting: { color: 'text-ivory-300', bg: 'bg-ink-700/50', border: 'border-ink-600/40' },
  answered: { color: 'text-sage-400', bg: 'bg-sage-500/10', border: 'border-sage-500/30' },
  closed: { color: 'text-ivory-500', bg: 'bg-ink-800/40', border: 'border-ink-700/40' },
};

export default function PrayerScreen({ profile }: { profile?: Profile | null }) {
  const lang = getPrayerLang();
  const copy = getPrayerCopy(lang);
  const [tab, setTab] = useState<Tab>('active');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [updateCounts, setUpdateCounts] = useState<Record<string, number>>({});
  const [lastPrayedAt, setLastPrayedAt] = useState<Record<string, string>>({});

  // New prayer form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scripture, setScripture] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadPrayers();
  }, []);

  async function loadPrayers() {
    setLoading(true);
    const { data } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });

    const prayerList = (data as Prayer[]) || [];
    setPrayers(prayerList);
    setLoading(false);

    if (prayerList.length > 0) {
      const [{ data: updatesData }, { data: sessionsData }] = await Promise.all([
        supabase.from('prayer_updates').select('prayer_id'),
        supabase.from('prayer_sessions').select('prayer_id, prayed_at'),
      ]);

      const counts: Record<string, number> = {};
      for (const row of (updatesData as { prayer_id: string }[]) || []) {
        counts[row.prayer_id] = (counts[row.prayer_id] || 0) + 1;
      }
      setUpdateCounts(counts);

      const lastPrayed: Record<string, string> = {};
      for (const row of (sessionsData as Pick<PrayerSession, 'prayer_id' | 'prayed_at'>[]) || []) {
        const current = lastPrayed[row.prayer_id];
        if (!current || row.prayed_at > current) lastPrayed[row.prayer_id] = row.prayed_at;
      }
      setLastPrayedAt(lastPrayed);
    }
  }

  async function createPrayer() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    vibrate(12);

    const { data, error } = await supabase
      .from('prayers')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        related_scripture: scripture.trim() || null,
        status: 'praying',
      })
      .select('*')
      .single();

    setSaving(false);

    if (error || !data) {
      setSaveError(copy.saveErrorNew);
      return;
    }

    setPrayers((prev) => [data as Prayer, ...prev]);

    // Fire-and-forget Legacy event — failure must not affect prayer save
    const prayerId = (data as Prayer).id;
    const uid = (data as Prayer).user_id || profile?.id || '';
    if (uid) {
      createLegacyEvent(uid, 'prayer', title.trim(), new Date().toISOString(), 'user_created', {
        prayerId,
        summary: description.trim() || undefined,
        scriptureReferences: scripture.trim() ? [scripture.trim()] : undefined,
      }).catch(() => {});
    }

    setTitle('');
    setDescription('');
    setScripture('');
    setSaveError(null);
    setShowNew(false);
  }

  function openPrayer(prayer: Prayer) {
    vibrate(8);
    setSelectedPrayer(prayer);
  }

  function handlePrayerChanged(updated: Prayer) {
    setPrayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  // Prayer detail — full-screen overlay
  if (selectedPrayer) {
    return (
      <PrayerDetailScreen
        prayer={selectedPrayer}
        profile={profile ?? null}
        onClose={() => setSelectedPrayer(null)}
        onPrayerChanged={handlePrayerChanged}
      />
    );
  }

  // New prayer form — full-screen overlay so it covers BottomNav
  if (showNew) {
    return (
      <div className="fixed inset-0 z-[60] bg-ink-950 bg-parchment flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowNew(false)} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">{copy.newPrayer}</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in min-h-0">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">{copy.titleLabel}</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.titlePlaceholder}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">{copy.descriptionLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={copy.descriptionPlaceholder}
                className="input-field min-h-[120px] resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">{copy.scriptureLabel}</label>
              <input
                type="text"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                placeholder={copy.scripturePlaceholder}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 safe-bottom shrink-0">
          {saveError && (
            <p className="text-error text-sm mb-3 text-center">{saveError}</p>
          )}
          <button onClick={createPrayer} disabled={!title.trim() || saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? copy.saving : copy.beginPraying}
          </button>
        </div>
      </div>
    );
  }

  // Main prayer list
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen nav-safe-padding">
      <header className="px-6 pt-14 safe-top">
        <p className="ui-label animate-fade-in-down">{copy.prayerLabel}</p>
        <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">{copy.pageTitle}</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 mt-6 flex gap-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all no-tap-highlight ${
            tab === 'active' ? 'bg-ink-800/60 text-ivory-50 border border-ink-600/40' : 'text-ivory-500'
          }`}
        >
          {copy.tabActive}
        </button>
        <button
          onClick={() => setTab('faithfulness')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all no-tap-highlight ${
            tab === 'faithfulness' ? 'bg-ink-800/60 text-ivory-50 border border-ink-600/40' : 'text-ivory-500'
          }`}
        >
          {copy.tabFaithfulness}
        </button>
      </div>

      {tab === 'active' && (
        <div className="px-6 mt-6">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="premium-card h-24 animate-pulse" />
              ))}
            </div>
          ) : prayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
                <Heart size={24} className="text-gold-300" />
              </div>
              <h3 className="font-serif text-2xl text-ivory-50 mb-2">{copy.noPrayersTitle}</h3>
              <p className="text-ivory-500 text-sm max-w-xs leading-relaxed mb-6">
                {copy.noPrayersBody}
              </p>
              <button onClick={() => setShowNew(true)} className="btn-primary">
                <Plus size={18} />
                {copy.beginPrayer}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 fade-stagger">
                {prayers.map((prayer) => {
                  const cfg = statusConfig[prayer.status];
                  const count = updateCounts[prayer.id] || 0;
                  const lastPrayed = lastPrayedAt[prayer.id];
                  const isActive = prayer.status === 'praying' || prayer.status === 'waiting';
                  return (
                    <button
                      key={prayer.id}
                      onClick={() => openPrayer(prayer)}
                      className="premium-card p-5 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-serif text-xl text-ivory-50 tracking-tight">{prayer.title}</h3>
                        <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-[11px] font-medium`}>
                          {copy.status[prayer.status]}
                        </span>
                        {prayer.related_scripture && (
                          <span className="text-gold-300/70 text-xs flex items-center gap-1">
                            <BookOpen size={11} />
                            {prayer.related_scripture}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <span className="text-ivory-600 text-xs">
                          {lastPrayed
                            ? copy.lastPrayed(formatPrayerDate(lastPrayed, lang))
                            : copy.started(formatPrayerDate(prayer.started_at, lang))}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1.5 text-gold-300 text-xs font-medium">
                            <Heart size={11} />
                            {copy.pray}
                          </span>
                        )}
                      </div>
                      {count > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-400/50" />
                          <span className="text-ivory-600 text-xs">{copy.updateCount(count)}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowNew(true)} className="btn-secondary w-full mt-4">
                <Plus size={18} />
                {copy.addPrayer}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'faithfulness' && (
        <div className="px-6 mt-6 animate-fade-in">
          <div className="premium-card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center mx-auto mb-5">
              <Check size={24} className="text-sage-400" />
            </div>
            <h3 className="font-serif text-2xl text-ivory-50 mb-3">{copy.faithfulnessTitle}</h3>
            <p className="text-ivory-400 text-sm leading-relaxed max-w-xs mx-auto mb-4">
              {copy.faithfulnessBody}
            </p>
            <p className="text-ivory-600 text-xs italic">
              {copy.faithfulnessNote}
            </p>
          </div>

          {prayers.filter((p) => p.status === 'answered').length > 0 && (
            <div className="mt-6">
              <p className="ui-label mb-3">{copy.answeredPrayers}</p>
              <div className="flex flex-col gap-3">
                {prayers.filter((p) => p.status === 'answered').map((p) => (
                  <div key={p.id} className="premium-card p-4">
                    <h4 className="font-serif text-lg text-ivory-50">{p.title}</h4>
                    <p className="text-sage-400 text-xs mt-1">{copy.answeredOn(formatPrayerDate(p.closed_at || p.updated_at, lang))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
