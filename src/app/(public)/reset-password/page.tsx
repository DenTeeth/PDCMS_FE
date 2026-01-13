"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authenticationService } from "@/services/authenticationService";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    // BE Requirements: 6-50 characters, must contain at least 1 letter AND 1 number
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (password.length > 50) {
      return "Mật khẩu không được vượt quá 50 ký tự";
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ cái";
    }
    if (!/(?=.*[0-9])/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số";
    }
    return null;
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate token
    if (!token) {
      setError("Token không hợp lệ. Vui lòng kiểm tra lại link trong email.");
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      await authenticationService.resetPassword(token, newPassword, confirmPassword);

      toast.success("Đặt lại mật khẩu thành công!");
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      // Handle different error types from BE
      let errorMessage = "Không thể đặt lại mật khẩu. Vui lòng thử lại hoặc yêu cầu link mới.";
      
      if (err.response?.data) {
        const beError = err.response.data;
        
        // Check for specific BE error messages
        if (beError.message) {
          errorMessage = beError.message;
        } else if (beError.error) {
          errorMessage = beError.error;
        } else if (typeof beError === 'string') {
          errorMessage = beError;
        }
        
        // Handle common BE error cases
        if (beError.message?.includes('expired') || beError.message?.includes('hết hạn')) {
          errorMessage = "Token đã hết hạn. Vui lòng yêu cầu link mới.";
        } else if (beError.message?.includes('invalid') || beError.message?.includes('không hợp lệ')) {
          errorMessage = "Token không hợp lệ. Vui lòng kiểm tra lại link trong email.";
        } else if (beError.message?.includes('used') || beError.message?.includes('đã sử dụng')) {
          errorMessage = "Link này đã được sử dụng. Vui lòng yêu cầu link mới nếu cần đặt lại mật khẩu.";
        } else if (beError.message?.includes('match') || beError.message?.includes('không khớp')) {
          errorMessage = "Mật khẩu xác nhận không khớp. Vui lòng thử lại.";
        } else if (beError.message?.includes('password') || beError.message?.includes('mật khẩu')) {
          errorMessage = beError.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error(' Reset password error:', {
        error: err,
        response: err.response?.data,
        message: errorMessage,
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-accent via-white to-secondary text-foreground flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Đặt lại mật khẩu thành công!
            </h1>
            <p className="text-slate-600 mb-6">
              Mật khẩu của bạn đã được cập nhật. Đang chuyển đến trang đăng nhập...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8b5fbf] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#7a4eae] transition"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-accent via-white to-secondary text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Visual / Brand Panel */}
        <section className="relative hidden items-center justify-center p-10 md:flex bg-gradient-to-br from-[#8b5fbf]/10 to-[#1e3a5f]/10">
          <div className="relative z-10 max-w-md text-center">
            <div className="mx-auto mb-3 flex items-center justify-center">
              <Image
                src="/denteeth-logo.png"
                alt="DenTeeth Logo"
                width={400}
                height={160}
                className="w-auto h-40"
                priority
              />
            </div>
            <p className="mx-auto max-w-sm text-gray-700">
              Thiết lập mật khẩu mới để bảo vệ tài khoản của bạn. Mật khẩu mạnh giúp bảo vệ thông tin cá nhân.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm text-[#1e3a5f] shadow-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#8b5fbf]" />
              Bảo mật thông tin
            </div>
          </div>
        </section>

        {/* Form Panel */}
        <section className="flex items-center justify-center px-6 py-10 md:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Quay lại đăng nhập
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src="/denteeth-logo.png"
                  alt="DenTeeth Logo"
                  width={240}
                  height={90}
                  className="h-20 w-auto"
                  priority
                />
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-semibold text-slate-800">Đặt lại mật khẩu</h1>
            <p className="mb-8 text-sm text-slate-500">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
                  Mật khẩu mới
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8b5fbf] focus:ring-2 focus:ring-[#8b5fbf]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Xác nhận mật khẩu
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8b5fbf] focus:ring-2 focus:ring-[#8b5fbf]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#8b5fbf] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#7a4eae] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}</span>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Link này sẽ hết hạn sau 24 giờ</li>
                  <li>Mật khẩu phải có ít nhất 8 ký tự</li>
                  <li>Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                </ul>
              </div>
            </form>

            <div className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} DenTeeth. Privacy & HIPAA/GDPR compliant.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

