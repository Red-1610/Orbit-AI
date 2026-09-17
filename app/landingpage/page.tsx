'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-4 py-12 text-[#172033]">
      <div className="w-full max-w-xl rounded-[28px] border border-[#e5eaf1] bg-white p-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2563eb]">Orbit AI</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em]">Your AI workspace</h1>
        <p className="mt-3 text-base text-[#73819a]">
          Manage tasks, automate workflows, and keep your team moving with one focused agent workspace.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1d4ed8]"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[#dfe6f0] bg-[#f8fafc] px-5 py-3 text-sm font-semibold text-[#172033] transition hover:bg-[#f1f5f9]"
          >
            Go to main app
          </Link>
        </div>
      </div>
    </main>
  );
}