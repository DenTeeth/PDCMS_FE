"use client";

import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [type, setType] = useState<"success" | "error" | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    setType(null);

    // TODO (API): Replace with your real login call
    await new Promise((r) => setTimeout(r, 1000));

    const demoEmail = "patient@clinic.com";
    const demoPassword = "Smile123";

    if (email.trim().toLowerCase() === demoEmail && password === demoPassword) {
      setType("success");
      setNotice("Login successful (demo). Redirecting to dashboard...");
      // TODO (API): set auth state/cookie then navigate
    } else {
      setType("error");
      setNotice("Invalid email or password (demo). Try patient@clinic.com / Smile123");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent via-white to-secondary text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Visual / Brand Panel (static, no effects) */}
        <section className="relative hidden items-center justify-center p-10 md:flex">
          <div className="relative z-10 max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg">
              {/* Tooth icon */}
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 6.5C19 3.46 16.54 1 13.5 1 12.02 1 10.68 1.59 9.74 2.55 8.8 1.59 7.46 1 5.98 1 2.94 1 .48 3.46.48 6.5c0 2.68 1.72 4.95 4.12 5.73 1.31.42 2.24 1.54 2.43 2.9l.51 3.67c.16 1.11 1.11 1.95 2.24 1.95s2.08-.84 2.24-1.95l.51-3.67c.19-1.36 1.12-2.48 2.43-2.9 2.4-.78 4.12-3.05 4.12-5.73Z" />
              </svg>
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-sky-800">DenTeeth</h2>
            <p className="mx-auto max-w-sm text-sky-900/70">
              A modern solution for scheduling and managing dental clinics. Caring for smiles from the very first login.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm text-sky-900 shadow-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Patient data security
            </div>
          </div>
        </section>

        {/* Form Panel */}
        <section className="flex items-center justify-center px-6 py-10 md:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 6.5C19 3.46 16.54 1 13.5 1 12.02 1 10.68 1.59 9.74 2.55 8.8 1.59 7.46 1 5.98 1 2.94 1 .48 3.46.48 6.5c0 2.68 1.72 4.95 4.12 5.73 1.31.42 2.24 1.54 2.43 2.9l.51 3.67c.16 1.11 1.11 1.95 2.24 1.95s2.08-.84 2.24-1.95l.51-3.67c.19-1.36 1.12-2.48 2.43-2.9 2.4-.78 4.12-3.05 4.12-5.73Z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold tracking-wide text-slate-700">DenTeeth</span>
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-semibold text-slate-800">Sign in</h1>
            <p className="mb-8 text-sm text-slate-500">Access the dental clinic management system</p>

            {/* Social (optional) */}
            {/* TODO (OAuth): Wire to your OAuth flow (e.g., NextAuth signIn('google')) */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.6 2.8 14.5 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c7.2 0 8.9-5 8.3-8.1H12z" />
                </svg>
                Google
              </button>
              <button type="button" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#1877F2" d="M22 12.06C22 6.53 17.52 2 12 2S2 6.53 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.9h2.55V9.41c0-2.52 1.5-3.92 3.8-3.92 1.1 0 2.25.2 2.25.2v2.49h-1.27c-1.25 0-1.64.78-1.64 1.58v1.9h2.79l-.45 2.9h-2.34V22c4.78-.8 8.44-4.93 8.44-9.94z" />
                </svg>
                Facebook
              </button>
            </div>

            {/* Separator */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16v16H4z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@denTeeth.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-300" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-sm text-cyan-700 hover:text-cyan-800">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-white-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black-500/20 transition hover:from-purple-500 hover:to-white -500 disabled:cursor-not-allowed disabled:opacity-60">
                <span>{loading ? "Signing in..." : "Sign in"}</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>

              {notice && (
                <div className={`${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"} rounded-lg border px-3 py-2 text-sm`}>
                  {notice}
                </div>
              )}

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account? {""}
                <br/>
                Please contact: <span className="text-purple-700 font-bold">01234568</span>
              </p>
            </form>

            <div className="mt-10 text-center text-xs text-slate-400">
              {/* TODO (Security): Add reCAPTCHA if needed; verify server-side in your API */}
              © {new Date().getFullYear()} DenTeeth. Privacy & HIPAA/GDPR compliant.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
