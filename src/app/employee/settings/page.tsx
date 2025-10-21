'use client';

/**
 * Employee Settings Page
 * Available to all employees
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faUser, faBell, faShield } from '@fortawesome/free-solid-svg-icons';

export default function EmployeeSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faCog} className="mr-3" />
          Settings
        </h1>
        <p className="text-primary-foreground/80">
          Manage your account preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShield} className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
