'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings,
  Save,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    clinicName: 'Phòng khám nha khoa PDCMS',
    clinicAddress: '123 Đường ABC, Quận 1, TP.HCM',
    clinicPhone: '0123456789',
    clinicEmail: 'info@pdms.com',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    theme: 'light',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
    },
  });

  const handleSave = () => {
    // Handle save logic here
    console.log('Settings saved:', settings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure clinic system parameters</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Clinic Information
            </CardTitle>
            <CardDescription>
              Configure basic clinic information
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(e) => setSettings({...settings, clinicName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="clinicPhone">Phone Number</Label>
              <div className="flex">
                <Phone className="h-4 w-4 m-3 text-gray-400" />
                <Input
                  id="clinicPhone"
                  value={settings.clinicPhone}
                  onChange={(e) => setSettings({...settings, clinicPhone: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div>
              <Label htmlFor="clinicAddress">Address</Label>
            <div className="flex">
              <MapPin className="h-4 w-4 m-3 text-gray-400" />
              <Input
                id="clinicAddress"
                value={settings.clinicAddress}
                onChange={(e) => setSettings({...settings, clinicAddress: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clinicEmail">Email</Label>
            <div className="flex">
              <Mail className="h-4 w-4 m-3 text-gray-400" />
              <Input
                id="clinicEmail"
                type="email"
                value={settings.clinicEmail}
                onChange={(e) => setSettings({...settings, clinicEmail: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure language, timezone and interface
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification types
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <input
                id="email-notifications"
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings, 
                  notifications: {...settings.notifications, email: e.target.checked}
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <input
                id="sms-notifications"
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) => setSettings({
                  ...settings, 
                  notifications: {...settings.notifications, sms: e.target.checked}
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive browser notifications</p>
              </div>
              <input
                id="push-notifications"
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => setSettings({
                  ...settings, 
                  notifications: {...settings.notifications, push: e.target.checked}
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Configure security options
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Secure account with 2FA</p>
              </div>
              <input
                id="two-factor"
                type="checkbox"
                checked={settings.security.twoFactor}
                onChange={(e) => setSettings({
                  ...settings, 
                  security: {...settings.security, twoFactor: e.target.checked}
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings, 
                  security: {...settings.security, sessionTimeout: parseInt(e.target.value)}
                })}
                className="w-32"
              />
            </div>
            <div>
              <Label htmlFor="password-policy">Password Policy</Label>
              <select
                id="password-policy"
                value={settings.security.passwordPolicy}
                onChange={(e) => setSettings({
                  ...settings, 
                  security: {...settings.security, passwordPolicy: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

