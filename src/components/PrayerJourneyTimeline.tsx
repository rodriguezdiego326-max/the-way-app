import { formatPrayerDate, type PrayerCopy, type PrayerLang } from '@/lib/prayerCopy';
import type { JourneyEvent, JourneyEventKind } from '@/lib/prayerJourney';

interface Props {
  events: JourneyEvent[];
  copy: PrayerCopy;
  lang: PrayerLang;
  onEditReflection: (id: string) => void;
}

const dotClass: Record<JourneyEventKind, string> = {
  began: 'bg-ink-900 border-gold-400/70',
  prayed: 'bg-gold-400 border-gold-300',
  update: 'bg-ink-900 border-ivory-500',
  reflection: 'bg-ink-900 border-gold-300/70',
  answered: 'bg-sage-400 border-sage-400',
};

export default function PrayerJourneyTimeline({ events, copy, lang, onEditReflection }: Props) {
  const labelFor: Record<JourneyEventKind, string> = {
    began: copy.journeyBegan,
    prayed: copy.journeyPrayed,
    update: copy.update,
    reflection: copy.reflection,
    answered: copy.journeyAnswered,
  };

  return (
    <ol className="relative flex flex-col gap-6 pl-7 before:absolute before:left-[6px] before:top-2 before:bottom-2 before:w-px before:bg-ink-700/70">
      {events.map((event) => (
        <li key={event.id} className="relative animate-fade-in">
          <span className={`absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border ${dotClass[event.kind]}`} />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] uppercase tracking-wider font-medium text-gold-400/80">{labelFor[event.kind]}</p>
            <span className="text-ivory-600 text-xs shrink-0">{formatPrayerDate(event.at, lang)}</span>
          </div>
          {event.body && (
            <div className="premium-card p-4 mt-2">
              <p className="text-ivory-300 text-sm leading-relaxed whitespace-pre-wrap">{event.body}</p>
              {event.editable && (
                <button onClick={() => onEditReflection(event.id)} className="btn-ghost text-xs mt-3">
                  {copy.editReflection}
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
