import { useEffect, useState, useRef, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'title' | 'tagline' | 'solas' | 'exiting';

const TAGLINE_AT = 3000;
const SOLAS_AT = 6000;
const AUTO_HANDOFF_AT = 9000;
const CROSSFADE_MS = 320;
const TAP_GUARD_MS = 400;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('title');
  const completedRef = useRef(false);
  const tapEnabledRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('exiting');
    setTimeout(onComplete, CROSSFADE_MS);
  }, [onComplete]);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setPhase('tagline'), TAGLINE_AT);
    const solasTimer = setTimeout(() => setPhase('solas'), SOLAS_AT);
    const handoffTimer = setTimeout(finish, AUTO_HANDOFF_AT);
    const guardTimer = setTimeout(() => { tapEnabledRef.current = true; }, TAP_GUARD_MS);
    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(solasTimer);
      clearTimeout(handoffTimer);
      clearTimeout(guardTimer);
    };
  }, [finish]);

  const handleTap = useCallback(() => {
    if (!tapEnabledRef.current || completedRef.current) return;
    finish();
  }, [finish]);

  const isExiting = phase === 'exiting';

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-screen max-w-none flex-col justify-end overflow-hidden bg-ink-950 cursor-pointer no-tap-highlight"
      onClick={handleTap}
      style={{ transition: `opacity ${CROSSFADE_MS}ms ease-out`, opacity: isExiting ? 0 : 1 }}
    >
      <img
        src="/assets/solapath-scenic-emblem.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-[1.14] object-cover object-center origin-bottom"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/10 via-transparent to-ink-950/85" />

      <div className="relative z-10 px-7 pb-20 pt-[env(safe-area-inset-top,0px)] text-center safe-bottom">
        <h1 className="font-serif text-5xl font-medium text-ivory-50 tracking-[0.12em] drop-shadow-lg animate-fade-in-up">
          SOLAPATH
        </h1>
        {phase !== 'title' && !isExiting && (
          <>
            <div className="mx-auto mt-3 mb-2 flex items-center justify-center gap-3 text-gold-200/90">
              <span className="h-px w-10 bg-gold-200/60" />
              <span className="text-lg">✦</span>
              <span className="h-px w-10 bg-gold-200/60" />
            </div>
            <p className="font-serif text-xl text-ivory-100 italic tracking-wide drop-shadow-md animate-fade-in-up">
              Scripture for the road ahead.
            </p>
          </>
        )}
        {phase === 'solas' && !isExiting && (
          <p className="mx-auto mt-5 max-w-sm font-serif text-xs leading-6 text-ivory-200/90 tracking-wide animate-fade-in-up">
            Sola Scriptura &middot; Sola Fide &middot; Sola Gratia &middot; Solus Christus &middot; Soli Deo Gloria
          </p>
        )}
      </div>
      {!isExiting && (
        <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs uppercase tracking-[0.15em] text-ivory-300/75 pointer-events-none">
          Tap to continue
        </p>
      )}
    </div>
  );
}
