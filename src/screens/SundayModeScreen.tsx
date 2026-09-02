import { useState } from 'react';
import { X, Sun, BookOpen, Heart, Ear, Sparkles } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { setNotificationPreferences } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenSermonNotes: () => void;
}

export default function SundayModeScreen({ profile, onBack, onOpenSermonNotes }: Props) {
  const [enabled, setEnabled] = useState(false);

  async function handleToggle() {
    vibrate(15);
    const newVal = !enabled;
    setEnabled(newVal);
    await setNotificationPreferences(profile.id, { sunday_mode: newVal });
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Sunday Mode</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Sun size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Sunday Mode</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Going to worship? Prepare your heart.</p>
            </div>
          </div>

          <div className="premium-card p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-ivory-100 font-medium text-sm">Enable Sunday Mode</p>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">SOLAPATH becomes quieter. AI prompts are minimized during worship time.</p>
              </div>
              <button onClick={handleToggle} className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${enabled ? 'bg-gold-500/40' : 'bg-ink-700'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {enabled && (
            <div className="animate-fade-in">
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
                  <Sun size={24} className="text-gold-300" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-6">Prepare Your Heart</p>

                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button onClick={() => { vibrate(10); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                    <Heart size={18} className="text-gold-300" />
                    <div>
                      <p className="text-ivory-100 font-medium text-sm">Pray</p>
                      <p className="text-ivory-600 text-xs">Quiet your heart before God</p>
                    </div>
                  </button>

                  <button onClick={() => { vibrate(10); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                    <BookOpen size={18} className="text-gold-300" />
                    <div>
                      <p className="text-ivory-100 font-medium text-sm">Open Scripture</p>
                      <p className="text-ivory-600 text-xs">Read a passage before the service</p>
                    </div>
                  </button>

                  <div className="premium-card p-4 flex items-center gap-3">
                    <Ear size={18} className="text-gold-300" />
                    <div>
                      <p className="text-ivory-100 font-medium text-sm">Arrive Ready to Listen</p>
                      <p className="text-ivory-600 text-xs">SOLAPATH will be quiet during worship</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => { vibrate(12); onOpenSermonNotes(); }} className="btn-primary mt-6 max-w-xs mx-auto">
                  <BookOpen size={16} /> Take Sermon Notes
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              During worship, SOLAPATH does not encourage you to spend the sermon chatting with AI. Be present with God's people.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
