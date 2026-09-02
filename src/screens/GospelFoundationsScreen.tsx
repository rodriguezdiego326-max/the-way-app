import { useState } from 'react';
import {
  X, BookOpen, ChevronRight, ChevronDown, Info, Sparkles, ShieldCheck,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { gospelFoundations } from '@/lib/reachEngine';
import { familyEvangelismGuidance, prayingForSomeoneThemes } from '@/lib/reachEngine';
import type { GospelFoundationLesson } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function GospelFoundationsScreen({ onBack }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Gospel Foundations</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Gospel Foundations</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">The Gospel pathway — Scripture-first teaching.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">Reformed theology clearly affirms God's sovereignty and grace without turning the Gospel into a denominational argument.</p>
          </div>

          {/* Pathway */}
          <div className="space-y-2">
            {gospelFoundations.map((lesson) => {
              const isExpanded = expanded === lesson.number;
              return <LessonCard key={lesson.number} lesson={lesson} isExpanded={isExpanded} onToggle={() => { vibrate(6); setExpanded(isExpanded ? null : lesson.number); }} />;
            })}
          </div>

          {/* Family evangelism */}
          <div className="mt-6 premium-card p-4 border-clay-500/20">
            <p className="text-sm text-ivory-100 font-medium mb-2">{familyEvangelismGuidance.title}</p>
            <p className="text-ivory-400 text-xs leading-relaxed">{familyEvangelismGuidance.content}</p>
            <p className="text-gold-300 text-xs mt-2 italic font-serif">{familyEvangelismGuidance.scripture}</p>
          </div>

          {/* Praying for someone */}
          <div className="mt-4">
            <p className="ui-label mb-3">Praying for Someone</p>
            <div className="space-y-2">
              {prayingForSomeoneThemes.map((t, i) => (
                <div key={i} className="premium-card p-3">
                  <p className="text-ivory-200 text-sm font-medium">{t.theme}</p>
                  <p className="text-gold-300 text-xs italic font-serif mt-1">{t.scripture}</p>
                  <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{t.prayer}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-3 px-1">
              <ShieldCheck size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-600 text-xs leading-relaxed">SOLAPATH never claims "God told me this person will be saved." Never predicts salvation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonCard({ lesson, isExpanded, onToggle }: { lesson: GospelFoundationLesson; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="premium-card overflow-hidden">
      <button onClick={onToggle} className="flex items-center justify-between w-full p-4 text-left no-tap-highlight">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
            <span className="text-ivory-500 text-xs font-medium">{lesson.number}</span>
          </div>
          <div className="flex-1">
            <p className="text-ivory-100 font-medium text-sm">{lesson.title}</p>
            <p className="text-ivory-500 text-xs mt-0.5">{lesson.passage}</p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="gold-divider mb-3" />
          <p className="text-ivory-300 text-sm leading-relaxed mb-3">{lesson.description}</p>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <div>
              <p className="ui-label mb-1">Open Your Bible</p>
              <p className="text-ivory-300 text-sm leading-relaxed">{lesson.passage}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="ui-label mb-1">Key Truth</p>
            <p className="text-ivory-200 text-sm leading-relaxed">{lesson.key_truth}</p>
          </div>
        </div>
      )}
    </div>
  );
}
