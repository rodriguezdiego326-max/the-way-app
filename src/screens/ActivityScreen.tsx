import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Bell, ChevronRight, CheckCheck, SlidersHorizontal } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import PullToRefresh from '@/components/PullToRefresh';
import ActivityPreferencesSheet from '@/components/ActivityPreferencesSheet';
import { describeActivity, type ActivityItem } from '@/lib/activityTypes';
import { fetchActivityPage, markActivityRead, markAllActivityRead } from '@/lib/activityEngine';
import { useLanguage } from '@/lib/i18n';

interface Props {
  userId: string;
  onBack: () => void;
  onOpenItem: (item: ActivityItem) => void;
  onReadStateChanged: () => void;
}

export default function ActivityScreen({ userId, onBack, onOpenItem, onReadStateChanged }: Props) {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const markingRef = useRef(false);

  const fetchFirst = useCallback(async () => {
    const page = await fetchActivityPage();
    setItems(page.items);
    setHasMore(page.hasMore);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchFirst();
    } catch {
      setError(t('Could not load your activity.'));
    } finally {
      setLoading(false);
    }
  }, [fetchFirst, t]);

  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchActivityPage(last.created_at);
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } catch {
      setError(t('Could not load more activity.'));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleOpen(item: ActivityItem) {
    vibrate(8);
    if (!item.read_at) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read_at: new Date().toISOString() } : i)));
      try {
        await markActivityRead([item.id]);
        onReadStateChanged();
      } catch {
        setError(t('Could not update that item. It may still show as unread.'));
      }
    }
    onOpenItem(item);
  }

  async function handleMarkAll() {
    if (markingRef.current) return;
    markingRef.current = true;
    setMarkingAll(true);
    try {
      await markAllActivityRead(userId);
      const now = new Date().toISOString();
      setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
      onReadStateChanged();
    } catch {
      setError(t('Could not mark everything as read.'));
    } finally {
      markingRef.current = false;
      setMarkingAll(false);
    }
  }

  const hasUnread = items.some((i) => !i.read_at);

  return (
    <div className="app-container bg-ink-950 bg-parchment h-[100dvh] flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label={t('Close')}><X size={20} /></button>
        <p className="ui-label">{t('Activity')}</p>
        <button onClick={() => setShowPrefs(true)} className="btn-ghost" aria-label={t('Activity settings')}>
          <SlidersHorizontal size={18} />
        </button>
      </header>

      <PullToRefresh onRefresh={fetchFirst} className="flex-1 min-h-0 nav-safe-padding px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">{t('ACTIVITY')}</h2>
              <p className="text-ivory-500 text-sm mt-1">{t('Updates from your Family and Circles.')}</p>
            </div>
            {hasUnread && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck size={14} /> {t('Mark all read')}
              </button>
            )}
          </div>

          {loading && <LoadingState message={t('Loading activity...')} />}
          {error && !loading && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && items.length === 0 && (
            <div className="premium-card p-6 text-center">
              <Bell size={20} className="text-ivory-600 mx-auto mb-3" />
              <p className="text-ivory-400 text-sm">{t('Nothing new yet.')}</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">{t('When people in your Family or Circles share, you will see it here.')}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="flex flex-col gap-2 mb-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleOpen(item)}
                    className="premium-card w-full p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                  >
                    <span
                      aria-label={t(item.read_at ? 'Read' : 'Unread')}
                      className={`w-2 h-2 rounded-full shrink-0 ${item.read_at ? 'bg-transparent' : 'bg-gold-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.read_at ? 'text-ivory-400' : 'text-ivory-100 font-medium'}`}>
                        {describeActivity(item, language)}
                      </p>
                      <p className="text-ivory-600 text-xs mt-0.5">{formatRelative(item.created_at)}</p>
                    </div>
                    <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && hasMore && (
            <button onClick={loadMore} disabled={loadingMore} className="btn-secondary w-full mb-6 disabled:opacity-50">
              {loadingMore ? t('Loading...') : t('Load older activity')}
            </button>
          )}
        </div>
      </PullToRefresh>

      {showPrefs && <ActivityPreferencesSheet userId={userId} onClose={() => setShowPrefs(false)} />}
    </div>
  );
}
