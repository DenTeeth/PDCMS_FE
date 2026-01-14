'use client';

/**
 * Clinical Record View Component
 * 
 * Displays clinical record details in read-only mode
 * Shows: diagnosis, vital signs, chief complaint, examination findings,
 * treatment notes, procedures, prescriptions, and appointment info
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ClinicalRecordResponse, ToothStatusResponse, PrescriptionDTO } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
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
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Lazy load PatientImageManager để tối ưu performance - chỉ load khi cần
const PatientImageManager = lazy(() => import('./PatientImageManager'));

interface ClinicalRecordViewProps {
  record: ClinicalRecordResponse;
  onEdit?: () => void;
  canEdit?: boolean;
  appointmentStatus?: string; // Appointment status to determine if materials can be viewed
}

export default function ClinicalRecordView({
  record,
  onEdit,
  canEdit = false,
  appointmentStatus,
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
      // Add defensive check for record.patient
      if (!record?.patient?.patientId) {
        console.warn('ClinicalRecordView: No patient ID available, skipping tooth status load');
        return;
      }
      
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
  }, [record?.patient?.patientId]);

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
    // Add defensive check for record.patient
    if (!record?.patient?.patientId) {
      console.warn('ClinicalRecordView: No patient ID available, skipping tooth status refresh');
      return;
    }
    
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
    <section className="bg-card rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Bệnh án</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pb-6 border-b">
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

      {/* Clinical Information & Patient Images - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b">
        {/* Left: Clinical Information */}
        <div className="pr-6 border-r-2 border-gray-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Thông tin lâm sàng
          </h3>
          <div className="space-y-6">
            {/* Chief Complaint */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Triệu chứng chính</Label>
              </div>
              <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {record.chiefComplaint}
              </div>
            </div>

            {/* Examination Findings */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Kết quả khám</Label>
              </div>
              <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {record.examinationFindings}
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Chẩn đoán</Label>
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
                  <Label className="text-sm font-semibold">Ghi chú điều trị</Label>
                </div>
                <div className="pl-6 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {record.treatmentNotes}
                </div>
              </div>
            )}

            {/* Temporarily hidden - BE will handle follow-up date automatically */}
            {/* <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Ngày tái khám</Label>
              </div>
              {record.followUpDate && record.followUpDate.trim() !== '' ? (
                <div className="pl-6 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium">
                  {formatDate(record.followUpDate)}
                </div>
              ) : (
                <div className="pl-6 p-3 bg-muted rounded-md text-sm text-muted-foreground italic">
                  Chưa có ngày tái khám
                </div>
              )}
            </div> */}

            {/* Vital Signs - Enhanced UI with better layout and more indicators */}
            {(record.vitalSigns && Object.keys(record.vitalSigns).length > 0) || 
             (record.vitalSignsAssessment && record.vitalSignsAssessment.length > 0) ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <Label className="text-base font-semibold">Chỉ số sức khỏe</Label>
                </div>
                <div className="pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Use assessment if available, otherwise fallback to vitalSigns */}
                    {record.vitalSignsAssessment && record.vitalSignsAssessment.length > 0 ? (
                      record.vitalSignsAssessment.map((assessment) => {
                        const labelMap: Record<string, string> = {
                          BLOOD_PRESSURE_SYSTOLIC: 'Huyết áp tâm thu',
                          BLOOD_PRESSURE_DIASTOLIC: 'Huyết áp tâm trương',
                          HEART_RATE: 'Nhịp tim',
                          TEMPERATURE: 'Nhiệt độ',
                          OXYGEN_SATURATION: 'SpO2',
                          RESPIRATORY_RATE: 'Nhịp thở',
                          BLOOD_GLUCOSE: 'Đường huyết',
                          WEIGHT: 'Cân nặng',
                          HEIGHT: 'Chiều cao',
                          BMI: 'BMI',
                        };
                        const label = labelMap[assessment.vitalType] || assessment.vitalType;
                        
                        const statusConfig = {
                          NORMAL: { 
                            color: 'bg-green-50 text-green-800 border-green-300', 
                            badgeColor: 'bg-green-100 text-green-800 border-green-200',
                            borderColor: '#10b981',
                            icon: CheckCircle2,
                            label: 'Bình thường'
                          },
                          BELOW_NORMAL: { 
                            color: 'bg-yellow-50 text-yellow-800 border-yellow-300', 
                            badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            borderColor: '#f59e0b',
                            icon: AlertTriangle,
                            label: 'Thấp'
                          },
                          ABOVE_NORMAL: { 
                            color: 'bg-red-50 text-red-800 border-red-300', 
                            badgeColor: 'bg-red-100 text-red-800 border-red-200',
                            borderColor: '#ef4444',
                            icon: AlertCircle,
                            label: 'Cao'
                          },
                          UNKNOWN: { 
                            color: 'bg-gray-50 text-gray-800 border-gray-300', 
                            badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
                            borderColor: '#6b7280',
                            icon: AlertCircle,
                            label: 'Không xác định'
                          },
                        };
                        const config = statusConfig[assessment.status] || statusConfig.UNKNOWN;
                        const StatusIcon = config.icon;
                        
                        return (
                          <div 
                            key={assessment.vitalType} 
                            className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${config.color}`}
                            style={{
                              borderLeftColor: config.borderColor
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-gray-700">{label}</div>
                              <Badge variant="outline" className={`text-xs flex items-center gap-1 ${config.badgeColor}`}>
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-1">
                              {assessment.value} <span className="text-sm font-normal text-gray-600">{assessment.unit}</span>
                            </div>
                            {assessment.message && (
                              <div className="text-xs text-gray-600 mt-2 italic">{assessment.message}</div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // Fallback to old display if no assessment
                      Object.entries(record.vitalSigns || {}).map(([key, value]) => {
                        const labelMap: Record<string, string> = {
                          blood_pressure: 'Huyết áp',
                          bloodPressure: 'Huyết áp',
                          heart_rate: 'Nhịp tim',
                          heartRate: 'Nhịp tim',
                          temperature: 'Nhiệt độ',
                          oxygen_saturation: 'SpO2',
                          oxygenSaturation: 'SpO2',
                          respiratory_rate: 'Nhịp thở',
                          respiratoryRate: 'Nhịp thở',
                          blood_glucose: 'Đường huyết',
                          bloodGlucose: 'Đường huyết',
                          weight: 'Cân nặng',
                          height: 'Chiều cao',
                          bmi: 'BMI',
                        };
                        const label = labelMap[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
                        return (
                          <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
                            <div className="text-lg font-bold text-gray-900">{String(value)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Patient Images - Lazy loaded để tối ưu performance */}
        {record?.patient?.patientId && (
          <div className="pl-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Hình ảnh bệnh nhân
            </h3>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Đang tải quản lý hình ảnh...
                  </span>
                </div>
              }
            >
              <PatientImageManager
                patientId={record?.patient?.patientId}
                clinicalRecordId={record?.clinicalRecordId}
                showFilters={true}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Odontogram - Full width */}
      {record?.patient?.patientId && (
        <div className="pb-6 border-b">
          <Odontogram
            patientId={record.patient.patientId}
            toothStatuses={toothStatuses}
            onToothClick={canEdit ? handleToothClick : undefined}
            editable={canEdit}
            readOnly={!canEdit}
          />
        </div>
      )}

      {/* Prescription & Procedures - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Prescriptions */}
        <div className="pr-6 border-r-2 border-gray-300">
          {loadingPrescription ? (
            <div>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Đang tải đơn thuốc...</span>
              </div>
            </div>
          ) : (
            <PrescriptionList
              prescriptions={prescription ? [prescription] : (record.prescriptions || [])}
              canEdit={canEdit}
              appointmentStatus={appointmentStatus || record.appointment?.status}
              onEdit={handleEditPrescription}
              onCreate={handleCreatePrescription}
            />
          )}
        </div>

        {/* Right: Procedures */}
        <div className="pl-6">
          <ProcedureList
            recordId={record.clinicalRecordId}
            canEdit={canEdit}
            appointmentStatus={appointmentStatus || record.appointment?.status}
          />
        </div>
      </div>

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

      {/* Tooth Status Dialog */}
      {canEdit && selectedTooth && record?.patient?.patientId && (
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
    </section>
  );
}

