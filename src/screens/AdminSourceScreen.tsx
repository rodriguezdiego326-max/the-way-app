import { useEffect, useState } from 'react';
import {
  X, Plus, Check, AlertCircle, Archive, Eye, Shield, ChevronRight, FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { authorityLevelLabels, sourceTypeLabels } from '@/lib/libraryEngine';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import type { LibrarySource, SourceType, ContentChunk, ContentStatus } from '@/lib/libraryTypes';

interface Props { onBack: () => void; }

const sourceTypes: SourceType[] = [
  'scripture', 'creed', 'confession', 'catechism',
  'historic_theologian', 'modern_teacher',
  'editorial', 'family_discipleship', 'apologetics',
  'church_history', 'biblical_theology',
];

interface ChunkDetail {
  id: string;
  chunk_index: number;
  heading: string | null;
  text: string;
  doctrine_tags: string[] | null;
  scripture_references: string[] | null;
  token_count: number | null;
  verified: boolean;
}

export default function AdminSourceScreen({ onBack }: Props) {
  const [sources, setSources] = useState<LibrarySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [inspectingChunks, setInspectingChunks] = useState<LibrarySource | null>(null);
  const [chunks, setChunks] = useState<ChunkDetail[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('historic_theologian');
  const [authorityLevel, setAuthorityLevel] = useState(4);
  const [chapter, setChapter] = useState('');
  const [copyrightStatus, setCopyrightStatus] = useState('pending_review');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { loadSources(); }, []);

  async function loadSources() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('library_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (err) throw err;
      setSources((data as LibrarySource[]) || []);
    } catch (err) {
      console.error('[AdminSource] load error:', err);
      setError('Could not load sources from the database.');
    } finally {
      setLoading(false);
    }
  }

  async function createSource() {
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const { data, error: err } = await supabase.from('library_sources').insert({
        title: title.trim(),
        source_type: sourceType,
        authority_level: authorityLevel,
        chapter: chapter.trim() || null,
        copyright_status: copyrightStatus,
        content_status: 'draft',
        verified: false,
      }).select('*').single();

      if (err) throw err;
      if (data) setSources((prev) => [data as LibrarySource, ...prev]);
      setTitle(''); setChapter('');
      setShowNew(false);
    } catch (err) {
      console.error('[AdminSource] create error:', err);
      setFormError('Could not add this source. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: ContentStatus) {
    vibrate(8);
    const updates: Partial<LibrarySource> = { content_status: status };
    if (status === 'verified') {
      updates.verified = true;
      updates.verification_date = new Date().toISOString().split('T')[0];
      updates.verified_by = 'admin';
    } else {
      updates.verified = false;
    }
    try {
      await supabase.from('library_sources').update(updates).eq('id', id);
      loadSources();
    } catch (err) {
      console.error('[AdminSource] update error:', err);
      setError('Could not update source status.');
    }
  }

  async function inspectChunks(source: LibrarySource) {
    vibrate(6);
    setInspectingChunks(source);
    setChunksLoading(true);
    setChunks([]);
    try {
      const { data, error: err } = await supabase
        .from('source_chunks')
        .select('*')
        .eq('source_id', source.id)
        .order('chunk_index', { ascending: true });
      if (err) throw err;
      setChunks((data as ChunkDetail[]) || []);
    } catch (err) {
      console.error('[AdminSource] chunk inspect error:', err);
    } finally {
      setChunksLoading(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Source Management</p>
        <button onClick={() => setShowNew(true)} className="btn-ghost"><Plus size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-clay-500/10 border border-clay-500/20">
            <Shield size={13} className="text-clay-400 shrink-0 mt-0.5" />
            <p className="text-ivory-400 text-xs leading-relaxed">Admin-only interface. Requires authorized admin role. In production, database-level RLS enforces write access — normal users cannot verify, edit, or delete Library sources.</p>
          </div>

          {loading && <LoadingState message="Loading sources..." />}
          {error && <ErrorState message={error} onRetry={loadSources} />}

          {!loading && !error && sources.length === 0 && (
            <EmptyState message="No sources in the library yet. Add a source to begin building the verified library." />
          )}

          {!loading && !error && sources.length > 0 && !inspectingChunks && (
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{s.title}</p>
                      <p className="text-ivory-500 text-xs mt-0.5">{sourceTypeLabels[s.source_type]} · {authorityLevelLabels[s.authority_level]}</p>
                      {s.chapter && <p className="text-ivory-600 text-xs mt-0.5">{s.chapter}</p>}
                      {s.license_notes && <p className="text-ivory-600 text-xs mt-0.5 italic">{s.license_notes}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          s.content_status === 'verified' ? 'bg-sage-500/10 border border-sage-500/20 text-sage-400' :
                          s.content_status === 'rejected' || s.content_status === 'archived' ? 'bg-ink-800/40 border border-ink-700/40 text-ivory-600' :
                          'bg-gold-500/10 border border-gold-500/20 text-gold-300'
                        }`}>{s.content_status}</span>
                        {s.verified && <span className="flex items-center gap-1 text-sage-400 text-[10px]"><Check size={10} /> Verified</span>}
                        {s.verification_date && <span className="text-ivory-600 text-[10px]">{s.verification_date}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.content_status !== 'verified' && (
                      <button onClick={() => updateStatus(s.id, 'verified')} className="btn-secondary text-xs px-3 py-1.5">
                        <Check size={12} /> Verify
                      </button>
                    )}
                    {s.content_status !== 'rejected' && (
                      <button onClick={() => updateStatus(s.id, 'rejected')} className="btn-ghost text-xs text-error">
                        <AlertCircle size={12} /> Reject
                      </button>
                    )}
                    {s.content_status !== 'archived' && (
                      <button onClick={() => updateStatus(s.id, 'archived')} className="btn-ghost text-xs">
                        <Archive size={12} /> Archive
                      </button>
                    )}
                    <button onClick={() => inspectChunks(s)} className="btn-ghost text-xs">
                      <Eye size={12} /> Inspect Chunks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chunk inspection panel */}
          {inspectingChunks && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="ui-label">Chunk Inspection</p>
                  <p className="text-ivory-400 text-xs mt-0.5">{inspectingChunks.title}</p>
                </div>
                <button onClick={() => setInspectingChunks(null)} className="btn-ghost text-xs"><X size={14} /></button>
              </div>

              {chunksLoading && <LoadingState message="Loading chunks..." />}

              {!chunksLoading && chunks.length === 0 && (
                <EmptyState message="No chunks found for this source." />
              )}

              {!chunksLoading && chunks.length > 0 && (
                <div className="space-y-2">
                  {chunks.map((c) => (
                    <div key={c.id} className="premium-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-ivory-300 text-xs font-medium">Chunk #{c.chunk_index}{c.heading ? ` — ${c.heading}` : ''}</p>
                        <div className="flex items-center gap-2">
                          {c.verified && <span className="flex items-center gap-1 text-sage-400 text-[10px]"><Check size={10} /> Verified</span>}
                          {c.token_count && <span className="text-ivory-600 text-[10px]">{c.token_count} tokens</span>}
                        </div>
                      </div>
                      <p className="text-ivory-400 text-xs leading-relaxed mb-2">{c.text}</p>
                      {c.doctrine_tags && c.doctrine_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {c.doctrine_tags.map((d, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-sage-500/10 border border-sage-500/20 text-sage-400 text-[9px]">{d}</span>
                          ))}
                        </div>
                      )}
                      {c.scripture_references && c.scripture_references.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.scripture_references.map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-300 text-[9px]">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New source form */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm flex flex-col">
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => setShowNew(false)} className="btn-ghost"><X size={20} /></button>
            <p className="ui-label">Add Source</p><span className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Title (required)</label>
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Institutes of the Christian Religion, Book II" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Source Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {sourceTypes.map((t) => (
                    <button key={t} onClick={() => { vibrate(4); setSourceType(t); }}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                        sourceType === t ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                      {sourceTypeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Authority Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <button key={l} onClick={() => { vibrate(4); setAuthorityLevel(l); }}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                        authorityLevel === l ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                      L{l}: {authorityLevelLabels[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Chapter / Section (optional)</label>
                <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter 3: Of God's Eternal Decree" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Copyright Status</label>
                <select value={copyrightStatus} onChange={(e) => setCopyrightStatus(e.target.value)} className="input-field">
                  <option value="pending_review">Pending Review</option>
                  <option value="public_domain">Public Domain</option>
                  <option value="copyrighted">Copyrighted</option>
                  <option value="mixed">Mixed</option>
                  <option value="licensed">Licensed</option>
                </select>
              </div>
              {formError && <ErrorState message={formError} />}
            </div>
          </div>
          <div className="px-6 pb-10 safe-bottom">
            <button onClick={createSource} disabled={!title.trim() || saving} className="btn-primary w-full disabled:opacity-40">
              <Plus size={18} />{saving ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
