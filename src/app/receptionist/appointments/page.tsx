'use client';

/**
 * Receptionist Appointments Page
 * Reuses the employee appointments components
 * Requires: VIEW_APPOINTMENT, CREATE_APPOINTMENT permissions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPlus, faList, faCalendar } from '@fortawesome/free-solid-svg-icons';
import AppointmentCalendar from '@/app/employee/appointments/components/AppointmentCalendar';
import AppointmentList from '@/app/employee/appointments/components/AppointmentList';
import CreateAppointmentModal from '@/app/employee/appointments/components/CreateAppointmentModal';
import {
  AppointmentDetailsModal,
  RescheduleModal,
  CancelModal,
} from '@/app/employee/appointments/components/AppointmentModals';
import { Appointment } from '@/types/appointment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewMode = 'calendar' | 'list';

export default function ReceptionistAppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setDetailsModalOpen(false);
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleCancel = (appointment: Appointment) => {
    setDetailsModalOpen(false);
    setSelectedAppointment(appointment);
    setCancelModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
              Appointments
            </h1>
            <p className="text-primary-foreground/80">
              Manage patient appointments with calendar and list views
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setCreateModalOpen(true)}
            className="bg-white text-primary hover:bg-white/90"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="calendar">
            <FontAwesomeIcon icon={faCalendar} className="mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <FontAwesomeIcon icon={faList} className="mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <AppointmentCalendar onEventClick={handleViewDetails} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <AppointmentList
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateAppointmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <AppointmentDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onEdit={handleEdit}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
      />

      <RescheduleModal
        open={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={handleSuccess}
      />

      <CancelModal
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
