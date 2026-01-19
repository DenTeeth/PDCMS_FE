"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [type, setType] = useState<"success" | "error" | null>(null);

  const { login, error, clearError } = useAuth();
  const router = useRouter();

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
          <div>Đăng nhập thành công</div>
          <div>Chào mừng, {username}</div>
        </div>
      );

      setType("success");
      setNotice("Đăng nhập thành công! Đang chuyển hướng...");

      // The redirect will be handled by AuthRedirect component
    } catch (error) {
      // Show error toast
      toast.error(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");

      setType("error");
      setNotice(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthRedirect>
      <main className="min-h-screen bg-gradient-to-br from-accent via-white to-secondary text-foreground">
        <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-2">
          {/* Visual / Brand Panel (static, no effects) */}
          <section className="relative hidden items-center justify-center p-10 md:flex bg-gradient-to-br from-[#8b5fbf]/10 to-[#1e3a5f]/10">
            <div className="relative z-10 max-w-md text-center">
              <div className="mx-auto flex items-center justify-center">
                <Image
                  src="/denteeth-logo.png"
                  alt="DenTeeth Logo"
                  width={400}
                  height={100}
                  className="w-auto h-40"
                  priority
                />
              </div>

              <p className="mx-auto max-w-sm text-xl font-semibold text-gray-800 tracking-wide">
                Chăm sóc từ Tâm, Nâng tầm nụ cười
              </p>
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
                  Quay lại
                </Link>
              </div>

              <h1 className="mb-2 text-2xl font-semibold text-slate-800">Đăng nhập</h1>
              <p className="mb-8 text-sm text-slate-500">Truy cập hệ thống quản lý phòng khám nha khoa</p>

              {/* Form */}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Tên đăng nhập</label>
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
                      placeholder="Tên tài khoản"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8b5fbf] focus:ring-2 focus:ring-[#8b5fbf]/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8b5fbf] focus:ring-2 focus:ring-[#8b5fbf]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href="/forgot-password" className="text-sm text-[#8b5fbf] hover:text-[#7a4eae] font-medium">Quên mật khẩu?</Link>
                </div>

                <button type="submit" disabled={loading} className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#8b5fbf] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#7a4eae] transition disabled:cursor-not-allowed disabled:opacity-60">
                  <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
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
                  Bạn chưa có tài khoản? {""}
                  <br />
                  Vui lòng liên hệ: <span className="text-[#8b5fbf]">076 400 9726</span>
                </p>
              </form>

              <div className="mt-10 text-center text-xs text-slate-400">
                {/* TODO (Security): Add reCAPTCHA if needed; verify server-side in your API */}
                © {new Date().getFullYear()} Denteeth
              </div>
            </div>
          </section>
        </div>
      </main>
    </AuthRedirect>
  );
}