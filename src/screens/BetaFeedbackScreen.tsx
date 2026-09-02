import { useState, useCallback } from 'react';
import { X, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { submitFeedback } from '@/lib/productionEngine';
import { FEEDBACK_TYPES } from '@/lib/productionTypes';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function BetaFeedbackScreen({ profile, onBack }: Props) {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [description, setDescription] = useState('');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!description.trim() || submitting) return;
    vibrate(10);
    setSubmitting(true);
    const result = await submitFeedback(feedbackType, description, {
      profileId: profile.id,
      screenContext: 'beta_feedback',
      includeHistory,
    });
    setSubmitting(false);
    if (result) {
      setSubmitted(true);
      setDescription('');
      setTimeout(() => onBack(), 1500);
    }
  }, [feedbackType, description, includeHistory, submitting, profile.id, onBack]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Send Feedback</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">FEEDBACK</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Help improve SOLAPATH.</p>
            </div>
          </div>

          {submitted ? (
            <div className="premium-card p-6 text-center">
              <CheckCircle size={28} className="text-sage-400 mx-auto mb-3" />
              <p className="text-sage-300 text-sm font-medium">Thank you. Your feedback has been received.</p>
            </div>
          ) : (
            <div className="premium-card p-5 space-y-3">
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Type</label>
                <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)} className="input-field">
                  {FEEDBACK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue or suggestion..."
                  className="input-field min-h-[100px]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={e => setIncludeHistory(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-ivory-500 text-xs">Attach my current screen context (optional)</span>
              </label>
              <p className="text-ivory-600 text-xs leading-relaxed">Your feedback does not automatically include sensitive history unless you explicitly choose to attach context.</p>
              <button
                onClick={handleSubmit}
                disabled={!description.trim() || submitting}
                className="btn-primary w-full disabled:opacity-40"
              >
                <Send size={16} /> {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
