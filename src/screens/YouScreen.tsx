import { lazy, Suspense, useEffect, useState } from 'react';
import { Brain, Heart, Users, Church, Settings, ChevronRight, Trash2, Eye, EyeOff, X, ShieldCheck, Sparkles, Landmark, FlaskConical, Search, Shield, BarChart3, Package, Cpu, BookHeart, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatDate } from '@/lib/utils';
import DeleteAllMemoriesDialog from '@/components/DeleteAllMemoriesDialog';
const TestSuite = import.meta.env.DEV ? lazy(() => import('@/screens/TestSuite')) : null;
import type { Profile, Memory, TheologicalDepth, TheologicalAuthor, ConfessionalDocument } from '@/lib/types';

interface YouScreenProps {
  profile: Profile | null;
  onProfileUpdate: () => void;
  onOpenFamily: () => void;
  onOpenReach: () => void;
  onOpenLibrarySearch: () => void;
  onOpenAdminSources: () => void;
  onOpenRetrievalDebug: () => void;
  onOpenRAGTests: () => void;
  onOpenPhase6Tests: () => void;
  onOpenQADashboard: () => void;
  onOpenSourceBatches: () => void;
  onOpenReleaseGate: () => void;
  onOpenProductionStatus: () => void;
  onOpenTogether: () => void;
  onOpenMyChurch: () => void;
  onOpenPhase8Tests: () => void;
  onOpenLegacy: () => void;
  onOpenPhase9Tests: () => void;
  onOpenPrivacyCenter: () => void;
  onOpenProductionReadiness: () => void;
  onOpenPhase10Tests: () => void;
  onOpenBetaFeedback: () => void;
  session: { user: { id: string; email?: string } | null } | null;
  onSignOut: () => void;
}

type SubView = 'main' | 'memories' | 'settings' | 'library' | 'test_suite';

const depthLabels: Record<TheologicalDepth, string> = {
  simple: 'Simple',
  study: 'Study',
  deep_study: 'Deep Study',
};

