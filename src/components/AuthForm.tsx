import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onAuthed: () => void;
}

export default function AuthForm({ onAuthed }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onViewportResize() {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        const el = document.activeElement as HTMLElement;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    window.visualViewport?.addEventListener('resize', onViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', onViewportResize);
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
      style={{ maxHeight: 'calc(100vh - 200px)' }}
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
