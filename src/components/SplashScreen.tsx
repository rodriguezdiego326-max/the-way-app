import { useEffect, useState, useRef, useCallback } from 'react';
import BrandMark from '@/components/BrandMark';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'title' | 'tagline' | 'covenant' | 'exiting';

const PHASE_2_AT = 1900;
const PHASE_3_AT = 3800;
const AUTO_HANDOFF_AT = 5200;
const CROSSFADE_MS = 280;
const TAP_GUARD_MS = 400;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('title');
  const completedRef = useRef(false);
  const mountedRef = useRef(false);
  const tapEnabledRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('exiting');
    setTimeout(onComplete, CROSSFADE_MS);
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), PHASE_2_AT);
    const t2 = setTimeout(() => setPhase('covenant'), PHASE_3_AT);
    const t3 = setTimeout(finish, AUTO_HANDOFF_AT);
    const guard = setTimeout(() => { tapEnabledRef.current = true; }, TAP_GUARD_MS);
    mountedRef.current = true;
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(guard); };
  }, [finish]);

  const handleTap = useCallback(() => {
    if (!tapEnabledRef.current || completedRef.current) return;
    finish();
  }, [finish]);

  const isExiting = phase === 'exiting';

  return (
    <div
      className="app-container flex flex-col items-center justify-center bg-ink-950 bg-parchment overflow-hidden no-tap-highlight cursor-pointer"
      onClick={handleTap}
      style={{ transition: `opacity ${CROSSFADE_MS}ms ease-out`, opacity: isExiting ? 0 : 1 }}
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gold-500/8 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
        {/* Phase 1 — mark + title */}
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <BrandMark size={84} className="text-gold-400" />
          <h1 className="font-serif text-5xl text-ivory-50 tracking-[0.15em]">SOLAPATH</h1>
        </div>

        {/* Phase 2 — divider + tagline */}
        {phase !== 'title' && !isExiting && (
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="gold-divider w-24" />
            <p className="font-serif text-xl text-ivory-300 italic tracking-wide">
              Scripture for the road ahead.
            </p>
          </div>
        )}

        {/* Phase 3 — covenant line */}
        {phase === 'covenant' && !isExiting && (
          <p className="mt-2 font-serif text-base text-ivory-400 tracking-wide animate-fade-in-up">
            Sola Scriptura &middot; Sola Fide &middot; Sola Gratia
          </p>
        )}
      </div>

      {/* Subtle skip label — visually secondary */}
      {mountedRef.current && !isExiting && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-ivory-600 text-xs tracking-[0.15em] uppercase animate-fade-in no-tap-highlight pointer-events-none">
          Tap to continue
        </p>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
