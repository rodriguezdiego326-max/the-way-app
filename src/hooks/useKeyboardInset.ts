import { useEffect, useState } from 'react';
import type { FocusEvent } from 'react';
import { Capacitor } from '@capacitor/core';

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let cancelled = false;
      const handles: Array<() => void> = [];

      (async () => {
        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          const willShow = await Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
            setInset(info.keyboardHeight);
          });
          const willHide = await Keyboard.addListener('keyboardWillHide', () => setInset(0));
          if (cancelled) {
            willShow.remove();
            willHide.remove();
            return;
          }
          handles.push(() => willShow.remove(), () => willHide.remove());
        } catch (e) {
          console.warn('[useKeyboardInset] native keyboard listeners failed', e);
        }
      })();

      return () => {
        cancelled = true;
        handles.forEach((h) => h());
        setInset(0);
      };
    }

    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setInset(0);
    };
  }, []);

  return inset;
}

export function revealFocusedField(e: FocusEvent<HTMLElement>): void {
  const el = e.currentTarget;
  window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
}
