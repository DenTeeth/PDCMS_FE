'use client';

/**
 * Clinical Record View Component
 * 
 * Displays clinical record details in read-only mode
 * Shows: diagnosis, vital signs, chief complaint, examination findings,
 * treatment notes, procedures, prescriptions, and appointment info
 */

import React, { useState, useEffect } from 'react';
import { ClinicalRecordResponse, ToothStatusResponse, PrescriptionDTO } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ProcedureList from './ProcedureList';
import PrescriptionList from './PrescriptionList';
import PrescriptionForm from './PrescriptionForm';
import Odontogram from './Odontogram';
import ToothStatusDialog from './ToothStatusDialog';
import { toothStatusService } from '@/services/toothStatusService';
import { ToothCondition } from '@/types/clinicalRecord';
import {
  User,
  UserCog,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  Activity,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ClinicalRecordViewProps {
  record: ClinicalRecordResponse;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function ClinicalRecordView({
  record,
  onEdit,
  canEdit = false,
}: ClinicalRecordViewProps) {
  const [toothStatuses, setToothStatuses] = useState<ToothStatusResponse[]>([]);
  const [loadingToothStatuses, setLoadingToothStatuses] = useState(false);
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  // Prescription edit state
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<PrescriptionDTO | null>(null);
  // Tooth status edit state
  const [toothDialogOpen, setToothDialogOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<{
    number: string;
    status?: ToothCondition;
    notes?: string;
  } | null>(null);

  // Load tooth statuses
  useEffect(() => {
    const loadToothStatuses = async () => {
      if (!record.patient.patientId) return;
      
      setLoadingToothStatuses(true);
      try {
        const statuses = await toothStatusService.getToothStatus(record.patient.patientId);
        setToothStatuses(statuses);
      } catch (error: any) {
        console.error('Error loading tooth statuses:', error);
        // Don't show error toast - odontogram is optional
      } finally {
        setLoadingToothStatuses(false);
      }
    };

    loadToothStatuses();
  }, [record.patient.patientId]);

  // Load prescription (fallback if not in record response)
  useEffect(() => {
    const loadPrescription = async () => {
      // If prescription already in record, use it
      if (record.prescriptions && record.prescriptions.length > 0) {
        setPrescription(record.prescriptions[0]); // BE returns array but typically has 1 prescription
        return;
      }

      // Otherwise, try to load from API
      if (!record.clinicalRecordId) return;

      setLoadingPrescription(true);
      try {
        const prescriptionData = await clinicalRecordService.getPrescription(
          record.clinicalRecordId
        );
        setPrescription(prescriptionData);
      } catch (error: any) {
        // 404 means no prescription yet - this is OK
        if (error.status !== 404) {
          console.error('Error loading prescription:', error);
        }
        setPrescription(null);
      } finally {
        setLoadingPrescription(false);
      }
    };

    loadPrescription();
  }, [record.clinicalRecordId, record.prescriptions]);

  // Handle prescription edit/create
  const handleEditPrescription = (prescription: PrescriptionDTO) => {
    setEditingPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleCreatePrescription = () => {
    setEditingPrescription(null);
    setPrescriptionDialogOpen(true);
  };

  const handlePrescriptionSuccess = (updatedPrescription: PrescriptionDTO) => {
    setPrescription(updatedPrescription);
    setPrescriptionDialogOpen(false);
    setEditingPrescription(null);
  };

  const handlePrescriptionDelete = () => {
    setPrescription(null);
    setPrescriptionDialogOpen(false);
    setEditingPrescription(null);
  };

  // Handle tooth click
  const handleToothClick = (
    toothNumber: string,
    status?: ToothCondition,
    notes?: string
  ) => {
    if (!canEdit) return;
    setSelectedTooth({ number: toothNumber, status, notes });
    setToothDialogOpen(true);
  };

  // Handle tooth status update success
  const handleToothStatusUpdate = async () => {
    if (!record.patient.patientId) return;
    
    try {
      const statuses = await toothStatusService.getToothStatus(record.patient.patientId);
      setToothStatuses(statuses);
    } catch (error: any) {
      console.error('Error refreshing tooth statuses:', error);
    }
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateTime;
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return date;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Bệnh Án</CardTitle>
              <div className="text-sm text-muted-foreground">
                Mã bệnh án: <span className="font-mono font-semibold">#{record.clinicalRecordId}</span>
              </div>
            </div>
            {canEdit && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Ngày tạo</div>
                <div className="font-medium">{formatDateTime(record.createdAt)}</div>
              </div>
            </div>
            {record.updatedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Cập nhật lần cuối</div>
                  <div className="font-medium">{formatDateTime(record.updatedAt)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment & People Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thông Tin Lịch Hẹn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Mã lịch hẹn</div>
              <div className="font-mono font-semibold">{record.appointment.appointmentCode}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Trạng thái</div>
              <Badge variant="outline">{record.appointment.status}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Thời gian</div>
              <div className="font-medium">
                {formatDateTime(record.appointment.appointmentStartTime)} - {formatDateTime(record.appointment.appointmentEndTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Thời lượng</div>
              <div className="font-medium">{record.appointment.expectedDurationMinutes} phút</div>
            </div>
            {record.appointment.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Ghi chú</div>
                <div className="text-sm">{record.appointment.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor & Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Bác Sĩ & Bệnh Nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Doctor */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">Bác Sĩ</div>
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <div className="font-medium">{record.doctor.fullName}</div>
                <div className="text-muted-foreground">Mã: {record.doctor.employeeCode}</div>
                {record.doctor.phone && (
                  <div className="text-muted-foreground">ĐT: {record.doctor.phone}</div>
                )}
                {record.doctor.email && (
                  <div className="text-muted-foreground">Email: {record.doctor.email}</div>
                )}
              </div>
            </div>

            <Separator />

            {/* Patient */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">Bệnh Nhân</div>
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <div className="font-medium">{record.patient.fullName}</div>
                <div className="text-muted-foreground">Mã: {record.patient.patientCode}</div>
                {record.patient.phone && (
                  <div className="text-muted-foreground">ĐT: {record.patient.phone}</div>
                )}
                {record.patient.dateOfBirth && (
                  <div className="text-muted-foreground">
                    Ngày sinh: {formatDate(record.patient.dateOfBirth)}
                  </div>
                )}
                {record.patient.gender && (
                  <div className="text-muted-foreground">
                    Giới tính: {record.patient.gender === 'MALE' ? 'Nam' : record.patient.gender === 'FEMALE' ? 'Nữ' : record.patient.gender}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Thông Tin Lâm Sàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chief Complaint */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Triệu Chứng Chính</Label>
            </div>
            <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
              {record.chiefComplaint}
            </div>
          </div>

          {/* Examination Findings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Kết Quả Khám</Label>
            </div>
            <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
              {record.examinationFindings}
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Chẩn Đoán</Label>
            </div>
            <div className="pl-6 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium">
              {record.diagnosis}
            </div>
          </div>

          {/* Treatment Notes */}
          {record.treatmentNotes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Ghi Chú Điều Trị</Label>
              </div>
              <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {record.treatmentNotes}
              </div>
            </div>
          )}

          {/* Follow-up Date */}
          {record.followUpDate ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Ngày Tái Khám</Label>
              </div>
              <div className="pl-6 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium">
                {formatDate(record.followUpDate)}
              </div>
            </div>
          ) : (
            // Debug: Show if field exists but is empty
            <div className="text-xs text-muted-foreground italic">
              {/* Debug: followUpDate = {String(record.followUpDate)} */}
            </div>
          )}

          {/* Vital Signs */}
          {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Dấu Hiệu Sinh Tồn</Label>
              </div>
              <div className="pl-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(record.vitalSigns).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted rounded-md">
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procedures */}
      <Card>
        <CardContent className="pt-6">
          <ProcedureList
            recordId={record.clinicalRecordId}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      {/* Prescriptions */}
      {loadingPrescription ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Đang tải đơn thuốc...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PrescriptionList
          prescriptions={prescription ? [prescription] : (record.prescriptions || [])}
          canEdit={canEdit}
          onEdit={handleEditPrescription}
          onCreate={handleCreatePrescription}
        />
      )}

      {/* Prescription Form Dialog */}
      {canEdit && record.clinicalRecordId && (
        <div className="hidden">
          <PrescriptionForm
            recordId={record.clinicalRecordId}
            existingPrescription={editingPrescription}
            onSuccess={handlePrescriptionSuccess}
            onDelete={handlePrescriptionDelete}
            readOnly={false}
            open={prescriptionDialogOpen}
            onOpenChange={setPrescriptionDialogOpen}
          />
        </div>
      )}

      {/* Odontogram */}
      <Card>
        <CardContent className="pt-6">
          <Odontogram
            patientId={record.patient.patientId}
            toothStatuses={toothStatuses}
            onToothClick={canEdit ? handleToothClick : undefined}
            editable={canEdit}
            readOnly={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Tooth Status Dialog */}
      {canEdit && selectedTooth && (
        <ToothStatusDialog
          open={toothDialogOpen}
          onOpenChange={setToothDialogOpen}
          patientId={record.patient.patientId}
          toothNumber={selectedTooth.number}
          currentStatus={selectedTooth.status}
          currentNotes={selectedTooth.notes}
          onSuccess={handleToothStatusUpdate}
        />
      )}
    </div>
  );
}

