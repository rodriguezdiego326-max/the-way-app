import { useState } from 'react';
import { X, User, ArrowRight, Sparkles, Check } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { retrieveSources } from '@/lib/libraryEngine';
import type { Sermon } from '@/lib/togetherTypes';

interface Props {
  sermon: Sermon;
  onBack: () => void;
}

export default function AskMyPastorScreen({ sermon, onBack }: Props) {
  const [userQuestion, setUserQuestion] = useState('');
  const [pastorQuestion, setPastorQuestion] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!userQuestion.trim()) return;
    vibrate(15);
    setGenerating(true);
    try {
      const rag = await retrieveSources(sermon.passage);
      const contextAuthors = rag.citations.map((c) => c.display_author).filter(Boolean).slice(0, 2).join(', ');
      const passage = sermon.passage;
      const q = userQuestion.trim();

      const generated = `Pastor, when you talked about ${q.toLowerCase().includes('union') ? 'union with Christ' : q} from ${passage}` +
        (contextAuthors ? `, could you explain how that relates to what ${contextAuthors} taught` : '') +
        `? I want to understand this more deeply.`;

      setPastorQuestion(generated);
    } catch {
      setPastorQuestion(`Pastor, I have a question about ${sermon.passage}: ${userQuestion.trim()}. Could you help me understand this more deeply?`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Ask My Pastor</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <User size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Ask My Pastor</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">SOLAPATH helps you formulate thoughtful questions. It does not answer as the pastor.</p>
            </div>
          </div>

          <div className="premium-card p-4 mb-4">
            <p className="text-ivory-500 text-xs mb-1">Sermon passage</p>
            <p className="font-serif text-lg text-ivory-100">{sermon.passage}</p>
          </div>

          <div className="mb-4">
            <p className="ui-label mb-2">What don't you understand?</p>
            <textarea
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="I don't understand what my pastor meant by union with Christ..."
              className="input-field min-h-[80px] resize-none text-sm"
              autoFocus
            />
          </div>

          <button onClick={handleGenerate} disabled={generating || !userQuestion.trim()} className="btn-primary w-full mb-4 disabled:opacity-40">
            <ArrowRight size={16} /> {generating ? 'Formulating...' : 'Formulate Question'}
          </button>

          {pastorQuestion && (
            <div className="animate-fade-in">
              <div className="premium-card p-5 mb-4 border-gold-500/20">
                <p className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium mb-2">Suggested Question for Your Pastor</p>
                <p className="text-ivory-200 text-sm leading-relaxed font-serif italic">"{pastorQuestion}"</p>
              </div>

              <button
                onClick={() => { vibrate(8); navigator.clipboard?.writeText(pastorQuestion); }}
                className="btn-secondary w-full"
              >
                <Check size={14} /> Copy to Clipboard
              </button>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              SOLAPATH does not answer as the pastor. It helps you ask better questions. Your pastor is your shepherd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
