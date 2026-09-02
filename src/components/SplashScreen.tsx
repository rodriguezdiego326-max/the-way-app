import { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'title' | 'tagline' | 'covenant'>('title');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startPhaseTimer('title');
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function startPhaseTimer(p: 'title' | 'tagline' | 'covenant') {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advance(p), 3000);
  }

  function advance(current: 'title' | 'tagline' | 'covenant') {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (current === 'title') {
      setPhase('tagline');
      startPhaseTimer('tagline');
    } else if (current === 'tagline') {
      setPhase('covenant');
      startPhaseTimer('covenant');
    } else {
      onComplete();
    }
  }

  return (
    <div
      onClick={() => advance(phase)}
      className="app-container flex flex-col items-center justify-center bg-ink-950 bg-parchment overflow-hidden cursor-pointer"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl animate-breathe" />

      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        {phase === 'title' && (
          <h1 className="font-serif text-6xl text-ivory-50 tracking-[0.15em] animate-fade-in">
            SOLAPATH
          </h1>
        )}

        {phase === 'tagline' && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <h1 className="font-serif text-5xl text-ivory-50 tracking-[0.15em]">
              SOLAPATH
            </h1>
            <div className="gold-divider w-24" />
            <p className="font-serif text-xl text-ivory-300 italic tracking-wide">
              Walk with God through real life.
            </p>
          </div>
        )}

        {phase === 'covenant' && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <h1 className="font-serif text-5xl text-ivory-50 tracking-[0.15em]">
              SOLAPATH
            </h1>
            <div className="gold-divider w-24" />
            <p className="font-serif text-xl text-ivory-300 italic tracking-wide">
              Walk with God through real life.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gold-400/80 font-medium">
              AI is the servant. Scripture is the authority.
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
