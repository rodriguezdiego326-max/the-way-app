import { useState, useEffect, useCallback } from 'react';
import { X, BookHeart, Heart, BookOpen, Clock, Church, Users, Mail, Award, Archive, Search, Plus, ChevronRight, Sparkles, Scroll } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getLegacyStats } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenJourney: () => void;
  onOpenSeasons: () => void;
  onOpenFaithfulness: () => void;
  onOpenPrayerHistory: () => void;
  onOpenScripture: () => void;
  onOpenTestimony: () => void;
  onOpenFamilyLegacy: () => void;
  onOpenLetters: () => void;
  onOpenMilestones: () => void;
  onOpenVault: () => void;
  onOpenYearReview: () => void;
  onOpenSearch: () => void;
  onOpenBuildLegacy: () => void;
}

export default function LegacyHomeScreen({
  profile, onBack, onOpenJourney, onOpenSeasons, onOpenFaithfulness,
  onOpenPrayerHistory, onOpenScripture, onOpenTestimony, onOpenFamilyLegacy,
  onOpenLetters, onOpenMilestones, onOpenVault, onOpenYearReview, onOpenSearch,
  onOpenBuildLegacy,
}: Props) {
  const [stats, setStats] = useState<{
    totalEvents: number; totalSeasons: number; totalPrayers: number;
    totalScripture: number; totalLetters: number; totalMilestones: number;
    vaultCount: number; thisYearEvents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getLegacyStats(profile.id);
      setStats(s);
    } catch {
      setError('Could not load your Legacy.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { icon: Clock, label: 'This Year', desc: `${stats?.thisYearEvents ?? 0} entries`, onClick: onOpenYearReview },
    { icon: Heart, label: 'Prayers', desc: `${stats?.totalPrayers ?? 0} recorded`, onClick: onOpenPrayerHistory },
    { icon: BookOpen, label: 'Scripture', desc: `${stats?.totalScripture ?? 0} passages`, onClick: onOpenScripture },
    { icon: Clock, label: 'Seasons', desc: `${stats?.totalSeasons ?? 0} life seasons`, onClick: onOpenSeasons },
    { icon: Users, label: 'Family', desc: 'Parent-controlled', onClick: onOpenFamilyLegacy },
    { icon: Scroll, label: 'Testimony', desc: 'Your story', onClick: onOpenTestimony },
    { icon: Mail, label: 'Letters', desc: `${stats?.totalLetters ?? 0} written`, onClick: onOpenLetters },
    { icon: Award, label: 'Milestones', desc: `${stats?.totalMilestones ?? 0} recorded`, onClick: onOpenMilestones },
    { icon: Archive, label: 'Legacy Vault', desc: `${stats?.vaultCount ?? 0} items`, onClick: onOpenVault },
    { icon: Sparkles, label: 'Build My Legacy', desc: 'Add a record', onClick: onOpenBuildLegacy },
  ];

  const isEmpty = stats !== null && stats.totalEvents === 0 && stats.totalSeasons === 0 &&
    stats.totalScripture === 0 && stats.totalLetters === 0 && stats.totalMilestones === 0;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Legacy</p>
        <button onClick={() => { vibrate(8); onOpenSearch(); }} className="btn-ghost"><Search size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookHeart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">YOUR STORY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Remember God's faithfulness. Pass the story forward.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading your Legacy..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && isEmpty && (
            <div className="premium-card p-8 text-center mb-4">
              <BookHeart size={32} className="text-gold-400/40 mx-auto mb-3" />
              <p className="text-ivory-300 text-sm leading-relaxed">Your Legacy begins with what you choose to remember.</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Not a score. Not a streak. A record of where you've been.</p>
              <button onClick={() => { vibrate(10); onOpenBuildLegacy(); }} className="btn-primary mt-5">
                <Plus size={16} /> Add Your First Record
              </button>
            </div>
          )}

          {!loading && !error && !isEmpty && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {cards.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => { vibrate(8); card.onClick(); }}
                    className="premium-card p-4 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center mb-2">
                      <card.icon size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                    </div>
                    <p className="text-ivory-100 font-medium text-sm">{card.label}</p>
                    <p className="text-ivory-600 text-xs mt-0.5">{card.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { vibrate(8); onOpenJourney(); }}
                className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group w-full mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                  <Clock size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-ivory-100 font-medium text-sm">My Journey</p>
                  <p className="text-ivory-600 text-xs">{stats?.totalEvents ?? 0} records in your timeline</p>
                </div>
                <ChevronRight size={16} className="text-ivory-600 shrink-0" />
              </button>

              <button
                onClick={() => { vibrate(8); onOpenFaithfulness(); }}
                className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group w-full mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
                  <Heart size={17} className="text-sage-400" />
                </div>
                <div className="flex-1">
                  <p className="text-ivory-100 font-medium text-sm">God's Faithfulness</p>
                  <p className="text-ivory-600 text-xs">Remember what He has done</p>
                </div>
                <ChevronRight size={16} className="text-ivory-600 shrink-0" />
              </button>
            </>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Legacy is a record of your own journey. AI helps organize it. AI does not author a fictional spiritual autobiography.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
