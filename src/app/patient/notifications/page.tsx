'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarAlt,
  faFileAlt,
  faCreditCard,
  faTimes,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';

const notifications = [
  {
    id: '1',
    title: 'Appointment Reminder',
    message: 'Your appointment with Dr. Nguyen Van A is tomorrow at 10:00 AM',
    type: 'reminder',
    date: '2024-01-24',
    time: '2 hours ago',
    isRead: false,
    priority: 'high'
  },
  {
    id: '2',
    title: 'Test Results Available',
    message: 'Your recent blood test results are now available in your medical records',
    type: 'results',
    date: '2024-01-23',
    time: '1 day ago',
    isRead: false,
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Payment Confirmation',
    message: 'Your payment of $150.00 has been processed successfully',
    type: 'payment',
    date: '2024-01-22',
    time: '2 days ago',
    isRead: true,
    priority: 'low'
  },
  {
    id: '4',
    title: 'Appointment Cancelled',
    message: 'Your appointment scheduled for Jan 25 has been cancelled due to doctor unavailability',
    type: 'cancellation',
    date: '2024-01-21',
    time: '3 days ago',
    isRead: true,
    priority: 'high'
  },
  {
    id: '5',
    title: 'New Prescription',
    message: 'Dr. Le Thi B has prescribed new medication. Please check your prescriptions.',
    type: 'prescription',
    date: '2024-01-20',
    time: '4 days ago',
    isRead: true,
    priority: 'medium'
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'reminder':
      return <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-blue-600" />;
    case 'results':
      return <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5 text-green-600" />;
    case 'payment':
      return <FontAwesomeIcon icon={faCreditCard} className="h-5 w-5 text-green-600" />;
    case 'cancellation':
      return <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-600" />;
    case 'prescription':
      return <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 text-purple-600" />;
    default:
      return <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-gray-600" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function UserNotifications() {
  const [notificationsList, setNotificationsList] = useState(notifications);
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notificationsList.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notificationsList.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotificationsList(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationsList(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thông báo</h1>
          <p className="text-muted-foreground">Cập nhật thông tin sức khỏe của bạn</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheckDouble} className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <FontAwesomeIcon icon={faBell} className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notificationsList.length}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Read</p>
                <p className="text-2xl font-bold text-green-600">{notificationsList.length - unreadCount}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
              size="sm"
            >
              Unread
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              onClick={() => setFilter('read')}
              size="sm"
            >
              Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className={`${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className={`mt-2 ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{notification.date}</span>
                      <span>•</span>
                      <span>{notification.time}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FontAwesomeIcon icon={faBell} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'You\'re all caught up! No unread notifications.'
                : filter === 'read'
                ? 'No read notifications found.'
                : 'You don\'t have any notifications yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
