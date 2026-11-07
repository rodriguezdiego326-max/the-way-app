import { useState, type ReactNode } from 'react';
import { X, BookOpen, ChevronDown, Users } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { parentGuides, type ParentGuide } from '@/lib/parentGuideContent';

interface ParentGuideScreenProps {
  onBack: () => void;
}

export default function ParentGuideScreen({ onBack }: ParentGuideScreenProps) {
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">Parent Guide</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Parent Guide</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                SOLAPATH helps parents think biblically about discipling their children — not just parenting hacks.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {parentGuides.map((guide) => {
              const isExpanded = expandedGuide === guide.id;
              return (
                <div key={guide.id} className="premium-card overflow-hidden">
                  <button
                    onClick={() => {
                      vibrate(6);
                      setExpandedGuide(isExpanded ? null : guide.id);
                    }}
                    aria-expanded={isExpanded}
                    className="flex items-center justify-between w-full p-4 text-left no-tap-highlight"
                  >
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{guide.title}</p>
                      <p className="text-ivory-500 text-xs mt-0.5">{guide.description}</p>
                    </div>
                    <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-5 animate-fade-in">
                      <div className="gold-divider mb-4" />
                      <GuideDetail guide={guide} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Users size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed">
              SOLAPATH Family equips the parent. It does not replace the parent. The primary discipleship relationship is parent to child, not AI to child.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideDetail({ guide }: { guide: ParentGuide }) {
  return (
    <div className="space-y-5">
      <GuideBlock title="The Goal">
        <p className="text-ivory-300 text-sm leading-relaxed">{guide.goal}</p>
      </GuideBlock>

      <GuideBlock title="Start Here">
        <p className="text-ivory-300 text-sm leading-relaxed">{guide.start_here}</p>
      </GuideBlock>

      <GuideBlock title="Step-by-Step">
        <ol className="list-decimal pl-5 space-y-1.5 text-ivory-300 text-sm leading-relaxed marker:text-gold-400/70">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </GuideBlock>

      <GuideBlock title="What You Can Say">
        <ul className="space-y-2">
          {guide.what_you_can_say.map((line) => (
            <li key={line} className="text-ivory-300 text-sm leading-relaxed italic">&ldquo;{line}&rdquo;</li>
          ))}
        </ul>
      </GuideBlock>

      <GuideBlock title="Adjust by Age">
        <ul className="space-y-2">
          {guide.adjust_by_age.map((item) => (
            <li key={item.ages} className="text-ivory-300 text-sm leading-relaxed">
              <span className="text-ivory-100 font-medium">{item.ages}: </span>
              {item.note}
            </li>
          ))}
        </ul>
      </GuideBlock>

      <GuideBlock title="Common Mistakes">
        <ul className="list-disc pl-5 space-y-1.5 text-ivory-300 text-sm leading-relaxed marker:text-gold-400/70">
          {guide.common_mistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </GuideBlock>

      <GuideBlock title="Try This This Week">
        <p className="text-ivory-300 text-sm leading-relaxed">{guide.try_this_week}</p>
      </GuideBlock>

      <GuideBlock title="Scripture to Read">
        <ul className="space-y-2">
          {guide.scripture.map((item) => (
            <li key={item.reference} className="text-sm leading-relaxed">
              <span className="text-gold-200 font-medium">{item.reference}</span>
              <span className="text-ivory-400"> — {item.note}</span>
            </li>
          ))}
        </ul>
      </GuideBlock>

      <GuideBlock title="Pray">
        <p className="text-ivory-400 text-sm leading-relaxed italic">{guide.pray}</p>
      </GuideBlock>
    </div>
  );
}

function GuideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="ui-label mb-2">{title}</p>
      {children}
    </div>
  );
}
