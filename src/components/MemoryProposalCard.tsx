import { useState } from 'react';
import { Brain, Check, X, Clock, Pencil, ShieldAlert } from 'lucide-react';
import type { MemoryProposal } from '@/lib/intelligenceTypes';
import { saveMemoryProposal } from '@/lib/intelligenceService';
import { vibrate } from '@/lib/utils';

interface MemoryProposalCardProps {
  proposal: MemoryProposal;
  onDismiss: () => void;
}

const sensitivityConfig: Record<string, { label: string; color: string; icon: typeof ShieldAlert }> = {
  normal: { label: 'Normal', color: 'text-ivory-500', icon: Brain },
  personal: { label: 'Personal', color: 'text-clay-400', icon: ShieldAlert },
  highly_sensitive: { label: 'Highly Sensitive', color: 'text-error', icon: ShieldAlert },
};

export default function MemoryProposalCard({ proposal, onDismiss }: MemoryProposalCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(proposal.content);

  const sens = sensitivityConfig[proposal.sensitivity] || sensitivityConfig.normal;
  const SensIcon = sens.icon;

  async function handleRemember() {
    setSaving(true);
    vibrate(10);
    const contentToSave = editing ? editedContent.trim() : proposal.content;
    await saveMemoryProposal(contentToSave, proposal.type, proposal.sensitivity);
    setSaving(false);
    setSaved(true);
    setTimeout(onDismiss, 800);
  }

  if (saved) {
    return (
      <div className="premium-card p-4 animate-fade-in border-sage-500/30">
        <div className="flex items-center gap-2">
          <Check size={16} className="text-sage-400" />
          <p className="text-sage-400 text-sm font-medium">SOLAPATH will remember this.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card p-4 animate-fade-in border-gold-500/20">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
          <Brain size={16} className="text-gold-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-ivory-100 text-sm font-medium">
              {proposal.requires_explicit_opt_in ? 'SOLAPATH could remember:' : 'Would you like SOLAPATH to remember this?'}
            </p>
            <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium ${sens.color}`}>
              <SensIcon size={10} />
              {sens.label}
            </span>
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                autoFocus
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="input-field text-xs min-h-[60px] resize-none"
              />
              <button
                onClick={() => {
                  vibrate(6);
                  setEditing(false);
                }}
                className="btn-ghost text-xs mt-1"
              >
                <Check size={12} /> Done editing
              </button>
            </div>
          ) : (
            <p className="text-ivory-400 text-xs leading-relaxed italic">
              "{(editing ? editedContent : proposal.content).length > 120 ? (editing ? editedContent : proposal.content).slice(0, 120) + '...' : (editing ? editedContent : proposal.content)}"
            </p>
          )}

          <p className="text-ivory-600 text-xs mt-1.5">{proposal.reason}</p>

          {proposal.requires_explicit_opt_in && (
            <p className="text-clay-400/80 text-[11px] mt-1.5 leading-relaxed">
              This is a sensitive memory. It will only be saved with your explicit permission and can be deleted anytime.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleRemember}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-200 text-sm font-medium transition-all hover:bg-gold-500/25 disabled:opacity-40 no-tap-highlight"
        >
          <Check size={14} />
          Remember
        </button>
        <button
          onClick={() => {
            vibrate(6);
            setEditing(!editing);
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-ink-800/50 border border-ink-700/40 text-ivory-400 text-sm font-medium transition-all hover:bg-ink-700/50 no-tap-highlight"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={() => {
            vibrate(6);
            onDismiss();
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-ink-800/50 border border-ink-700/40 text-ivory-400 text-sm font-medium transition-all hover:bg-ink-700/50 no-tap-highlight"
        >
          <Clock size={14} />
          Just for now
        </button>
        <button
          onClick={() => {
            vibrate(6);
            onDismiss();
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-ink-800/50 border border-ink-700/40 text-ivory-500 transition-all hover:text-ivory-300 no-tap-highlight"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
