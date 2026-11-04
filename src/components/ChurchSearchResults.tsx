import { Church, ChevronRight, Globe, Loader2, MapPin } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { AppleChurchResult } from '@/lib/churchSearchNative';
import type { ChurchSearchResult } from '@/lib/churchSearchMerge';

export type ChurchSearchStatus = 'idle' | 'searching' | 'results' | 'empty' | 'failed';
export type AppleSearchStatus = 'ok' | 'web' | 'failed';

interface Props {
  status: ChurchSearchStatus;
  query: string;
  results: ChurchSearchResult[];
  appleStatus: AppleSearchStatus;
  onJoinChurch: (churchId: string) => void;
  onReviewApple: (church: AppleChurchResult) => void;
  onRetry: () => void;
}

function appleLocation(church: AppleChurchResult): string | null {
  return [church.city, church.state].filter(Boolean).join(', ') || null;
}

function appleNote(appleStatus: AppleSearchStatus): string | null {
  if (appleStatus === 'web') return 'Apple Maps church search is available in the SOLAPATH iPhone app.';
  if (appleStatus === 'failed') return 'Apple Maps search is unavailable right now, so only SOLAPATH churches are shown.';
  return null;
}

export default function ChurchSearchResults({
  status, query, results, appleStatus, onJoinChurch, onReviewApple, onRetry,
}: Props) {
  if (status === 'idle') return null;

  if (status === 'searching') {
    return (
      <div className="flex items-center gap-2 text-ivory-500 text-sm py-4" role="status">
        <Loader2 size={16} className="animate-spin" /> Searching churches...
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="premium-card p-4 mb-4 flex flex-col gap-3">
        <p className="text-error text-sm">Church search failed. Check your connection and try again.</p>
        <button type="button" onClick={() => { vibrate(6); onRetry(); }} className="btn-secondary text-sm self-start">
          Try again
        </button>
      </div>
    );
  }

  const note = appleNote(appleStatus);

  if (status === 'empty') {
    return (
      <div className="premium-card p-4 mb-4">
        <p className="text-ivory-200 text-sm">No churches found for "{query}".</p>
        <p className="text-ivory-600 text-xs mt-1 leading-relaxed">Try a different name or add the church below.</p>
        {note && <p className="text-ivory-600 text-xs mt-2 leading-relaxed">{note}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      {results.map((result) => {
        if (result.kind === 'solapath') {
          return (
            <button
              type="button"
              key={result.key}
              onClick={() => { vibrate(10); onJoinChurch(result.churchId); }}
              className="premium-card p-3 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all"
            >
              <Church size={14} className="text-ivory-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-ivory-200 text-sm">{result.name}</p>
                {result.city && <p className="text-ivory-600 text-xs">{result.city}</p>}
              </div>
              <ChevronRight size={14} className="text-ivory-600 shrink-0" />
            </button>
          );
        }

        const { apple } = result;
        const location = appleLocation(apple);
        return (
          <button
            type="button"
            key={result.key}
            onClick={() => { vibrate(10); onReviewApple(apple); }}
            className="premium-card p-3 flex items-start gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all"
          >
            <MapPin size={14} className="text-ivory-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-ivory-200 text-sm">{apple.name}</p>
              {location && <p className="text-ivory-600 text-xs">{location}</p>}
              {apple.address && <p className="text-ivory-600 text-xs">{apple.address}</p>}
              {apple.website && (
                <p className="text-ivory-600 text-xs flex items-center gap-1 mt-1 truncate">
                  <Globe size={10} className="shrink-0" /> {apple.website}
                </p>
              )}
            </div>
            <ChevronRight size={14} className="text-ivory-600 shrink-0 mt-0.5" />
          </button>
        );
      })}
      {note && <p className="text-ivory-600 text-xs leading-relaxed">{note}</p>}
    </div>
  );
}
