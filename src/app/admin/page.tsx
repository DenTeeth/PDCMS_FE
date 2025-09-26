import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, Settings, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Tổng nhân viên',
      value: '24',
      description: '+2 từ tháng trước',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Lịch hẹn hôm nay',
      value: '12',
      description: '8 đã xác nhận',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Bài viết blog',
      value: '18',
      description: '3 bài mới tuần này',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: 'Vai trò hệ thống',
      value: '5',
      description: '4 vai trò đang hoạt động',
      icon: Settings,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Tổng quan hệ thống quản lý phòng khám nha khoa</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Những thay đổi mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bác sĩ Nguyễn Văn A đã đăng nhập</p>
                  <p className="text-xs text-gray-500">2 phút trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Lịch hẹn mới được tạo</p>
                  <p className="text-xs text-gray-500">15 phút trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bài viết blog mới được xuất bản</p>
                  <p className="text-xs text-gray-500">1 giờ trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn sắp tới</CardTitle>
            <CardDescription>Những lịch hẹn trong ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Nguyễn Thị B</p>
                  <p className="text-xs text-gray-500">Khám răng định kỳ</p>
                </div>
                <span className="text-sm text-blue-600">09:00</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Trần Văn C</p>
                  <p className="text-xs text-gray-500">Nhổ răng khôn</p>
                </div>
                <span className="text-sm text-blue-600">10:30</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lê Thị D</p>
                  <p className="text-xs text-gray-500">Niềng răng</p>
                </div>
                <span className="text-sm text-blue-600">14:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
