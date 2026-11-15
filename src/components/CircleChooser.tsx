import { useState, useEffect, useCallback } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { loadMyCircles } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  emptyMessage: string;
  onChoose: (circle: Circle) => void;
  onBack: () => void;
}

export default function CircleChooser({ profile, emptyMessage, onChoose, onBack }: Props) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCircles(await loadMyCircles(profile));
    } catch {
      setError("We couldn't load your Circles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading your Circles..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (circles.length === 0) {
    return (
      <div className="premium-card p-6 text-center">
        <p className="text-ivory-400 text-sm">{emptyMessage}</p>
        <button onClick={onBack} className="btn-secondary mt-4 w-full">Back to Together</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {circles.map((c) => (
        <button
          key={c.id}
          onClick={() => { vibrate(8); onChoose(c); }}
          className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
            <Users size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ivory-100 font-medium text-sm">{c.name}</p>
            <p className="text-ivory-600 text-xs">{c.circle_type}</p>
          </div>
          <ChevronRight size={16} className="text-ivory-600 shrink-0" />
        </button>
      ))}
    </div>
  );
}
