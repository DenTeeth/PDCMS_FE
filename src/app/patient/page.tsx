'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowRight, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';
import { NotificationList } from '@/components/notifications/NotificationList';
import { getFullNameFromToken } from '@/lib/utils';
import { getToken } from '@/lib/cookies';
import { useMemo } from 'react';

export default function PatientDashboard() {
  const { user } = useAuth();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Chào buổi sáng' : currentHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Lấy tên hiển thị từ JWT token (giống như Navbar)
  const displayName = useMemo(() => {
    const token = getToken();
    if (token) {
      const fullName = getFullNameFromToken(token);
      if (fullName) {
        return fullName;
      }
    }
    return user?.username || 'Quý khách';
  }, [user?.username]);

  const quickLinks = [
    {
      title: 'Lịch hẹn của tôi',
      description: 'Xem và quản lý các lịch hẹn',
      href: '/patient/appointments',
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Kế hoạch điều trị',
      description: 'Theo dõi tiến trình điều trị',
      href: '/patient/treatment-plans',
      icon: Heart,
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-800 to-teal-900 p-8 md:p-12 mb-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-400/20 to-pink-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-emerald-300 animate-pulse" />
            <span className="text-emerald-300 font-medium text-sm tracking-wide uppercase">
              Cổng thông tin bệnh nhân
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            {greeting}, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">{displayName}</span>
          </h1>

          <p className="text-teal-200/80 text-lg max-w-2xl">
            Chúc bạn một ngày tốt lành!
          </p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <NotificationList maxItems={5} viewAllHref="/patient/notifications" />
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${link.gradient} mb-4`}>
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:bg-clip-text transition-all">
                  {link.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {link.description}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Hover gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} Dental Clinic Management System
        </p>
      </div>
    </div>
  );
}
