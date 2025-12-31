"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authenticationService } from "@/services/authenticationService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      await authenticationService.forgotPassword(email.trim());

      toast.success("Email đã được gửi. Vui lòng kiểm tra hộp thư.");
      setSuccess(true);
    } catch (err: any) {
      // Handle different error types from BE
      let errorMessage = "Không thể gửi email. Vui lòng thử lại.";
      
      if (err.response?.data) {
        const beError = err.response.data;
        
        if (beError.message) {
          errorMessage = beError.message;
        } else if (beError.error) {
          errorMessage = beError.error;
        }
        
        // Handle 404 - Email not found
        if (err.response.status === 404) {
          errorMessage = "Email không tồn tại trong hệ thống";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent via-white to-secondary text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Visual / Brand Panel */}
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
              <Link href="/login" className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Quay lại đăng nhập
              </Link>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-emerald-800">Email đã được gửi!</h2>
                  <p className="mb-4 text-sm text-emerald-700">
                    Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong>{email}</strong>.
                    Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                  </p>
                  <p className="text-xs text-emerald-600">
                    Nếu không thấy email, vui lòng kiểm tra thư mục spam.
                  </p>
                </div>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-[#8b5fbf] hover:text-[#7a4eae] font-medium"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-slate-800">Quên mật khẩu</h1>
                <p className="mb-8 text-sm text-slate-500">
                  Nhập email của bạn để nhận link đặt lại mật khẩu
                </p>

                {/* Form */}
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8b5fbf] focus:ring-2 focus:ring-[#8b5fbf]/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#8b5fbf] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#7a4eae] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{loading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Nhớ mật khẩu?{" "}
                    <Link href="/login" className="text-[#8b5fbf] hover:text-[#7a4eae] font-medium">
                      Đăng nhập
                    </Link>
                  </p>
                </form>
              </>
            )}

            <div className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Denteeth
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

