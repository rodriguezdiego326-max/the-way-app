import { useEffect } from 'react';
import BrandMark from '@/components/BrandMark';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const frame = requestAnimationFrame(onComplete);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div className="app-container flex flex-col items-center justify-center bg-ink-950 bg-parchment overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center animate-fade-in">
        <BrandMark size={84} className="text-gold-400" />
        <h1 className="font-serif text-5xl text-ivory-50 tracking-[0.15em]">SOLAPATH</h1>
        <div className="gold-divider w-24" />
        <p className="font-serif text-xl text-ivory-300 italic tracking-wide">Scripture for the road ahead.</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
