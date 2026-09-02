import { useState, useCallback } from 'react';
import { X, Search, Plus, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { searchLegacyEvents, createLegacyEvent } from '@/lib/legacyEngine';
import { SOURCE_LABELS } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyEvent } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'today_walk', label: 'Walk' },
  { id: 'family', label: 'Family' },
  { id: 'church', label: 'Church' },
  { id: 'reach', label: 'REACH' },
  { id: 'memory', label: 'Memory' },
  { id: 'user_created', label: 'User Created' },
];

export default function LegacySearchScreen({ profile, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LegacyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [userText, setUserText] = useState('');
  const [scripture, setScripture] = useState('');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchLegacyEvents(profile.id, query);
      setResults(filter ? data.filter(e => e.source_type === filter) : data);
    } catch {
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [profile.id, query, filter]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    vibrate(10);
    await createLegacyEvent(profile.id, 'personal_note', title, new Date().toISOString().slice(0, 10), 'user_created', {
      userText: userText || undefined,
      scriptureReferences: scripture ? [scripture] : undefined,
    });
    setShowCreate(false);
    setTitle(''); setUserText(''); setScripture('');
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Search My Legacy</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Search size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">SEARCH MY LEGACY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Search your authorized Legacy content.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search... e.g., Romans 8, prayer, 2026"
              className="input-field flex-1"
            />
            <button onClick={() => { vibrate(8); handleSearch(); }} className="btn-primary">
              <Search size={16} />
            </button>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { vibrate(5); setFilter(f.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f.id ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20' : 'bg-ink-800/40 text-ivory-500 border border-transparent'
                }`}
              >{f.label}</button>
            ))}
          </div>

          {loading && <LoadingState message="Searching..." />}
          {error && <ErrorState message={error} />}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-2 mb-4">
              {results.map(event => (
                <div key={event.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-ivory-100 font-medium text-sm">{event.title}</p>
                    <span className="px-2 py-1 rounded-md bg-ink-700/40 text-ivory-500 text-[10px] font-medium tracking-wider shrink-0">
                      {SOURCE_LABELS[event.source_type] || event.source_type}
                    </span>
                  </div>
                  <p className="text-ivory-600 text-xs">{formatDate(event.event_date)}</p>
                  {event.event_type !== 'prayer' && event.event_type !== 'answered_prayer' && event.user_text && <p className="text-ivory-400 text-xs mt-2 leading-relaxed line-clamp-2">{event.user_text}</p>}
                  {(event.event_type === 'prayer' || event.event_type === 'answered_prayer') && (
                    <p className="text-ivory-500 text-xs mt-2 leading-relaxed">
                      {event.event_type === 'answered_prayer' ? 'Marked answered.' : 'A prayer was added to your journey.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && !showCreate && (
            <button onClick={() => { vibrate(10); setShowCreate(true); }} className="btn-secondary w-full">
              <Plus size={16} /> Add a Personal Note
            </button>
          )}

          {showCreate && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Add a Personal Note</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., What God taught me today" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Your Words</label>
                <textarea value={userText} onChange={e => setUserText(e.target.value)} placeholder="Your reflection..." className="input-field min-h-[80px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture (optional)</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Philippians 4:6-7" className="input-field" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Search only covers your authorized Legacy content. No other user's data is ever searched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
