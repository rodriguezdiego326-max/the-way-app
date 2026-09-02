import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { createLegacyEvent } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
}

const EVENT_TYPES = [
  { id: 'personal_note', label: 'Personal Note' },
  { id: 'bible_reflection', label: 'Bible Reflection' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'answered_prayer', label: 'Answered Prayer' },
  { id: 'life_event', label: 'Life Event' },
  { id: 'spiritual_milestone', label: 'Spiritual Milestone' },
  { id: 'church_milestone', label: 'Church Milestone' },
  { id: 'family_milestone', label: 'Family Milestone' },
  { id: 'testimony_entry', label: 'Testimony Entry' },
  { id: 'sermon_reflection', label: 'Sermon Reflection' },
  { id: 'reach_reflection', label: 'REACH Reflection' },
  { id: 'family_walk_milestone', label: 'Family Walk Milestone' },
  { id: 'user_created_memory', label: 'Memory' },
  { id: 'letter', label: 'Letter' },
];

export default function BuildLegacyScreen({ profile, onBack }: Props) {
  const [eventType, setEventType] = useState('personal_note');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [userText, setUserText] = useState('');
  const [scripture, setScripture] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    vibrate(10);
    await createLegacyEvent(profile.id, eventType, title, eventDate, 'user_created', {
      userText: userText || undefined,
      scriptureReferences: scripture ? scripture.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
    setSaved(true);
    setTimeout(() => onBack(), 800);
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Build My Legacy</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Plus size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">BUILD MY LEGACY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Add a record to your permanent Legacy.</p>
            </div>
          </div>

          {saved ? (
            <div className="premium-card p-6 text-center">
              <p className="text-sage-400 text-sm font-medium">Saved to your Legacy.</p>
            </div>
          ) : (
            <div className="premium-card p-5 space-y-3">
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)} className="input-field">
                  {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What happened?" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Your Words</label>
                <textarea value={userText} onChange={e => setUserText(e.target.value)} placeholder="Write your reflection, memory, or note..." className="input-field min-h-[120px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture References (comma-separated)</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Romans 8:28, Psalm 23" className="input-field" />
              </div>
              <button onClick={handleSave} className="btn-primary w-full" disabled={!title.trim()}>
                <Plus size={16} /> Add to Legacy
              </button>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Legacy is intentional, not surveillance. You choose what becomes part of your permanent record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
