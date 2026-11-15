import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUnreadCounts, subscribeToActivity, type UnreadCounts } from '@/lib/activityEngine';

export function useActivityUnread(userId: string | null) {
  const [counts, setCounts] = useState<UnreadCounts | null>(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const refresh = useCallback(async () => {
    const forUser = userIdRef.current;
    if (!forUser) return;
    try {
      const next = await fetchUnreadCounts();
      if (userIdRef.current === forUser) setCounts(next);
    } catch {
      // Badges are advisory; keep the last known counts on failure.
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setCounts(null);
      return;
    }
    void refresh();
    const unsubscribe = subscribeToActivity(userId, () => { void refresh(); });
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, [userId, refresh]);

  return { counts, refresh };
}
