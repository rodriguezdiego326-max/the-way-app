import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AuthForm from '@/components/AuthForm';

interface WelcomeScreenProps {
  onAuthed: () => void;
}

type AuthMode = 'signin' | 'signup';

export default function WelcomeScreen({ onAuthed }: WelcomeScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  if (authMode) {
    return (
      <div className="app-container bg-parchment min-h-screen overflow-y-auto safe-top">
        <div className="min-h-screen flex flex-col justify-center px-6 py-16">
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setAuthMode(null)}
              className="flex items-center gap-2 text-ink-200 hover:text-gold-600 transition-colors text-sm mb-8"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="text-center mb-8">
              <div className="mb-5 flex justify-center">
                <img
                  src="/assets/solapath-scenic-emblem.png"
                  width={72}
                  height={72}
                  alt="SOLAPATH — Scripture for the road ahead."
                  className="rounded-2xl object-cover"
                />
              </div>
              <h1 className="font-serif text-3xl text-ivory-50 tracking-tight mb-2">SOLAPATH</h1>
              <p className="text-ivory-500 text-sm">Scripture for the road ahead.</p>
            </div>
            <AuthForm initialMode={authMode} onAuthed={onAuthed} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-parchment min-h-screen overflow-y-auto safe-top relative">
      <div className="absolute inset-x-0 bottom-0 h-72 overflow-hidden pointer-events-none opacity-35">
        <img
          src="/assets/solapath-scenic-emblem.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-parchment via-parchment/65 to-transparent" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <img
            src="/assets/solapath-scenic-emblem.png"
            width={144}
            height={144}
            alt="SOLAPATH — Scripture for the road ahead."
            className="mx-auto rounded-[2rem] object-cover shadow-xl shadow-ink-950/15 mb-6"
          />
          <h1 className="font-serif text-5xl font-medium text-ivory-50 tracking-tight mb-2">SOLAPATH</h1>
          <p className="font-serif text-xl text-ivory-200 italic mb-9">Scripture for the road ahead.</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className="btn-primary w-full justify-center rounded-full bg-gradient-to-b from-gold-700 to-gold-800 text-ivory-50 shadow-lg shadow-gold-900/20"
            >
              Get Started
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-gold-500/70 bg-ink-800/70 px-5 py-3.5 text-sm font-medium text-ink-50 hover:bg-ink-800 transition-colors"
            >
              I Already Have an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
