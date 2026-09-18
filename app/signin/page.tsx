'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('Check your email for the confirmation link.');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-zinc-950 text-white">
      <div className="w-full max-w-sm space-y-6 border border-zinc-800 p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Welcome to Orbit AI</h1>
          <p className="text-xs text-zinc-400">Sign in to access your agent workspace</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3 py-2 text-sm bg-zinc-800/60 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-zinc-800/60 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-sm transition disabled:opacity-50"
          >
            Create Account
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-800 w-full" />
          <span className="bg-zinc-900 px-2 text-[10px] uppercase text-zinc-500 tracking-wider absolute">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="py-2 px-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/60 text-xs font-medium text-zinc-300 transition"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="py-2 px-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/60 text-xs font-medium text-zinc-300 transition"
          >
            Google
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500 pt-2">
          <Link href="/landingpage" className="hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}