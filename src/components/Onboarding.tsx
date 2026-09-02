import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { TheologicalDepth } from '@/lib/types';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
  saving?: boolean;
  error?: string | null;
}

export interface OnboardingData {
  display_name: string;
  life_stage: string;
  season: string;
  preferred_translation: string;
  theological_depth: TheologicalDepth;
  available_time_minutes: number;
  bible_familiarity: string;
  memory_enabled: boolean;
}

const translations = ['ESV', 'NASB', 'NKJV', 'NIV', 'CSB', 'KJV'];

const lifeStages = [
  'Student',
  'Young adult',
  'Married',
  'Parent of young children',
  'Parent of teens',
  'Empty nest',
  'Retired',
];

const seasons = [
  'Growing',
  'Dry',
  'Busy',
  'Grieving',
  'New to faith',
  'Returning to faith',
  'Steady',
];

const familiarity = ['New to the Bible', 'Some familiarity', 'Comfortable', 'Experienced', 'Studied deeply'];

const depthOptions: { value: TheologicalDepth; label: string; desc: string }[] = [
  { value: 'simple', label: 'Simple', desc: 'Plain-language explanation' },
  { value: 'study', label: 'Study', desc: 'Scripture, context, cross-references, doctrine' },
  { value: 'deep_study', label: 'Deep Study', desc: 'Confessional, historical, original-language depth' },
];

const timeOptions = [5, 7, 10, 15, 20];

export default function Onboarding({ onComplete, saving, error }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    life_stage: '',
    season: '',
    preferred_translation: 'ESV',
    theological_depth: 'simple',
    available_time_minutes: 7,
    bible_familiarity: '',
    memory_enabled: true,
  });

  const totalSteps = 6;
  const isLast = step === totalSteps - 1;

  const next = () => {
    vibrate(8);
    if (isLast) {
      if (!saving) onComplete(data);
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    vibrate(8);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="app-container flex flex-col bg-ink-950 bg-parchment min-h-screen">
      {/* Progress */}
      <div className="flex items-center gap-1.5 px-6 pt-12 safe-top">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-gold-400/70' : 'bg-ink-700'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {step === 0 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Welcome</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                What may we call you?
              </h2>
            </div>
            <input
              autoFocus
              type="text"
              value={data.display_name}
              onChange={(e) => setData({ ...data, display_name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              placeholder="Your name"
              className="input-field text-lg"
            />
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Life Context</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                What is your life stage?
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {lifeStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => {
                    vibrate(8);
                    setData({ ...data, life_stage: stage });
                  }}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 no-tap-highlight ${
                    data.life_stage === stage
                      ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                      : 'bg-ink-800/40 border-ink-700/40 text-ivory-300 hover:border-ink-600'
                  }`}
                >
                  <span className="font-medium">{stage}</span>
                  {data.life_stage === stage && <Check size={18} className="text-gold-300" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Current Season</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                How would you describe this season?
              </h2>
              <p className="text-ivory-500 mt-2 text-sm">This helps SOLAPATH walk with you gently.</p>
            </div>
            <div className="flex flex-col gap-2">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    vibrate(8);
                    setData({ ...data, season: s });
                  }}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 no-tap-highlight ${
                    data.season === s
                      ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                      : 'bg-ink-800/40 border-ink-700/40 text-ivory-300 hover:border-ink-600'
                  }`}
                >
                  <span className="font-medium">{s}</span>
                  {data.season === s && <Check size={18} className="text-gold-300" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Translation</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                Preferred Bible translation?
              </h2>
              <p className="text-ivory-500 mt-2 text-sm">You can change this anytime.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {translations.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    vibrate(8);
                    setData({ ...data, preferred_translation: t });
                  }}
                  className={`px-3 py-4 rounded-2xl border font-medium transition-all duration-200 no-tap-highlight ${
                    data.preferred_translation === t
                      ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                      : 'bg-ink-800/40 border-ink-700/40 text-ivory-300 hover:border-ink-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Theological Depth</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                How deep would you like to go?
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {depthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    vibrate(8);
                    setData({ ...data, theological_depth: opt.value });
                  }}
                  className={`flex flex-col items-start gap-1 px-5 py-4 rounded-2xl border text-left transition-all duration-200 no-tap-highlight ${
                    data.theological_depth === opt.value
                      ? 'bg-gold-500/10 border-gold-500/40'
                      : 'bg-ink-800/40 border-ink-700/40 hover:border-ink-600'
                  }`}
                >
                  <span className={`font-medium ${data.theological_depth === opt.value ? 'text-ivory-50' : 'text-ivory-200'}`}>
                    {opt.label}
                  </span>
                  <span className="text-sm text-ivory-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in-up flex flex-col gap-6">
            <div>
              <p className="ui-label mb-3">Almost There</p>
              <h2 className="font-serif text-4xl text-ivory-50 leading-tight">
                A few final questions
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Available devotional time</label>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        vibrate(8);
                        setData({ ...data, available_time_minutes: t });
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                        data.available_time_minutes === t
                          ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                          : 'bg-ink-800/40 border-ink-700/40 text-ivory-300'
                      }`}
                    >
                      {t} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-ivory-400 mb-2 block">Bible familiarity</label>
                <div className="flex flex-col gap-1.5">
                  {familiarity.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        vibrate(8);
                        setData({ ...data, bible_familiarity: f });
                      }}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left no-tap-highlight ${
                        data.bible_familiarity === f
                          ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                          : 'bg-ink-800/40 border-ink-700/40 text-ivory-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="premium-card p-4 mt-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-ivory-100 font-medium text-sm">Remember my context</p>
                    <p className="text-ivory-500 text-xs mt-1 leading-relaxed">
                      SOLAPATH can remember your season, goals, and reflections to walk with you more personally. You control everything it remembers — and can forget it anytime.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      vibrate(10);
                      setData({ ...data, memory_enabled: !data.memory_enabled });
                    }}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${
                      data.memory_enabled ? 'bg-gold-500/40' : 'bg-ink-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${
                        data.memory_enabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-2 px-6 pb-10 safe-bottom">
        {error && isLast && (
          <p className="text-error text-sm text-center animate-fade-in">{error}</p>
        )}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={back} className="btn-ghost" disabled={saving}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={next}
            className="btn-primary"
            disabled={(step === 0 && !data.display_name.trim()) || saving}
          >
            {saving ? 'Starting...' : isLast ? 'Begin' : 'Continue'}
            {!saving && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
