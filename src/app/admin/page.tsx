'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowRight, Calendar, Users, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { NotificationList } from '@/components/notifications/NotificationList';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Chào buổi sáng' : currentHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Lấy tên hiển thị - ưu tiên fullName, rồi đến username
  const displayName = user?.fullName || user?.username || 'Admin';

  const quickLinks = [
    {
      title: 'Quản lý lịch hẹn',
      description: 'Xem và quản lý tất cả lịch hẹn',
      href: '/admin/booking/appointments',
      icon: Calendar,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Quản lý nhân viên',
      description: 'Thêm, sửa thông tin nhân viên',
      href: '/admin/accounts/employees',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Kế hoạch điều trị',
      description: 'Quản lý các kế hoạch điều trị',
      href: '/admin/booking/treatment-plans',
      icon: ClipboardList,
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <ProtectedRoute requiredBaseRole="admin">
      <div className="min-h-[80vh] flex flex-col">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 mb-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-violet-500/20 to-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              <span className="text-amber-400 font-medium text-sm tracking-wide uppercase">
                Hệ thống quản lý phòng khám nha khoa
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {greeting}, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{displayName}</span>
            </h1>
            
            <p className="text-slate-400 text-lg max-w-2xl">
              Chúc bạn một ngày làm việc hiệu quả!
            </p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <NotificationList maxItems={5} viewAllHref="/admin/notifications" />
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:bg-clip-text transition-all">
                    {link.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
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
    </ProtectedRoute>
  );
}
