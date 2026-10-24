import { useEffect, useState } from 'react';
import BrandMark from '@/components/BrandMark';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'title' | 'tagline' | 'covenant';

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('title');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 3000);
    const t2 = setTimeout(() => setPhase('covenant'), 6000);
    const t3 = setTimeout(onComplete, 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="app-container flex flex-col items-center justify-center bg-ink-950 bg-parchment overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gold-500/8 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
        {/* Phase 1 — mark + title */}
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <BrandMark size={84} className="text-gold-400" />
          <h1 className="font-serif text-5xl text-ivory-50 tracking-[0.15em]">SOLAPATH</h1>
        </div>

        {/* Phase 2 — divider + tagline */}
        {phase !== 'title' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="gold-divider w-24" />
            <p className="font-serif text-xl text-ivory-300 italic tracking-wide">
              Scripture for the road ahead.
            </p>
          </div>
        )}

        {/* Phase 3 — covenant line */}
        {phase === 'covenant' && (
          <p className="mt-2 font-serif text-base text-ivory-400 tracking-wide animate-fade-in-up">
            Sola Scriptura &middot; Sola Fide &middot; Sola Gratia
          </p>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
