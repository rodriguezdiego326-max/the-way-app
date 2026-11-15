import { HandHeart, BookOpen, Heart, MessageCircle } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import type { Encouragement } from '@/lib/togetherTypes';

interface Props {
  encouragement: Encouragement;
  onOpenScripture: (reference: string) => boolean;
}

export default function EncouragementItem({ encouragement: e, onOpenScripture }: Props) {
  const isScriptureShare = e.action_type === 'share_scripture';
  const reference = isScriptureShare ? e.scripture_reference : null;

  return (
    <div className="premium-card p-3">
      <div className="flex items-center gap-2 mb-1">
        {e.action_type === 'encourage' && <HandHeart size={12} className="text-gold-300" />}
        {e.action_type === 'share_scripture' && <BookOpen size={12} className="text-gold-300" />}
        {e.action_type === 'praying_for_you' && <Heart size={12} className="text-gold-300" />}
        {e.action_type === 'check_in_privately' && <MessageCircle size={12} className="text-gold-300" />}
        <span className="text-ivory-200 text-sm">{e.action_type.replace(/_/g, ' ')}</span>
        <span className="text-ivory-600 text-xs ml-auto">{formatRelative(e.created_at)}</span>
      </div>

      {reference && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-serif text-lg text-ivory-50">{reference}</p>
          <button
            type="button"
            onClick={() => onOpenScripture(reference)}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs shrink-0"
          >
            <BookOpen size={14} />
            Open in Bible
          </button>
        </div>
      )}

      {e.message && (
        <p className={`text-ivory-300 text-xs leading-relaxed ${reference ? 'mt-2' : 'mt-1'}`}>{e.message}</p>
      )}
    </div>
  );
}
