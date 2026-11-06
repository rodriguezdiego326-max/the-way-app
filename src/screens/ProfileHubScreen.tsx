import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Heart, Scroll, X, ChevronRight, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfileEditor from '@/components/ProfileEditor';
import { PrayersList, ReflectionsList, WalksList } from '@/components/WalkHistoryLists';
import type { Profile, LifeStage, LifeArea, GrowthArea, TheologicalDepth } from '@/lib/types';

interface ProfileHubScreenProps {
  profile: Profile;
  onBack: () => void;
  onProfileUpdate: () => void;
}

type HistoryKind = 'walks' | 'prayers' | 'reflections';

const depthLabels: Record<TheologicalDepth, string> = {
  simple: 'Simple',
  study: 'Study',
  deep_study: 'Deep Study',
};

const historyConfig: Record<HistoryKind, { title: string; icon: typeof BookOpen; empty: string; hint: string }> = {
  walks: {
    title: 'My Walks',
    icon: BookOpen,
    empty: 'No walks yet.',
    hint: 'Start from Today or Bible to begin your first walk.',
  },
  prayers: {
    title: 'My Prayers',
    icon: Heart,
    empty: 'No prayers yet.',
    hint: 'Bring your requests before God from the Prayer tab.',
  },
  reflections: {
    title: 'My Reflections',
    icon: Scroll,
    empty: 'No reflections yet.',
    hint: 'Your reflections from Bible walks will appear here.',
  },
};

export default function ProfileHubScreen({ profile, onBack, onProfileUpdate }: ProfileHubScreenProps) {
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<HistoryKind | null>(null);
  const [walkCount, setWalkCount] = useState(0);
  const [prayerCount, setPrayerCount] = useState(0);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [stages, setStages] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);

  const loadStats = useCallback(async () => {
    const [walksRes, prayersRes, reflectionsRes, stagesRes, areasRes, growthRes] = await Promise.all([
      supabase.from('walks').select('id', { count: 'exact', head: true }),
      supabase.from('prayers').select('id', { count: 'exact', head: true }),
      supabase.from('walk_reflections').select('id', { count: 'exact', head: true }),
      supabase.from('life_stages').select('stage').eq('profile_id', profile.id),
      supabase.from('life_areas').select('area').eq('profile_id', profile.id),
      supabase.from('growth_areas').select('area').eq('profile_id', profile.id),
    ]);
    setWalkCount(walksRes.count || 0);
    setPrayerCount(prayersRes.count || 0);
    setReflectionCount(reflectionsRes.count || 0);
    setStages(((stagesRes.data as LifeStage[]) || []).map((s) => s.stage));
    setAreas(((areasRes.data as LifeArea[]) || []).map((a) => a.area));
    setGrowthAreas(((growthRes.data as GrowthArea[]) || []).map((g) => g.area));
  }, [profile.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats, profile]);

  if (editing) {
    return (
      <ProfileEditor
        profile={profile}
        onClose={() => setEditing(false)}
        onSaved={onProfileUpdate}
      />
    );
  }

  if (history) {
    const config = historyConfig[history];
    const count = history === 'walks' ? walkCount : history === 'prayers' ? prayerCount : reflectionCount;
    const Icon = config.icon;
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setHistory(null)} className="btn-ghost" aria-label="Back to profile">
            <X size={20} />
          </button>
          <p className="ui-label">{config.title}</p>
          <span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {count === 0 ? (
            <div className="premium-card p-6 text-center">
              <Icon size={24} className="text-gold-300 mx-auto mb-4" />
              <p className="text-ivory-400 text-sm">{config.empty}</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">{config.hint}</p>
            </div>
          ) : history === 'walks' ? (
            <WalksList />
          ) : history === 'prayers' ? (
            <PrayersList />
          ) : (
            <ReflectionsList />
          )}
        </div>
      </div>
    );
  }

  const initial = (profile.display_name || 'S').charAt(0).toUpperCase();
  const historyStats: { kind: HistoryKind; icon: typeof BookOpen; value: number; label: string }[] = [
    { kind: 'walks', icon: BookOpen, value: walkCount, label: 'Walks' },
    { kind: 'prayers', icon: Heart, value: prayerCount, label: 'Prayers' },
    { kind: 'reflections', icon: Scroll, value: reflectionCount, label: 'Reflections' },
  ];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen nav-safe-padding">
      <header className="px-6 pt-14 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="btn-ghost" aria-label="Close profile">
            <X size={20} />
          </button>
          <p className="ui-label">Profile</p>
          <span className="w-10" />
        </div>

        <div className="mt-6 flex items-center gap-4 animate-fade-in-up">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold-200 bg-gold-100 font-serif text-2xl text-ink-950 shadow-sm"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl text-ivory-50 tracking-tight truncate">
              {profile.display_name || 'Your Walk'}
            </h1>
            {profile.season && <p className="text-ivory-500 text-sm mt-1">{profile.season}</p>}
          </div>
        </div>
      </header>

      <section className="px-6 mt-8 animate-fade-in-up">
        <button
          onClick={() => setEditing(true)}
          className="premium-card p-4 w-full flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
            <Pencil size={16} className="text-gold-300" />
          </div>
          <div className="flex-1">
            <p className="text-ivory-100 font-medium text-sm">Edit Profile</p>
            <p className="text-ivory-600 text-xs">Name · Season · Study · Time · Translation</p>
          </div>
          <ChevronRight size={16} className="text-ivory-600 shrink-0" />
        </button>
      </section>

      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <p className="ui-label mb-3">My Walk</p>
        <div className="grid grid-cols-3 gap-3">
          {historyStats.map((stat) => (
            <button
              key={stat.kind}
              type="button"
              onClick={() => setHistory(stat.kind)}
              className="premium-card p-4 text-center no-tap-highlight hover:border-gold-500/30 transition-all duration-300"
            >
              <stat.icon size={18} className="text-gold-300 mx-auto mb-2" />
              <p className="font-serif text-2xl text-ivory-50">{stat.value}</p>
              <p className="text-ivory-600 text-[11px] mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>
        <p className="text-ivory-600 text-xs mt-3 text-center italic">
          These are not a score. They are gentle reminders of God's faithfulness in your life.
        </p>
      </section>

      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <p className="ui-label mb-3">Life & Faith Profile</p>
        <div className="premium-card p-5">
          {stages.length > 0 && (
            <div className="mb-3">
              <p className="text-ivory-600 text-xs mb-1">Life Stage</p>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-ink-700/50 text-ivory-300 text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
          {areas.length > 0 && (
            <div className="mb-3">
              <p className="text-ivory-600 text-xs mb-1">Life Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="px-2.5 py-1 rounded-lg bg-ink-700/50 text-ivory-300 text-xs">{a}</span>
                ))}
              </div>
            </div>
          )}
          {growthAreas.length > 0 && (
            <div className="mb-3">
              <p className="text-ivory-600 text-xs mb-1">Growth Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {growthAreas.map((g) => (
                  <span key={g} className="px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-200 text-xs">{g}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-ivory-500 mt-3 pt-3 border-t border-ink-700/40">
            <span>Depth: {depthLabels[profile.theological_depth || 'simple']}</span>
            <span>·</span>
            <span>Time: {profile.available_time_minutes || 7} min</span>
            <span>·</span>
            <span>{profile.preferred_translation || 'ESV'}</span>
            {profile.current_study && (
              <>
                <span>·</span>
                <span>Studying: {profile.current_study}</span>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
