'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faChartLine,
  faTasks,
  faCheckCircle,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Lịch hẹn hôm nay',
      value: '12',
      change: '+2 so với hôm qua',
      icon: faCalendarAlt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Bệnh nhân đang điều trị',
      value: '48',
      change: '+5 tuần này',
      icon: faUsers,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Công việc hoàn thành',
      value: '24',
      change: 'Tỷ lệ hoàn thành 85%',
      icon: faCheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Cần theo dõi',
      value: '8',
      change: '3 khẩn cấp',
      icon: faClockRotateLeft,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <ProtectedRoute requiredBaseRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Chào mừng trở lại, {user?.username}!
          </h1>
          <p className="text-primary-foreground/80">
            Đây là những gì đang diễn ra với công việc của bạn hôm nay.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {user?.permissions.slice(0, 5).map((permission) => (
              <span
                key={permission}
                className="px-3 py-1 bg-white/20 text-primary-foreground text-xs rounded-full"
              >
                {permission}
              </span>
            ))}
            {user?.permissions && user.permissions.length > 5 && (
              <span className="px-3 py-1 bg-white/20 text-primary-foreground text-xs rounded-full">
                +{user.permissions.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <FontAwesomeIcon
                    icon={stat.icon}
                    className={`h-5 w-5 ${stat.color}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTasks} className="h-5 w-5 text-primary" />
                Thao tác nhanh
              </CardTitle>
              <CardDescription>
                Các tác vụ thường dùng dựa trên quyền của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user?.permissions.includes('CREATE_APPOINTMENT') && (
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                    � Create New Appointment
                  </button>
                )}
                {user?.permissions.includes('CREATE_PATIENT') && (
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                    � Register New Patient
                  </button>
                )}
                {user?.permissions.includes('VIEW_TREATMENT') && (
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                    🦷 View Treatments
                  </button>
                )}
                {user?.permissions.includes('VIEW_ACCOUNT') && (
                  <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                    � Check Financial Reports
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-primary" />
                Quyền của bạn
              </CardTitle>
              <CardDescription>
                Những gì bạn có thể làm trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user?.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg text-sm"
                  >
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="h-4 w-4 text-green-600"
                    />
                    <span className="font-mono text-xs">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Các hành động gần đây của bạn trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-12 w-12 mb-4" />
              <p>Tính năng theo dõi hoạt động sẽ sớm được triển khai</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
