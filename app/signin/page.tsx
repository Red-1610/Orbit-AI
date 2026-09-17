'use client';

import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Sign in attempted', { email, password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-4 py-12 text-[#172033]">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#e5eaf1] bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="bg-[#172033] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-white/10 text-[#dbeafe]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">orbit.ai</p>
                <p className="text-[10px] uppercase tracking-[.16em] text-slate-300">Secure access</p>
              </div>
            </div>
            <Link href="/" className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/90 transition hover:bg-white/10">
              <ArrowLeft size={12} /> Home
            </Link>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2563eb]">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Sign in</h1>
            <p className="mt-2 text-sm text-[#73819a]">Continue to your workspace and manage your tasks.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#536176]">
                <Mail size={14} className="text-[#2563eb]" /> Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-[#dfe6f0] bg-[#f8fafc] px-3.5 py-3 text-sm text-[#172033] outline-none transition focus:border-[#93b4f5] focus:ring-4 focus:ring-blue-50"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#536176]">
                <LockKeyhole size={14} className="text-[#2563eb]" /> Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#dfe6f0] bg-[#f8fafc] px-3.5 py-3 text-sm text-[#172033] outline-none transition focus:border-[#93b4f5] focus:ring-4 focus:ring-blue-50"
                required
              />
            </label>

            <div className="flex items-center justify-between text-xs text-[#73819a]">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-[#dfe6f0] text-[#2563eb]" />
                Remember me
              </label>
              <Link href="/" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1d4ed8]"
            >
              Sign in to workspace
            </button>
          </form>

          <div className="mt-6 border-t border-[#edf0f4] pt-5 text-center text-xs text-[#73819a]">
            Need an account?{' '}
            <Link href="/" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
              Request access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
