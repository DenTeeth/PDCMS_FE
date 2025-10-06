'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faUser,
  faBell,
  faShield,
  faSave,
  faEdit,
  faKey,
  faEnvelope,
  faPhone,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    phone: '0123456789',
    position: 'Senior Receptionist',
    department: 'Reception Department',
    address: '123 Main St, City, State',
    bio: 'Experienced receptionist with 5+ years in healthcare administration.',
    notifications: {
      email: true,
      sms: true,
      appointmentReminders: true,
      newPatients: true,
      systemUpdates: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY'
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Settings saved:', formData);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'security', label: 'Security', icon: faShield },
    { id: 'preferences', label: 'Preferences', icon: faCog }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faSave} className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    SJ
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{formData.name}</h3>
                    <p className="text-muted-foreground">{formData.position}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about different activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={formData.notifications.email}
                      onCheckedChange={(checked) => handleNestedInputChange('notifications', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={formData.notifications.sms}
                      onCheckedChange={(checked) => handleNestedInputChange('notifications', 'sms', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming appointments
                      </p>
                    </div>
                    <Switch
                      id="appointment-reminders"
                      checked={formData.notifications.appointmentReminders}
                      onCheckedChange={(checked) => handleNestedInputChange('notifications', 'appointmentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-patients">New Patient Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new patients register
                      </p>
                    </div>
                    <Switch
                      id="new-patients"
                      checked={formData.notifications.newPatients}
                      onCheckedChange={(checked) => handleNestedInputChange('notifications', 'newPatients', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-updates">System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system updates
                      </p>
                    </div>
                    <Switch
                      id="system-updates"
                      checked={formData.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleNestedInputChange('notifications', 'systemUpdates', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faKey} className="h-4 w-4" />
                    <span>Update Password</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Use an authenticator app to generate verification codes
                      </p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select
                      id="theme"
                      value={formData.preferences.theme}
                      onChange={(e) => handleNestedInputChange('preferences', 'theme', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={formData.preferences.language}
                      onChange={(e) => handleNestedInputChange('preferences', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="en">English</option>
                      <option value="vi">Vietnamese</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={formData.preferences.timezone}
                      onChange={(e) => handleNestedInputChange('preferences', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="UTC-5">UTC-5 (EST)</option>
                      <option value="UTC-6">UTC-6 (CST)</option>
                      <option value="UTC-7">UTC-7 (MST)</option>
                      <option value="UTC-8">UTC-8 (PST)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <select
                      id="date-format"
                      value={formData.preferences.dateFormat}
                      onChange={(e) => handleNestedInputChange('preferences', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
