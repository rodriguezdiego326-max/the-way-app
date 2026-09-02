import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { createCircle } from '@/lib/togetherEngine';
import { CIRCLE_TYPES } from '@/lib/togetherTypes';
import type { Profile } from '@/lib/types';
import type { Circle } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
  onCreated: (circle: Circle) => void;
}

export default function CreateCircleScreen({ profile, onBack, onCreated }: Props) {
  const [name, setName] = useState('');
  const [circleType, setCircleType] = useState<string>('Bible Study');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    vibrate(15);
    setCreating(true);
    setError(null);
    try {
      const circle = await createCircle(profile, name.trim(), circleType, description.trim() || undefined);
      if (circle) {
        onCreated(circle);
      } else {
        setError('Could not create Circle.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Create Circle</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Plus size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Create a Private Circle</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Small, trusted, intentional. 2–12 members.</p>
            </div>
          </div>

          {error && <p className="text-error text-sm mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <p className="ui-label mb-2">Circle Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Men's Bible Study"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <p className="ui-label mb-2">Circle Type</p>
              <div className="flex flex-wrap gap-2">
                {CIRCLE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => { vibrate(6); setCircleType(t); }}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                      circleType === t
                        ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                        : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="ui-label mb-2">Description (Optional)</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this Circle's purpose."
                className="input-field min-h-[80px] resize-none text-sm"
              />
            </div>

            <div className="premium-card p-4">
              <div className="flex items-start gap-2">
                <Check size={14} className="text-sage-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-ivory-200 text-sm font-medium">Private by Default</p>
                  <p className="text-ivory-500 text-xs mt-1 leading-relaxed">This Circle is not publicly searchable. Only people you invite can join.</p>
                </div>
              </div>
            </div>

            <button onClick={handleCreate} disabled={creating || !name.trim()} className="btn-primary w-full disabled:opacity-40">
              <Plus size={16} /> {creating ? 'Creating...' : 'Create Circle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
