import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, Settings, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Staff',
      value: '24',
      description: '+2 from last month',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Today\'s Appointments',
      value: '12',
      description: '8 confirmed',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Blog Posts',
      value: '18',
      description: '3 new this week',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: 'System Roles',
      value: '5',
      description: '4 active roles',
      icon: Settings,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Dental clinic management system overview</p>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dr. Nguyen Van A logged in</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New appointment created</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New blog post published</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Today's scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Nguyen Thi B</p>
                  <p className="text-xs text-gray-500">Regular dental checkup</p>
                </div>
                <span className="text-sm text-blue-600">09:00</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tran Van C</p>
                  <p className="text-xs text-gray-500">Wisdom tooth extraction</p>
                </div>
                <span className="text-sm text-blue-600">10:30</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Le Thi D</p>
                  <p className="text-xs text-gray-500">Braces treatment</p>
                </div>
                <span className="text-sm text-blue-600">14:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium">Quick Actions</h2>
        <div className="mt-3 flex items-center gap-3">
          <a href="/admin/customer-contacts/new" className="btn btn-primary">Create Customer Contact (Temp)</a>
        </div>
      </div>
    </div>
  );
}

