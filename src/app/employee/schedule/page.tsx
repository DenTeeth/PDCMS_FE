'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function MySchedulePage() {
  const { user } = useAuth();

  // Mock data - replace with actual API call
  const schedule = [
    { day: 'Monday', shift: 'Morning Shift', time: '08:00 - 16:00', duration: 8 },
    { day: 'Tuesday', shift: 'Morning Shift', time: '08:00 - 16:00', duration: 8 },
    { day: 'Wednesday', shift: 'Afternoon Shift', time: '13:00 - 21:00', duration: 8 },
    { day: 'Thursday', shift: 'Morning Shift', time: '08:00 - 16:00', duration: 8 },
    { day: 'Friday', shift: 'Morning Shift', time: '08:00 - 16:00', duration: 8 },
  ];

  const totalHours = schedule.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
          My Work Schedule
        </h1>
        <p className="text-primary-foreground/80">
          View your assigned work shifts for the week
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Days</CardTitle>
            <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule.length}</div>
            <p className="text-xs text-muted-foreground">days this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">schedule confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Schedule</CardTitle>
          <CardDescription>Your assigned shifts for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedule.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24">
                    <div className="font-medium">{item.day}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.shift}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {item.duration}h
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {schedule.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-6xl text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Schedule Yet</h3>
              <p className="text-muted-foreground">
                Your work schedule hasn't been assigned yet. Please contact your manager.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Schedule Information</h4>
              <p className="text-sm text-blue-800">
                Your work schedule is managed by the admin team. If you need to request changes or time off,
                please contact your manager or use the request system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
