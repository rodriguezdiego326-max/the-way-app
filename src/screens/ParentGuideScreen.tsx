import { useState } from 'react';
import {
  X, BookOpen, ChevronRight, ChevronDown, Info, Heart, Users,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { parentGuideSections } from '@/lib/familyEngine';

interface ParentGuideScreenProps {
  onBack: () => void;
}

export default function ParentGuideScreen({ onBack }: ParentGuideScreenProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
            {parentGuideSections.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
                <div key={section.id} className="premium-card overflow-hidden">
                  <button
                    onClick={() => {
                      vibrate(6);
                      setExpandedSection(isExpanded ? null : section.id);
                    }}
                    className="flex items-center justify-between w-full p-4 text-left no-tap-highlight"
                  >
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{section.title}</p>
                      <p className="text-ivory-500 text-xs mt-0.5">{section.description}</p>
                    </div>
                    <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="gold-divider mb-3" />
                      <p className="text-ivory-300 text-sm leading-relaxed">{section.content}</p>
                      <p className="text-ivory-600 text-xs mt-3 italic">
                        Development content — verified parenting and discipleship resources connect here.
                      </p>
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
