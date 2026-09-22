'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import Link from 'next/link';

export default function SignInPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email ?? email.trim(),
      full_name: name.trim() || data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
    });

    router.push('/workspace');
    router.refresh();
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Enter your name, email, and password to create an account.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Your password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/workspace`,
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.session) {
      router.push('/workspace');
      router.refresh();
    } else {
      setErrorMsg('Check your email for the confirmation link.');
    }
    setLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (isSignUp) {
      event.preventDefault();
      await handleSignUp();
      return;
    }

    await handleSignIn(event);
  };

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setErrorMsg(null);
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/workspace`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'OAuth sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_#0f172a_42%,_#020617_100%)] p-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">Orbit AI</p>
            <div className={`flex w-[200%] transform transition-transform duration-500 ease-out ${isSignUp ? '-translate-x-1/2' : 'translate-x-0'}`}>
              <h1 className="mt-2 w-1/2 shrink-0 text-2xl font-bold tracking-tight">Welcome back</h1>
              <h1 className="mt-2 w-1/2 shrink-0 text-2xl font-bold tracking-tight">Create your account</h1>
            </div>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30">
            <span className="text-lg font-bold">AI</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="mb-5 flex rounded-xl bg-slate-900/80 p-1 ring-1 ring-slate-800">
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`w-1/2 rounded-lg px-3 py-2 text-xs font-semibold transition ${!isSignUp ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-400 hover:text-white'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`w-1/2 rounded-lg px-3 py-2 text-xs font-semibold transition ${isSignUp ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-400 hover:text-white'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`overflow-hidden transition-all duration-500 ${isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Name</label>
              <input
                type="text"
                required={isSignUp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                tabIndex={isSignUp ? 0 : -1}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Password</label>
            <input
              type="password"
              required
              minLength={isSignUp ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="overflow-hidden">
            <div className={`flex w-[200%] transform transition-transform duration-500 ease-out ${isSignUp ? '-translate-x-1/2' : 'translate-x-0'}`}>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchMode(!isSignUp)}
            disabled={loading}
            className="w-full text-xs text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="h-px w-full bg-slate-800" />
          <span className="absolute bg-slate-950 px-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">or</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/landingpage" className="font-medium text-slate-200 transition hover:text-white underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}