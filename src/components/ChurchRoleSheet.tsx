import { useState } from 'react';
import { X } from 'lucide-react';
import { CHURCH_ROLES } from '@/lib/togetherTypes';
import { vibrate } from '@/lib/utils';

interface Props {
  churchName: string;
  currentRole: string;
  onSave: (role: string) => Promise<boolean>;
  onClose: () => void;
}

export default function ChurchRoleSheet({ churchName, currentRole, onSave, onClose }: Props) {
  const [selected, setSelected] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    if (selected === currentRole) {
      onClose();
      return;
    }
    vibrate(15);
    setSaving(true);
    setError(null);
    const ok = await onSave(selected);
    setSaving(false);
    if (!ok) setError('Could not update your role. Your previous role is still in place.');
  }

  return (
    <div className="fixed inset-0 z-[70] h-[100dvh] bg-ink-950 bg-parchment flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Edit Role</p>
        <span className="w-10" />
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 animate-fade-in">
        <p className="text-ivory-400 text-sm mb-1">{churchName}</p>
        <p className="text-ivory-600 text-xs mb-6 leading-relaxed">Choose how you serve at this church. This only changes your own role.</p>
        <p className="ui-label mb-2">Your Role</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CHURCH_ROLES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => { vibrate(6); setSelected(r); }}
              className={`px-3 py-2 rounded-xl border text-xs font-medium ${selected === r ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="text-ivory-600 text-xs mb-4">Selecting "Pastor" does not grant privileged church administration rights.</p>
        {error && (
          <div className="premium-card p-3 mb-4 border-error/30">
            <p className="text-error text-xs">{error}</p>
          </div>
        )}
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Role'}
        </button>
      </div>
    </div>
  );
}
