'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faFileAlt,
  faCreditCard,
  faBell,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faHeart,
  faUser,
  faPhone,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

// Sample data for user dashboard
const upcomingAppointments = [
  {
    id: '1',
    date: '2024-01-25',
    time: '10:00 AM',
    doctor: 'Dr. Nguyen Van A',
    type: 'General Checkup',
    status: 'confirmed'
  },
  {
    id: '2',
    date: '2024-01-30',
    time: '2:00 PM',
    doctor: 'Dr. Le Thi B',
    type: 'Dental Cleaning',
    status: 'pending'
  }
];

const recentRecords = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'X-Ray',
    doctor: 'Dr. Nguyen Van A',
    status: 'completed'
  },
  {
    id: '2',
    date: '2024-01-10',
    type: 'Blood Test',
    doctor: 'Dr. Le Thi B',
    status: 'completed'
  }
];

const notifications = [
  {
    id: '1',
    title: 'Appointment Reminder',
    message: 'Your appointment with Dr. Nguyen Van A is tomorrow at 10:00 AM',
    type: 'reminder',
    time: '2 hours ago'
  },
  {
    id: '2',
    title: 'Test Results Available',
    message: 'Your recent blood test results are now available',
    type: 'results',
    time: '1 day ago'
  }
];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, John!</h1>
            <p className="text-primary-foreground/80 mt-2">
              Here's what's happening with your health today
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm opacity-80">Next Appointment</p>
              <p className="font-semibold">Jan 25, 2024 at 10:00 AM</p>
            </div>
            <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Appointments</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Records</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <FontAwesomeIcon icon={faFileAlt} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <FontAwesomeIcon icon={faCreditCard} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <FontAwesomeIcon icon={faBell} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Your scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.date} at {appointment.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        with {appointment.doctor}
                      </p>
                    </div>
                  </div>
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Appointments
            </Button>
          </CardContent>
        </Card>

        {/* Recent Medical Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon={faFileAlt} className="mr-2 h-5 w-5" />
              Recent Medical Records
            </CardTitle>
            <CardDescription>
              Your latest medical documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{record.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.date} - {record.doctor}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Records
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon={faBell} className="mr-2 h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Important updates and reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon 
                    icon={notification.type === 'reminder' ? faClock : faExclamationTriangle} 
                    className="h-4 w-4 text-blue-600" 
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4" variant="outline">
            View All Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6" />
              <span>Book Appointment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FontAwesomeIcon icon={faFileAlt} className="h-6 w-6" />
              <span>View Records</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FontAwesomeIcon icon={faCreditCard} className="h-6 w-6" />
              <span>Make Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FontAwesomeIcon icon={faUser} className="h-6 w-6" />
              <span>Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

