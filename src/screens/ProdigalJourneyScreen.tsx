import { useEffect, useState } from 'react';
import {
  X, Plus, Compass, BookOpen, ChevronRight, Calendar, Heart, Info, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatDate, formatRelative } from '@/lib/utils';
import type { ProdigalJourney, ProdigalUpdate } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function ProdigalJourneyScreen({ onBack }: Props) {
  const [journeys, setJourneys] = useState<ProdigalJourney[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<ProdigalJourney | null>(null);
  const [updates, setUpdates] = useState<ProdigalUpdate[]>([]);
  const [updateText, setUpdateText] = useState('');

  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [scripture, setScripture] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadJourneys(); }, []);

  async function loadJourneys() {
    const { data } = await supabase.from('prodigal_journey').select('*').order('created_at', { ascending: false });
    setJourneys((data as ProdigalJourney[]) || []);
  }

  async function createJourney() {
    if (!nickname.trim()) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from('prodigal_journey').insert({
      nickname: nickname.trim(), relationship: relationship.trim() || null,
      current_situation: currentSituation.trim() || null, related_scripture: scripture.trim() || null,
      active: true,
    }).select('*').single();

    if (err || !data) { setError("We couldn't create this journey. Please try again."); setSaving(false); return; }
    setJourneys((prev) => [data as ProdigalJourney, ...prev]);
    setNickname(''); setRelationship(''); setCurrentSituation(''); setScripture('');
    setShowNew(false); setSaving(false);
  }

  async function openJourney(j: ProdigalJourney) {
    vibrate(8); setSelected(j);
    const { data } = await supabase.from('prodigal_updates').select('*').eq('prodigal_id', j.id).order('created_at', { ascending: true });
    setUpdates((data as ProdigalUpdate[]) || []);
  }

  async function addUpdate() {
    if (!updateText.trim() || !selected) return;
    vibrate(8);
    const { data } = await supabase.from('prodigal_updates').insert({ prodigal_id: selected.id, body: updateText.trim() }).select('*').single();
    if (data) { setUpdates((prev) => [...prev, data as ProdigalUpdate]); setUpdateText(''); }
  }

  if (selected) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSelected(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Prodigal Journey</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in-up">
            <h2 className="font-serif text-3xl text-ivory-50 mb-2">{selected.nickname}</h2>
            {selected.relationship && <p className="text-ivory-400 text-sm mb-2">{selected.relationship}</p>}
            {selected.current_situation && <p className="text-ivory-300 text-sm leading-relaxed mb-4">{selected.current_situation}</p>}
            {selected.related_scripture && (
              <div className="flex items-center gap-2 text-gold-300 text-sm mb-4"><BookOpen size={14} /><span className="font-serif italic">{selected.related_scripture}</span></div>
            )}
            <div className="flex items-center gap-2 text-ivory-600 text-xs mb-6"><Calendar size={12} /><span>Started {formatDate(selected.created_at)}</span></div>
            <div className="gold-divider mb-6" />

            <div className="flex items-start gap-2 mb-5 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
              <Heart size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-500 text-xs leading-relaxed">Pray. Love. Listen. Be patient. Maintain Gospel clarity. Avoid constant argument. Respect boundaries. Seek pastoral wisdom. You do not control their salvation — God does.</p>
            </div>

            <p className="ui-label mb-3">Updates & Reflections</p>
            {updates.length === 0 ? (
              <p className="text-ivory-600 text-sm italic">No updates yet. Add one as you pray and walk with them.</p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {updates.map((u) => (
                  <div key={u.id} className="premium-card p-4 animate-fade-in">
                    <p className="text-ivory-300 text-sm leading-relaxed">{u.body}</p>
                    <p className="text-ivory-600 text-xs mt-2">{formatRelative(u.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={updateText} onChange={(e) => setUpdateText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUpdate()} placeholder="A reflection, prayer, or update" className="input-field flex-1 text-sm" />
              <button onClick={addUpdate} disabled={!updateText.trim()} className="btn-primary px-4 disabled:opacity-40"><Plus size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showNew) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowNew(false)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">New Prodigal Journey</p><span className="w-10" />
        </header>
        <div className="flex-1 px-6 py-6 animate-fade-in">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Nickname (required)</label>
              <input autoFocus type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="A loved one" className="input-field" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Relationship (optional)</label>
              <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Son, Daughter, Sibling" className="input-field" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Current Situation (optional)</label>
              <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} placeholder="What is happening right now?" className="input-field min-h-[100px] resize-none" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Related Scripture (optional)</label>
              <input type="text" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Luke 15:11–32" className="input-field" />
            </div>
            {error && <div className="premium-card p-3 border-error/30"><p className="text-error text-sm">{error}</p></div>}
          </div>
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <button onClick={createJourney} disabled={!nickname.trim() || saving} className="btn-primary w-full disabled:opacity-40">
            <Compass size={18} />{saving ? 'Creating...' : 'Begin Journey'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-14 safe-top">
        <div>
          <p className="ui-label animate-fade-in-down">Prodigal Journey</p>
          <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">Prodigal</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-ghost"><Plus size={20} /></button>
      </header>
      <div className="px-6 mt-6">
        {journeys.length === 0 ? (
          <div className="premium-card p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <Compass size={24} className="text-gold-300" />
            </div>
            <p className="text-ivory-400 text-sm mb-2">No journeys yet.</p>
            <p className="text-ivory-600 text-xs leading-relaxed">For loved ones who once professed Christianity or grew up in the church but have walked away. Pray. Love. Listen. Be patient.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {journeys.map((j) => (
              <button key={j.id} onClick={() => openJourney(j)} className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-ivory-100 font-medium text-sm">{j.nickname}</p>
                    {j.relationship && <p className="text-ivory-500 text-xs mt-0.5">{j.relationship}</p>}
                    {j.current_situation && <p className="text-ivory-600 text-xs mt-1 leading-relaxed line-clamp-2">{j.current_situation}</p>}
                  </div>
                  <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-start gap-2 mt-5 px-1">
          <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">SOLAPATH does not offer "7 Steps to Bring Them Back." You do not control another person's salvation. God does.</p>
        </div>
        <div className="flex items-start gap-2 mt-3 px-1">
          <Shield size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">These records are private. They are never shared or used for social discovery.</p>
        </div>
      </div>
    </div>
  );
}
