import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { vibrate } from '@/lib/utils';

const THRESHOLD_PX = 72;
const MAX_PULL_PX = 110;
const RESISTANCE = 0.5;
const HOLD_PX = 44;
const FAILURE_MESSAGE_MS = 3000;
const HORIZONTAL_CANCEL_PX = 12;

type Phase = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'failed';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const STATUS_TEXT: Record<Exclude<Phase, 'idle'>, string> = {
  pulling: 'Pull to refresh',
  armed: 'Release to refresh',
  refreshing: 'Refreshing...',
  failed: "Couldn't refresh. Pull down to try again.",
};

function isTypingTarget(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
}

export default function PullToRefresh({ onRefresh, disabled = false, className = '', children }: PullToRefreshProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const refreshingRef = useRef(false);
  const armedRef = useRef(false);
  const mountedRef = useRef(true);
  const [distance, setDistance] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'failed') return;
    const timer = window.setTimeout(() => {
      if (mountedRef.current) setPhase('idle');
    }, FAILURE_MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function reset() {
    startRef.current = null;
    armedRef.current = false;
    setDistance(0);
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    const el = rootRef.current;
    if (disabled || refreshingRef.current || !el || el.scrollTop > 0 || isTypingTarget()) {
      startRef.current = null;
      return;
    }
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    armedRef.current = false;
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    const start = startRef.current;
    const el = rootRef.current;
    if (!start || !el) return;
    if (el.scrollTop > 0) {
      reset();
      setPhase('idle');
      return;
    }
    const touch = e.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > HORIZONTAL_CANCEL_PX && Math.abs(dx) > Math.abs(dy)) {
      reset();
      setPhase('idle');
      return;
    }
    if (dy <= 0) {
      setDistance(0);
      setPhase('idle');
      return;
    }
    const applied = Math.min(dy * RESISTANCE, MAX_PULL_PX);
    setDistance(applied);
    if (dy >= THRESHOLD_PX) {
      if (!armedRef.current) {
        armedRef.current = true;
        vibrate(10);
      }
      setPhase('armed');
    } else {
      setPhase('pulling');
    }
  }

  async function handleTouchEnd() {
    const wasArmed = armedRef.current;
    startRef.current = null;
    armedRef.current = false;
    if (!wasArmed || refreshingRef.current) {
      setDistance(0);
      setPhase('idle');
      return;
    }
    refreshingRef.current = true;
    setDistance(HOLD_PX);
    setPhase('refreshing');
    try {
      await onRefresh();
      if (mountedRef.current) {
        setDistance(0);
        setPhase('idle');
      }
    } catch {
      if (mountedRef.current) {
        setDistance(0);
        setPhase('failed');
      }
    } finally {
      refreshingRef.current = false;
    }
  }

  const showIndicator = phase !== 'idle' || distance > 0;
  const indicatorText = phase === 'idle' ? '' : STATUS_TEXT[phase];
  const progress = Math.min(distance / (THRESHOLD_PX * RESISTANCE), 1);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-y-auto overscroll-y-contain ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center overflow-hidden"
        style={{ height: distance, opacity: showIndicator ? Math.max(progress, phase === 'refreshing' ? 1 : 0) : 0 }}
      >
        <div className="flex items-center gap-2 text-xs text-ivory-400">
          <RefreshCw
            size={14}
            className={`text-gold-300 ${phase === 'refreshing' ? 'animate-spin motion-reduce:animate-none' : ''}`}
            style={phase === 'refreshing' ? undefined : { transform: `rotate(${progress * 180}deg)` }}
            aria-hidden="true"
          />
          <span>{indicatorText}</span>
        </div>
      </div>
      <div
        style={{ transform: `translateY(${distance}px)`, transition: startRef.current ? 'none' : 'transform 200ms ease-out' }}
        className="motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}