export default function YouScreen({ profile, onProfileUpdate, onOpenFamily, onOpenReach, onOpenLibrarySearch, onOpenAdminSources, onOpenRetrievalDebug, onOpenRAGTests, onOpenPhase6Tests, onOpenQADashboard, onOpenSourceBatches, onOpenReleaseGate, onOpenProductionStatus, onOpenTogether, onOpenMyChurch, onOpenPhase8Tests, onOpenLegacy, onOpenPhase9Tests, onOpenPrivacyCenter, onOpenProductionReadiness, onOpenPhase10Tests, onOpenBetaFeedback, session, onSignOut }: YouScreenProps) {
  const [subView, setSubView] = useState<SubView>('main');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [authors, setAuthors] = useState<TheologicalAuthor[]>([]);
  const [confessions, setConfessions] = useState<ConfessionalDocument[]>([]);

  useEffect(() => {
    if (subView === 'memories') loadMemories();
    if (subView === 'library') loadLibrary();
  }, [subView]);

  async function loadMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false });
    setMemories((data as Memory[]) || []);
  }

  async function loadLibrary() {
    const [authorsRes, confessionsRes] = await Promise.all([
      supabase.from('theological_authors').select('*').order('era, born_year'),
      supabase.from('confessional_documents').select('*').order('year'),
    ]);
    setAuthors((authorsRes.data as TheologicalAuthor[]) || []);
    setConfessions((confessionsRes.data as ConfessionalDocument[]) || []);
  }

  async function toggleMemoryActive(memory: Memory) {
    vibrate(8);
    const newActive = !memory.active;
    await supabase.from('memories').update({ active: newActive }).eq('id', memory.id);
    setMemories((prev) =>
      prev.map((m) => (m.id === memory.id ? { ...m, active: newActive } : m)),
    );
  }

  async function forgetMemory(memory: Memory) {
    vibrate(15);
    await supabase.from('memories').delete().eq('id', memory.id);
    setMemories((prev) => prev.filter((m) => m.id !== memory.id));
  }

  async function toggleMemoryEnabled() {
    if (!profile) return;
    vibrate(10);
    const newVal = !profile.memory_enabled;
    await supabase.from('profiles').update({ memory_enabled: newVal }).eq('id', profile.id);
    onProfileUpdate();
  }

  async function setDepth(depth: TheologicalDepth) {
    if (!profile) return;
    vibrate(8);
    await supabase.from('profiles').update({ theological_depth: depth }).eq('id', profile.id);
    onProfileUpdate();
  }

  // MEMORIES VIEW
  if (subView === 'memories') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSubView('main')} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">What SOLAPATH Remembers</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 pt-6 nav-safe-padding">
          <div className="animate-fade-in">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-gold-300" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-ivory-50">What SOLAPATH Remembers</h2>
                <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                  Memory is transparent and user-controlled. You can view, edit, forget individual memories, disable memory, or delete everything.
                </p>
              </div>
            </div>

            {memories.length === 0 ? (
              <div className="premium-card p-6 text-center">
                <p className="text-ivory-400 text-sm">SOLAPATH doesn't remember anything yet.</p>
                <p className="text-ivory-600 text-xs mt-2">
                  As you walk, pray, and reflect, SOLAPATH will remember your context — only with your permission — to walk with you more personally.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-6">
                  {memories.map((m) => (
                    <div key={m.id} className={`premium-card p-4 ${!m.active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium">
                              {m.category.replace(/_/g, ' ')}
                            </span>
                            {m.sensitivity !== 'low' && (
                              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                m.sensitivity === 'high' ? 'bg-error/15 text-error' : 'bg-clay-500/15 text-clay-400'
                              }`}>
                                {m.sensitivity}
                              </span>
                            )}
                          </div>
                          <p className="text-ivory-200 text-sm mt-1 leading-relaxed">{m.content}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-ivory-600 text-xs">{formatDate(m.created_at)}</p>
                            {m.user_confirmed && (
                              <span className="text-[10px] text-sage-400 flex items-center gap-1">
                                <ShieldCheck size={10} /> Confirmed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleMemoryActive(m)}
                            className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center text-ivory-400 hover:text-ivory-200 transition-colors"
                          >
                            {m.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => forgetMemory(m)}
                            className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center text-ivory-400 hover:text-error transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { vibrate(8); setConfirmDeleteAllOpen(true); }}
                  className="btn-secondary w-full text-error border-error/30 hover:bg-error/10"
                >
                  <Trash2 size={16} />
                  Delete All Remembered Context
                </button>
              </>
            )}
          </div>
        </div>

        <DeleteAllMemoriesDialog
          open={confirmDeleteAllOpen}
          onClose={() => setConfirmDeleteAllOpen(false)}
          onDeleted={() => setMemories([])}
        />
      </div>
    );
  }

  // SETTINGS VIEW
  if (subView === 'settings') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSubView('main')} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Settings</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 pt-6 nav-safe-padding animate-fade-in">
          <div className="mb-6">
            <p className="ui-label mb-3">Theological Depth</p>
            <div className="flex flex-col gap-2">
              {(['simple', 'study', 'deep_study'] as TheologicalDepth[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all no-tap-highlight ${
                    profile?.theological_depth === d
                      ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                      : 'bg-ink-800/40 border-ink-700/40 text-ivory-300'
                  }`}
                >
                  <span className="font-medium">{depthLabels[d]}</span>
                  {profile?.theological_depth === d && <ShieldCheck size={16} className="text-gold-300" />}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-ivory-100 font-medium text-sm">Remember my context</p>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">
                  When enabled, SOLAPATH remembers your season, goals, and reflections to walk with you more personally. You control everything.
                </p>
              </div>
              <button
                onClick={toggleMemoryEnabled}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${
                  profile?.memory_enabled ? 'bg-gold-500/40' : 'bg-ink-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${
                    profile?.memory_enabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="ui-label mb-3">Preferred Translation</p>
            <p className="text-ivory-200 font-medium">{profile?.preferred_translation || 'ESV'}</p>
            <p className="text-ivory-600 text-xs mt-1">
              SOLAPATH does not store copyrighted Bible text.
            </p>
          </div>

          <div className="premium-card p-5">
            <h3 className="font-serif text-lg text-ivory-50 mb-2">About SOLAPATH</h3>
            <p className="text-ivory-400 text-xs leading-relaxed">
              SOLAPATH is not intended to replace the Bible, prayer, pastors, the local church, Christian community, or personal spiritual responsibility. Its purpose is to help believers open Scripture, understand it faithfully, apply biblical truth to everyday life, pray, grow in doctrine, disciple their families, share the Gospel, and remember God's faithfulness.
            </p>
            <div className="gold-divider my-4" />
            <p className="text-gold-300/80 text-xs font-medium tracking-wide uppercase">
              AI is the servant. Scripture is the authority.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // TEST SUITE VIEW
  if (import.meta.env.DEV && TestSuite && subView === 'test_suite') {
    return (
      <Suspense fallback={null}>
        <TestSuite
          profile={profile}
          theologicalDepth={profile?.theological_depth || 'simple'}
          onClose={() => setSubView('main')}
        />
      </Suspense>
    );
  }

  // THEOLOGICAL LIBRARY VIEW
  if (subView === 'library') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSubView('main')} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Theological Library</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Landmark size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Theological Library</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                Metadata for historic Reformed theologians, selected teachers, and confessional documents. No quotations or source text — verified content connects later.
              </p>
            </div>
          </div>

          {/* Confessional Documents */}
          <div className="mb-8">
            <p className="ui-label mb-3">Confessional Documents</p>
            <div className="flex flex-col gap-2">
              {confessions.map((doc) => (
                <div key={doc.id} className="premium-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-sage-400" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-ivory-50">{doc.title}</h3>
                      <p className="text-ivory-500 text-xs mt-0.5">
                        {doc.tradition} · {doc.year} · {doc.document_type}
                      </p>
                      {doc.summary && (
                        <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{doc.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historic Theologians */}
          <div className="mb-8">
            <p className="ui-label mb-3">Historic Theologians</p>
            <div className="flex flex-col gap-2">
              {authors.filter((a) => a.era === 'historic').map((author) => (
                <div key={author.id} className="premium-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                      <Users size={16} className="text-ivory-400" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base text-ivory-100">{author.name}</h3>
                      <p className="text-ivory-600 text-xs mt-0.5">
                        {author.born_year && author.died_year ? `${author.born_year}–${author.died_year}` : author.born_year ? `b. ${author.born_year}` : ''}
                      </p>
                      {author.bio_summary && (
                        <p className="text-ivory-500 text-xs mt-1.5 leading-relaxed">{author.bio_summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modern Teachers */}
          <div className="mb-8">
            <p className="ui-label mb-3">Selected Teachers</p>
            <div className="flex flex-col gap-2">
              {authors.filter((a) => a.era === 'modern').map((author) => (
                <div key={author.id} className="premium-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-ink-700/40 flex items-center justify-center shrink-0">
                      <Users size={16} className="text-ivory-400" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base text-ivory-100">{author.name}</h3>
                      <p className="text-ivory-600 text-xs mt-0.5">
                        {author.born_year ? `b. ${author.born_year}` : ''}
                      </p>
                      {author.bio_summary && (
                        <p className="text-ivory-500 text-xs mt-1.5 leading-relaxed">{author.bio_summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 px-1">
            <Sparkles size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed">
              Metadata only. No quotations, sermons, or book excerpts are stored. Actual source material will be added through verified and legal sources.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen nav-safe-padding">
      <header className="px-6 pt-14 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl text-ivory-50 tracking-tight animate-fade-in-down">Explore</h1>
        </div>
      </header>

      {/* Journey sections */}
      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <p className="ui-label mb-3">Journey</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: Brain, label: 'Theological Learning', desc: 'Doctrine and depth', onClick: () => setSubView('library') },
            { icon: Users, label: 'Together', desc: 'Walk with other believers', onClick: onOpenTogether },
            { icon: Church, label: 'My Church', desc: 'Strengthen your local church', onClick: onOpenMyChurch },
            { icon: BookHeart, label: 'Legacy', desc: 'Remember God\'s faithfulness', onClick: onOpenLegacy },
            { icon: Users, label: 'Family Discipleship', desc: 'SOLAPATH Family', onClick: onOpenFamily },
            { icon: Heart, label: 'Reach & Evangelism', desc: 'Share Christ faithfully', onClick: onOpenReach },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                <item.icon size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-ivory-100 font-medium text-sm">{item.label}</p>
                <p className="text-ivory-600 text-xs">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-ivory-600 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Control & Library */}
      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <p className="ui-label mb-3">Control & Library</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSubView('memories')}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Brain size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">What SOLAPATH Remembers</p>
              <p className="text-ivory-600 text-xs">View · Edit · Forget · Disable · Delete</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={() => setSubView('library')}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <Landmark size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Theological Library</p>
              <p className="text-ivory-600 text-xs">Authors · Confessions · Doctrines</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenLibrarySearch}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Search size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Library Search</p>
              <p className="text-ivory-600 text-xs">Search verified theological sources</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          {import.meta.env.DEV && (<>
          <button
            onClick={() => setSubView('test_suite')}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <FlaskConical size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Intelligence Test Suite</p>
              <p className="text-ivory-600 text-xs">Theological safety tests · Development</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenRAGTests}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <FlaskConical size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">RAG Test Suite</p>
              <p className="text-ivory-600 text-xs">Retrieval-augmented generation tests</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenPhase6Tests}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <FlaskConical size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Phase 7 — Intelligence Validation</p>
              <p className="text-ivory-600 text-xs">16 production intelligence tests</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenQADashboard}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BarChart3 size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Theological QA Dashboard</p>
              <p className="text-ivory-600 text-xs">Regression tests · Metrics · Failures</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenSourceBatches}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <Package size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Source Batch QA</p>
              <p className="text-ivory-600 text-xs">Ingestion batches · Release readiness</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenReleaseGate}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Release Gate</p>
              <p className="text-ivory-600 text-xs">Production intelligence readiness checks</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenPhase8Tests}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <FlaskConical size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Phase 8 — Together + Church Validation</p>
              <p className="text-ivory-600 text-xs">Together + Church privacy and security tests</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenPhase9Tests}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Phase 9 — Legacy Validation</p>
              <p className="text-ivory-600 text-xs">16 Legacy privacy and integrity tests</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenPhase10Tests}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} className="text-sage-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Phase 10 — Production Readiness</p>
              <p className="text-ivory-600 text-xs">20 security and privacy tests</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenProductionReadiness}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Production Readiness</p>
              <p className="text-ivory-600 text-xs">Security · Privacy · Health · Flags</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>
          </>)}

          <button
            onClick={onOpenPrivacyCenter}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Privacy & Data</p>
              <p className="text-ivory-600 text-xs">What SOLAPATH stores · Download · Delete</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenBetaFeedback}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <MessageSquare size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Send Feedback</p>
              <p className="text-ivory-600 text-xs">Bug · Feature · Concern</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          {import.meta.env.DEV && (<>
          <button
            onClick={onOpenProductionStatus}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Cpu size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Intelligence Status</p>
              <p className="text-ivory-600 text-xs">Provider · Model · Environment · Versions</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenAdminSources}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-clay-500/10 border border-clay-500/20 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-clay-400" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Source Management</p>
              <p className="text-ivory-600 text-xs">Admin · Add · Verify · Archive</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          <button
            onClick={onOpenRetrievalDebug}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <Search size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Retrieval Debug</p>
              <p className="text-ivory-600 text-xs">Admin · Pipeline audit trail</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>

          </>)}

          <button
            onClick={() => setSubView('settings')}
            className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <Settings size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Settings</p>
              <p className="text-ivory-600 text-xs">Depth · Translation · Memory · About</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 shrink-0" />
          </button>
        </div>
      </section>

      {/* Auth */}
      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <p className="ui-label mb-3">Account</p>
        {session?.user && (
          <button
            onClick={onSignOut}
            className="btn-secondary w-full text-error border-error/30 hover:bg-error/10"
          >
            Sign Out{session.user.email ? ` (${session.user.email})` : ''}
          </button>
        )}
      </section>

      {/* Future systems */}
      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <p className="ui-label mb-3">Coming</p>
        <div className="flex flex-wrap gap-2">
        </div>
      </section>

      {/* Principle */}
      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-start gap-3 px-1">
          <Sparkles size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">
            SOLAPATH never displays a faith score. It never quantifies salvation, God's love, spiritual worth, or likelihood of conversion.
          </p>
        </div>
      </section>
    </div>
  );
}
