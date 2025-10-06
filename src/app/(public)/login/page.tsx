"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [type, setType] = useState<"success" | "error" | null>(null);
  
  const { login, isAuthenticated, user, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check user role and redirect accordingly
      if (user.roles.includes('ADMIN')) {
        router.push('/admin');
      } else if (user.roles.includes('RECEPTIONIST')) {
        router.push('/receptionist');
      } else if (user.roles.includes('DENTIST')) {
        router.push('/dentist');
      } else if (user.roles.includes('MANAGER')) {
        router.push('/manager');
      } else if (user.roles.includes('ACCOUNTANT')) {
        router.push('/accountant');
      } else if (user.roles.includes('WAREHOUSE')) {
        router.push('/warehouse');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    setType(null);
    clearError();

    try {
      await login({
        username: username.trim(),
        password: password,
      });

      // Show success toast with username
      toast.success(
        <div>
          <div>Login successfully</div>
          <div>Welcome, {username}</div>
        </div>
      );

      setType("success");
      setNotice("Login successful! Redirecting...");
      
      // The redirect will be handled by the useEffect above
    } catch (error) {
      // Show error toast
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
      
      setType("error");
      setNotice(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                <Link href="/forgot-password" className="text-sm text-purple-700 hover:text-purple-800 font-">Forgot password?</Link>
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
