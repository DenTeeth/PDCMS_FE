'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faBell,
  faShieldAlt,
  faUser,
  faLock,
  faEnvelope,
  faPhone,
  faSave,
  faEdit,
  faTimes,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567'
    },
    notifications: {
      emailReminders: true,
      smsReminders: false,
      appointmentAlerts: true,
      testResults: true,
      paymentReminders: true,
      healthTips: false
    },
    privacy: {
      shareDataWithProviders: true,
      allowMarketing: false,
      dataRetention: '5 years',
      twoFactorAuth: false
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', name: 'Hồ sơ', icon: faUser },
    { id: 'notifications', name: 'Thông báo', icon: faBell },
    { id: 'privacy', name: 'Quyền riêng tư', icon: faShieldAlt },
    { id: 'security', name: 'Bảo mật', icon: faLock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý tùy chọn và cài đặt tài khoản của bạn</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex items-center">
                <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" />
                Hủy
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center">
              <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                      }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon={faUser} className="mr-2 h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Họ</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, firstName: e.target.value }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Tên</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, lastName: e.target.value }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, phone: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon={faBell} className="mr-2 h-5 w-5" />
                  Tùy chọn thông báo
                </CardTitle>
                <CardDescription>
                  Chọn cách bạn muốn nhận thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailReminders">Nhắc nhở qua Email</Label>
                      <p className="text-sm text-muted-foreground">Nhận lời nhắc lịch hẹn qua email</p>
                    </div>
                    <Switch
                      id="emailReminders"
                      checked={settings.notifications.emailReminders}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailReminders: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsReminders">Nhắc nhở qua SMS</Label>
                      <p className="text-sm text-muted-foreground">Nhận lời nhắc lịch hẹn qua tin nhắn</p>
                    </div>
                    <Switch
                      id="smsReminders"
                      checked={settings.notifications.smsReminders}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, smsReminders: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="appointmentAlerts">Appointment Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get alerts for upcoming appointments</p>
                    </div>
                    <Switch
                      id="appointmentAlerts"
                      checked={settings.notifications.appointmentAlerts}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, appointmentAlerts: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="testResults">Test Results</Label>
                      <p className="text-sm text-muted-foreground">Notify when test results are available</p>
                    </div>
                    <Switch
                      id="testResults"
                      checked={settings.notifications.testResults}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, testResults: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="paymentReminders">Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Remind about pending payments</p>
                    </div>
                    <Switch
                      id="paymentReminders"
                      checked={settings.notifications.paymentReminders}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, paymentReminders: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="healthTips">Health Tips</Label>
                      <p className="text-sm text-muted-foreground">Receive health and wellness tips</p>
                    </div>
                    <Switch
                      id="healthTips"
                      checked={settings.notifications.healthTips}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, healthTips: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon={faShieldAlt} className="mr-2 h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your data and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shareData">Share Data with Providers</Label>
                      <p className="text-sm text-muted-foreground">Allow healthcare providers to access your medical data</p>
                    </div>
                    <Switch
                      id="shareData"
                      checked={settings.privacy.shareDataWithProviders}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, shareDataWithProviders: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing">Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={settings.privacy.allowMarketing}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, allowMarketing: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataRetention">Data Retention Period</Label>
                    <select
                      id="dataRetention"
                      value={settings.privacy.dataRetention}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, dataRetention: e.target.value }
                      })}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="1 year">1 Year</option>
                      <option value="3 years">3 Years</option>
                      <option value="5 years">5 Years</option>
                      <option value="10 years">10 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="twoFactor"
                      checked={settings.privacy.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, twoFactorAuth: checked }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon={faLock} className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={settings.security.currentPassword}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, currentPassword: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={settings.security.newPassword}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, newPassword: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={settings.security.confirmPassword}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, confirmPassword: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Password Requirements</span>
                  </div>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

