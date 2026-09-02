import { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Clock, ChevronRight, Info, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { recommendWalk, walkToInsert } from '@/lib/walkEngine';
import type { Walk, Profile, DailyCheckin } from '@/lib/types';
import { vibrate } from '@/lib/utils';

interface TodayScreenProps {
  profile: Profile | null;
  onStartWalk: (walk: Walk) => void;
  onReadInApp: (walk: Walk) => void;
}

const moods = [
  { id: 'joyful', label: 'Joyful', icon: '☀' },
  { id: 'steady', label: 'Steady', icon: '◐' },
  { id: 'weary', label: 'Weary', icon: '◌' },
  { id: 'heavy', label: 'Heavy', icon: '●' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen({ profile, onStartWalk, onReadInApp }: TodayScreenProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [todayWalk, setTodayWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [walkReason, setWalkReason] = useState<string | null>(null);

  const [showContext, setShowContext] = useState(false);
  const [contextText, setContextText] = useState('');
  const [rememberContext, setRememberContext] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadOrCreateTodayWalk();
  }, [profile?.id]);

  const [walkError, setWalkError] = useState<string | null>(null);

  async function loadOrCreateTodayWalk() {
    setLoading(true);
    setWalkError(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existing, error: existingErr } = await supabase
      .from('walks')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingErr) {
      setWalkError('Something went wrong loading your walk. Please try again.');
      setLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setTodayWalk(existing[0] as Walk);
      setLoading(false);
      return;
    }

    const { data: recentWalks } = await supabase
      .from('walks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const rec = await recommendWalk(profile, (recentWalks as Walk[]) || [], new Date(), contextText || null);
    setWalkReason(rec.reason);

    const { data: created, error: createErr } = await supabase
      .from('walks')
      .insert(walkToInsert(rec))
      .select('*')
      .single();

    if (createErr) {
      setWalkError('We couldn\'t create your walk for today. Please try again.');
      setLoading(false);
      return;
    }

    if (created) {
      setTodayWalk(created as Walk);
    }
    setLoading(false);
  }

  async function regenerateWalkWithContext(mood: string, context: string) {
    setRegenerating(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await supabase
      .from('walks')
      .delete()
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const { data: recentWalks } = await supabase
      .from('walks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const rec = await recommendWalk(profile, (recentWalks as Walk[]) || [], new Date(), context || null);
    setWalkReason(rec.reason);

    const { data: created, error: createErr } = await supabase
      .from('walks')
      .insert(walkToInsert(rec))
      .select('*')
      .single();

    if (createErr) {
      setWalkError('We couldn\'t create your walk for today. Please try again.');
      setRegenerating(false);
      return;
    }

    if (created) {
      setTodayWalk(created as Walk);
    }
    setRegenerating(false);
  }

  async function saveCheckin() {
    if (!selectedMood) return;
    vibrate(10);

    const checkin: Omit<DailyCheckin, 'id' | 'created_at'> = {
      mood: selectedMood,
      context_text: contextText.trim() || null,
      remember_context: rememberContext,
    };

    await supabase.from('daily_checkins').insert(checkin);

    if (rememberContext && contextText.trim() && profile?.memory_enabled) {
      await supabase.from('memories').insert({
        category: 'life',
        content: contextText.trim(),
        source: 'checkin',
        active: true,
        user_confirmed: true,
        sensitivity: 'medium',
      });
    }

    setContextSaved(true);
    setTimeout(() => setShowContext(false), 800);

    if (contextText.trim()) {
      await regenerateWalkWithContext(selectedMood, contextText.trim());
    }
  }

  function handleStartWalk() {
    if (!todayWalk) return;
    vibrate(15);
    onStartWalk(todayWalk);
  }

  function handleReadInApp() {
    if (!todayWalk) return;
    vibrate(10);
    onReadInApp(todayWalk);
  }

  const greeting = getGreeting();
  const name = profile?.display_name;
  const availableTime = profile?.available_time_minutes ?? 7;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="px-6 pt-14 safe-top">
        <p className="ui-label animate-fade-in-down">{greeting}{name ? `, ${name}` : ''}</p>
      </header>

      <section className="px-6 mt-6 fade-stagger">
        <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-5">
          How are you arriving today?
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => {
                vibrate(8);
                setSelectedMood(mood.id);
                setContextText('');
                setContextSaved(false);
                setRememberContext(false);
              }}
              className={`mood-chip no-tap-highlight ${
                selectedMood === mood.id
                  ? 'bg-gold-500/10 border-gold-500/40'
                  : ''
              }`}
            >
              <span className={`text-lg ${selectedMood === mood.id ? 'text-gold-300' : 'text-ivory-500'}`}>
                {mood.icon}
              </span>
              <span className={`text-[11px] font-medium ${selectedMood === mood.id ? 'text-ivory-50' : 'text-ivory-400'}`}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {selectedMood && !showContext && !contextSaved && (
          <div className="mt-4 animate-fade-in-up">
            <textarea
              autoFocus
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="What's happening today?"
              className="input-field min-h-[80px] resize-none text-sm"
            />
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-ivory-600" />
                <button
                  onClick={() => {
                    vibrate(6);
                    setRememberContext(!rememberContext);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${
                    rememberContext ? 'bg-gold-500/40' : 'bg-ink-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${
                      rememberContext ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-ivory-600 text-xs">
                {rememberContext ? 'SOLAPATH will remember this.' : 'Just for today.'}
              </p>
              <div className="flex-1" />
              <button
                onClick={saveCheckin}
                disabled={!contextText.trim() || regenerating}
                className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-40"
              >
                {regenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Finding Scripture...
                  </span>
                ) : contextSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="px-6 mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-gold-400" />
          <p className="ui-label">Today's Walk</p>
        </div>

        {loading || regenerating ? (
          <div className="premium-card p-6 flex items-center gap-3">
            <Loader2 size={20} className="text-gold-400 animate-spin" />
            <p className="text-ivory-500 text-sm italic">
              {regenerating ? 'Finding Scripture for today...' : 'Loading your walk...'}
            </p>
          </div>
        ) : todayWalk ? (
          <div className="premium-card p-6 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold-500/5 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-gold-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Open Your Bible
                </p>
              </div>

              <h3 className="font-serif text-3xl text-ivory-50 mt-3 mb-1 tracking-tight">
                {todayWalk.passage_reference}
              </h3>

              <div className="flex items-center gap-1.5 text-ivory-500 text-sm mb-4">
                <Clock size={13} />
                <span>{todayWalk.estimated_minutes} minutes</span>
                {todayWalk.estimated_minutes !== availableTime && (
                  <span className="text-ivory-600 ml-1">· adapted to your time</span>
                )}
              </div>

              <p className="text-ivory-300 text-sm leading-relaxed mb-4">
                {todayWalk.reading_objective}
              </p>

              {walkReason && (
                <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                  <Info size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                  <p className="text-ivory-500 text-xs leading-relaxed">{walkReason}</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button onClick={handleStartWalk} className="btn-primary w-full">
                  <BookOpen size={18} />
                  I'm Opening My Bible
                </button>
                <button onClick={handleReadInApp} className="btn-secondary w-full">
                  Read In App
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : walkError ? (
          <div className="premium-card p-6 text-center">
            <p className="text-ivory-400 text-sm">{walkError}</p>
            <button onClick={() => loadOrCreateTodayWalk()} className="btn-secondary mt-3 text-sm">
              Try Again
            </button>
          </div>
        ) : (
          <div className="premium-card p-6 text-center">
            <p className="text-ivory-400 text-sm">No walk available right now.</p>
          </div>
        )}
      </section>

      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-start gap-3 px-1">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-gold-400/40 to-transparent shrink-0 mt-1" />
          <div>
            <p className="font-serif text-ivory-300 italic text-sm leading-relaxed">
              "The Bible is not merely to be read, but to be opened, pondered, and lived."
            </p>
            <p className="text-xs text-ivory-600 mt-1.5">— Development content</p>
          </div>
        </div>
      </section>
    </div>
  );
}
