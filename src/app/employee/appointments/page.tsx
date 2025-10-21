'use client';

/**
 * Employee Appointments Page
 * Requires: VIEW_APPOINTMENT permission
 * 
 * TODO: Di chuyển logic từ src/app/employee/appointments/page.tsx vào đây
 */

import { Card } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export default function EmployeeAppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
          Appointments
        </h1>
        <p className="text-primary-foreground/80">
          Manage patient appointments
        </p>
      </div>

      <Card className="p-12 text-center">
        <FontAwesomeIcon icon={faCalendarAlt} className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600">
          Appointment management features will be available here.
          <br />
          Content from <code className="bg-gray-100 px-2 py-1 rounded">receptionist/appointments</code> will be migrated here.
        </p>
      </Card>
    </div>
  );
}
