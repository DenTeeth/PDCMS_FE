'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faDollarSign,
  faChartLine,
  faUserPlus,
  faCalendarPlus,
  faEye,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { receptionistStats } from '@/data/receptionist-data';

export default function ReceptionistDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const stats = [
    {
      title: 'Total Patients',
      value: receptionistStats.totalPatients,
      icon: faUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Today\'s Appointments',
      value: receptionistStats.todayAppointments,
      icon: faCalendarAlt,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending Appointments',
      value: receptionistStats.pendingAppointments,
      icon: faClock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Completed Today',
      value: receptionistStats.completedAppointments,
      icon: faCheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Revenue',
      value: `$${receptionistStats.totalRevenue.toLocaleString()}`,
      icon: faDollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Customer Groups',
      value: receptionistStats.customerGroups,
      icon: faChartLine,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  const quickActions = [
    {
      title: 'Create New Account',
      description: 'Register a new patient',
      icon: faUserPlus,
      href: '/receptionist/create-account',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Schedule Appointment',
      description: 'Book a new appointment',
      icon: faCalendarPlus,
      href: '/receptionist/appointments/calendar',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'View Patients',
      description: 'Manage patient records',
      icon: faEye,
      href: '/receptionist/patient-records',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Update Records',
      description: 'Edit patient information',
      icon: faEdit,
      href: '/receptionist/customers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receptionist Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening at your clinic today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <FontAwesomeIcon icon={stat.icon} className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`p-4 rounded-lg border border-border hover:shadow-md transition-all duration-200 ${action.bgColor} hover:scale-105`}
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={action.icon} className={`h-5 w-5 ${action.color}`} />
                  <div>
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receptionistStats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>
              Upcoming appointments for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <p className="font-medium text-green-900">John Smith</p>
                  <p className="text-sm text-green-700">Regular checkup - 09:00</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-900">Emily Davis</p>
                  <p className="text-sm text-yellow-700">Root canal - 10:30</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">David Wilson</p>
                  <p className="text-sm text-blue-700">Dental cleaning - 14:00</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
