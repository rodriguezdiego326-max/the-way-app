import { useState } from 'react';
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    vibrate(8);

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
      }
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-ink-800/60 border border-ink-600/40 focus-within:border-gold-500/50 transition-all">
        <Mail size={16} className="text-ivory-500 shrink-0" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1 bg-transparent text-ivory-100 placeholder:text-ivory-600 focus:outline-none text-sm"
          autoComplete="email"
        />
      </div>
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-ink-800/60 border border-ink-600/40 focus-within:border-gold-500/50 transition-all">
        <Lock size={16} className="text-ivory-500 shrink-0" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="flex-1 bg-transparent text-ivory-100 placeholder:text-ivory-600 focus:outline-none text-sm"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

      <button
        type="button"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
        className="text-ivory-500 text-sm hover:text-gold-300 transition-colors text-center"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}
