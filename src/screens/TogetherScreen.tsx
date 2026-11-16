import { useState, useEffect, useCallback } from 'react';
import { X, Users, Heart, BookOpen, CheckCircle, HandHeart, Shield, Plus, ChevronRight, Sparkles, KeyRound } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import PullToRefresh from '@/components/PullToRefresh';
import { getMyCircles } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle } from '@/lib/togetherTypes';
import { useLanguage } from '@/lib/i18n';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenCircle: (circle: Circle) => void;
  onOpenCreateCircle: () => void;
  onOpenJoinCircle: () => void;
  onOpenPrayer: (circle?: Circle) => void;
  onOpenScripture: (circle?: Circle) => void;
  onOpenCheckIn: (circle?: Circle) => void;
  onOpenEncouragement: () => void;
  onOpenAccountability: () => void;
}

export default function TogetherScreen({
  profile, onBack, onOpenCircle, onOpenCreateCircle, onOpenJoinCircle,
  onOpenPrayer, onOpenScripture, onOpenCheckIn, onOpenEncouragement,
  onOpenAccountability,
}: Props) {
  const { t } = useLanguage();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    setCircles(await getMyCircles(profile));
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchCircles();
    } catch {
      setError(t('Could not load your Together data.'));
    } finally {
      setLoading(false);
    }
  }, [fetchCircles, t]);

  useEffect(() => { load(); }, [load]);

  const primaryCards = [
    { icon: Heart, label: t('Prayer Together'), desc: t('Shared prayer requests'), onClick: () => onOpenPrayer() },
    { icon: BookOpen, label: t('Scripture Together'), desc: t('Read and reflect as a group'), onClick: () => onOpenScripture() },
    { icon: CheckCircle, label: t('Check In'), desc: t('How are you arriving?'), onClick: () => onOpenCheckIn() },
    { icon: HandHeart, label: t('Encouragement'), desc: t('Intentional, not social'), onClick: onOpenEncouragement },
    { icon: Shield, label: t('Accountability'), desc: t('Private · Opt-in'), onClick: onOpenAccountability },
  ];

  return (
    <div className="app-container bg-ink-950 bg-parchment h-[100dvh] flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">{t('Together')}</p><span className="w-10" />
      </header>

      <PullToRefresh onRefresh={fetchCircles} className="flex-1 min-h-0 nav-safe-padding px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">{t('TOGETHER')}</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">{t('You were never meant to walk alone.')}</p>
            </div>
          </div>

          {loading && <LoadingState message={t('Loading your circles...')} />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              <p className="ui-label mb-3">{t('My Circles')}</p>
              {circles.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">{t("You haven't joined any Circles yet.")}</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">{t('Create a private Circle for your marriage, small group, Bible study, or prayer group.')}</p>
                  <button onClick={() => { vibrate(10); onOpenCreateCircle(); }} className="btn-primary mt-4">
                    <Plus size={16} /> {t('Create a Circle')}
                  </button>
                  <button onClick={() => { vibrate(8); onOpenJoinCircle(); }} className="btn-secondary mt-2 w-full">
                    <KeyRound size={16} /> {t('Join a Circle')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {circles.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { vibrate(8); onOpenCircle(c); }}
                      className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                        <Users size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory-100 font-medium text-sm">{c.name}</p>
                        <p className="text-ivory-600 text-xs">{c.circle_type} · {t('Created')} {formatRelative(c.created_at)}</p>
                      </div>
                      <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                    </button>
                  ))}
                  <button onClick={() => { vibrate(10); onOpenCreateCircle(); }} className="btn-secondary mt-2">
                    <Plus size={16} /> {t('Create Another Circle')}
                  </button>
                  <button onClick={() => { vibrate(8); onOpenJoinCircle(); }} className="btn-secondary">
                    <KeyRound size={16} /> {t('Join a Circle')}
                  </button>
                </div>
              )}

              <p className="ui-label mb-3 mt-6">{t('Together')}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {primaryCards.map((card) => (
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

              <div className="flex items-start gap-2 mt-5 px-1">
                <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed font-medium">
                  {t('AI should strengthen human Christian relationships, not replace them. SOLAPATH strengthens the local church, not becomes it.')}
                </p>
              </div>
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
