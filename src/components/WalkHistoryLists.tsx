import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Walk, Prayer, WalkReflection } from '@/lib/types';

export function WalksList() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('walks').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setWalks((data as Walk[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="premium-card h-40 animate-pulse" />;
  if (walks.length === 0) {
    return (
      <div className="premium-card p-6 text-center">
        <p className="text-ivory-400 text-sm">No walks yet.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {walks.map((w) => (
        <div key={w.id} className="premium-card p-4">
          <h3 className="font-serif text-lg text-ivory-50">{w.passage_reference}</h3>
          <p className="text-ivory-500 text-xs mt-1">{w.estimated_minutes} min · {formatDate(w.created_at)}</p>
          {w.reading_objective && <p className="text-ivory-400 text-sm mt-2 leading-relaxed">{w.reading_objective}</p>}
        </div>
      ))}
    </div>
  );
}

export function PrayersList() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('prayers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPrayers((data as Prayer[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="premium-card h-40 animate-pulse" />;
  if (prayers.length === 0) {
    return (
      <div className="premium-card p-6 text-center">
        <p className="text-ivory-400 text-sm">No prayers yet.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {prayers.map((p) => (
        <div key={p.id} className="premium-card p-4">
          <h3 className="font-serif text-lg text-ivory-50">{p.title}</h3>
          {p.description && <p className="text-ivory-400 text-sm mt-1 leading-relaxed line-clamp-2">{p.description}</p>}
          <p className="text-ivory-600 text-xs mt-2">{formatDate(p.started_at)}</p>
        </div>
      ))}
    </div>
  );
}

type ReflectionWithWalk = WalkReflection & { walks: { passage_reference: string } | null };

export function ReflectionsList() {
  const [reflections, setReflections] = useState<ReflectionWithWalk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('walk_reflections').select('*, walks(passage_reference)').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setReflections((data as ReflectionWithWalk[] | null) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="premium-card h-40 animate-pulse" />;
  if (reflections.length === 0) {
    return (
      <div className="premium-card p-6 text-center">
        <p className="text-ivory-400 text-sm">No reflections yet.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {reflections.map((r) => (
        <div key={r.id} className="premium-card p-4">
          {r.walks?.passage_reference && (
            <p className="text-gold-300 text-xs font-medium mb-1">{r.walks.passage_reference}</p>
          )}
          <p className="text-ivory-300 text-sm leading-relaxed whitespace-pre-line">{r.body}</p>
          <p className="text-ivory-600 text-xs mt-2">{formatDate(r.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
