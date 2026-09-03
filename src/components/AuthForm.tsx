import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface AuthFormProps {
  onAuthed: () => void;
}

export default function AuthForm({ onAuthed }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nativeKeyboardHeight, setNativeKeyboardHeight] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handles: Array<() => void> = [];

    (async () => {
      try {
        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });

        const willShow = await Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
          setNativeKeyboardHeight(info.keyboardHeight);
          setTimeout(() => {
            const active = document.activeElement;
            if (active && active.tagName === 'INPUT') {
              (active as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        });
        const willHide = await Keyboard.addListener('keyboardWillHide', () => {
          setNativeKeyboardHeight(0);
        });

        handles.push(() => willShow.remove());
        handles.push(() => willHide.remove());
      } catch (e) {
        console.warn('[AuthForm] native keyboard setup failed', e);
      }
    })();

    return () => {
      handles.forEach((h) => h());
      (async () => {
        try {
          const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        } catch (e) {
          // ignore
        }
      })();
      setNativeKeyboardHeight(0);
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT') {
        (active as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    vv.addEventListener('resize', handler);
    return () => { vv.removeEventListener('resize', handler); };
  }, []);

  function focusPassword() {
    passwordRef.current?.focus();
  }

  function submitForm() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    vibrate(8);

    supabase.auth[mode === 'signin' ? 'signInWithPassword' : 'signUp']({
      email: email.trim(),
      password,
    }).then(({ error: err }) => {
      if (err) {
        setError(err.message);
        setLoading(false);
      } else {
        onAuthed();
      }
    }).catch(() => {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    });
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-4 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 200px)', paddingBottom: nativeKeyboardHeight > 0 ? `${nativeKeyboardHeight + 24}px` : '0px' }}
    >
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-ink-800/60 border border-ink-600/40 focus-within:border-gold-500/50 transition-all">
          <Mail size={16} className="text-ivory-500 shrink-0" />
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 bg-transparent text-ivory-100 placeholder:text-ivory-600 focus:outline-none text-sm"
            autoComplete="email"
            enterKeyHint="next"
            returnKeyType="next"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusPassword(); } }}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-ink-800/60 border border-ink-600/40 focus-within:border-gold-500/50 transition-all">
          <Lock size={16} className="text-ivory-500 shrink-0" />
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 bg-transparent text-ivory-100 placeholder:text-ivory-600 focus:outline-none text-sm"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            enterKeyHint="go"
            returnKeyType="go"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitForm(); } }}
          />
        </div>

        {error && <p className="text-error text-xs px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          className="btn-primary w-full disabled:opacity-40"
        >
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
        className="text-ivory-500 text-sm hover:text-gold-300 transition-colors text-center"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
