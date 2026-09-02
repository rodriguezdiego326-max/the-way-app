import { useEffect, useState } from 'react';
import {
  X, Plus, Heart, BookOpen, ChevronRight, Calendar, Check, Shield, MessageCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatDate, formatRelative } from '@/lib/utils';
import { spiritualContextOptions } from '@/lib/reachEngine';
import type { ReachPerson, ReachPrayerUpdate, ReachConversation } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function PeoplePrayingScreen({ onBack }: Props) {
  const [people, setPeople] = useState<ReachPerson[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<ReachPerson | null>(null);
  const [updates, setUpdates] = useState<ReachPrayerUpdate[]>([]);
  const [conversations, setConversations] = useState<ReachConversation[]>([]);
  const [updateText, setUpdateText] = useState('');

  // New person form
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('');
  const [spiritualContext, setSpiritualContext] = useState('');
  const [prayerNotes, setPrayerNotes] = useState('');
  const [scripture, setScripture] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadPeople(); }, []);

  async function loadPeople() {
    const { data } = await supabase.from('reach_people').select('*').order('created_at', { ascending: false });
    setPeople((data as ReachPerson[]) || []);
  }

  async function createPerson() {
    if (!nickname.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase.from('reach_people').insert({
      nickname: nickname.trim(),
      relationship: relationship.trim() || null,
      spiritual_context: spiritualContext || null,
      prayer_notes: prayerNotes.trim() || null,
      related_scripture: scripture.trim() || null,
      active: true,
    }).select('*').single();

    if (err || !data) {
      setError("We couldn't add this person. Please try again.");
      setSaving(false);
      return;
    }
    setPeople((prev) => [data as ReachPerson, ...prev]);
    setNickname(''); setRelationship(''); setSpiritualContext(''); setPrayerNotes(''); setScripture('');
    setShowNew(false);
    setSaving(false);
  }

  async function openPerson(p: ReachPerson) {
    vibrate(8);
    setSelected(p);
    const [updRes, convRes] = await Promise.all([
      supabase.from('reach_prayer_updates').select('*').eq('reach_person_id', p.id).order('created_at', { ascending: true }),
      supabase.from('reach_conversations').select('*').eq('reach_person_id', p.id).order('created_at', { ascending: false }),
    ]);
    setUpdates((updRes.data as ReachPrayerUpdate[]) || []);
    setConversations((convRes.data as ReachConversation[]) || []);
  }

  async function addUpdate() {
    if (!updateText.trim() || !selected) return;
    vibrate(8);
    const { data } = await supabase.from('reach_prayer_updates').insert({
      reach_person_id: selected.id, body: updateText.trim(),
    }).select('*').single();
    if (data) {
      setUpdates((prev) => [...prev, data as ReachPrayerUpdate]);
      setUpdateText('');
    }
  }

  // Detail view
  if (selected) {
    const ctxLabel = spiritualContextOptions.find((o) => o.id === selected.spiritual_context)?.label;
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSelected(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Praying For</p>
          <span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in-up">
            <h2 className="font-serif text-3xl text-ivory-50 mb-2">{selected.nickname}</h2>
            {selected.relationship && <p className="text-ivory-400 text-sm mb-2">{selected.relationship}</p>}
            {ctxLabel && <span className="inline-block px-3 py-1 rounded-full bg-ink-700/50 border border-ink-600/40 text-ivory-300 text-xs mb-3">{ctxLabel}</span>}
            {selected.prayer_notes && <p className="text-ivory-300 text-sm leading-relaxed mb-4">{selected.prayer_notes}</p>}
            {selected.related_scripture && (
              <div className="flex items-center gap-2 text-gold-300 text-sm mb-4">
                <BookOpen size={14} /><span className="font-serif italic">{selected.related_scripture}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-ivory-600 text-xs mb-6">
              <Calendar size={12} /><span>Added {formatDate(selected.created_at)}</span>
            </div>
            <div className="gold-divider mb-6" />

            <p className="ui-label mb-3">Prayer Updates</p>
            {updates.length === 0 ? (
              <p className="text-ivory-600 text-sm italic">No updates yet. Add one as you pray.</p>
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
                onKeyDown={(e) => e.key === 'Enter' && addUpdate()}
                placeholder="How are you praying for them?" className="input-field flex-1 text-sm" />
              <button onClick={addUpdate} disabled={!updateText.trim()} className="btn-primary px-4 disabled:opacity-40"><Plus size={18} /></button>
            </div>

            {conversations.length > 0 && (
              <>
                <p className="ui-label mb-3 mt-6">Conversation Notes</p>
                <div className="flex flex-col gap-2">
                  {conversations.map((c) => (
                    <div key={c.id} className="premium-card p-4">
                      {c.main_topic && <p className="text-ivory-200 text-sm font-medium">{c.main_topic}</p>}
                      {c.user_reflection && <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{c.user_reflection}</p>}
                      <p className="text-ivory-600 text-xs mt-2">{formatRelative(c.created_at)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // New person form
  if (showNew) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowNew(false)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Add Person</p><span className="w-10" />
        </header>
        <div className="flex-1 px-6 py-6 animate-fade-in">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Nickname (required)</label>
              <input autoFocus type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Brother, Coworker, Friend" className="input-field" />
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Do not use real names if you prefer not to. A nickname or label works fine.</p>
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Relationship (optional)</label>
              <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Brother, Coworker, Spouse" className="input-field" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Spiritual Context (optional)</label>
              <div className="flex flex-wrap gap-1.5">
                {spiritualContextOptions.map((opt) => (
                  <button key={opt.id} onClick={() => { vibrate(6); setSpiritualContext(opt.id); }}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                      spiritualContext === opt.id ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Prayer Notes (optional)</label>
              <textarea value={prayerNotes} onChange={(e) => setPrayerNotes(e.target.value)} placeholder="What are you praying for?" className="input-field min-h-[80px] resize-none" />
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Related Scripture (optional)</label>
              <input type="text" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="e.g. Romans 10:1" className="input-field" />
            </div>
            {error && <div className="premium-card p-3 border-error/30"><p className="text-error text-sm">{error}</p></div>}
          </div>
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <button onClick={createPerson} disabled={!nickname.trim() || saving} className="btn-primary w-full disabled:opacity-40">
            <Plus size={18} />{saving ? 'Adding...' : 'Add Person'}
          </button>
        </div>
      </div>
    );
  }

  // Main list
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-14 safe-top">
        <div>
          <p className="ui-label animate-fade-in-down">People I'm Praying For</p>
          <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">Pray</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-ghost"><Plus size={20} /></button>
      </header>
      <div className="px-6 mt-6">
        {people.length === 0 ? (
          <div className="premium-card p-6 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <Heart size={24} className="text-gold-300" />
            </div>
            <p className="text-ivory-400 text-sm mb-2">No people added yet.</p>
            <p className="text-ivory-600 text-xs leading-relaxed">Privately add people you are praying for. No real names required. This data stays private.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((p) => {
              const ctxLabel = spiritualContextOptions.find((o) => o.id === p.spiritual_context)?.label;
              return (
                <button key={p.id} onClick={() => openPerson(p)}
                  className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{p.nickname}</p>
                      {p.relationship && <p className="text-ivory-500 text-xs mt-0.5">{p.relationship}</p>}
                      {ctxLabel && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-ink-700/50 text-ivory-400 text-[10px]">{ctxLabel}</span>}
                    </div>
                    <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-start gap-2 mt-5 px-1">
          <Shield size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">These records are private. SOLAPATH does not contact these people, create public profiles, or infer beliefs from outside data.</p>
        </div>
      </div>
    </div>
  );
}
