'use client';


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
import { vitalSignsReferenceService } from '@/services/vitalSignsReferenceService';
import { ToothCondition, VitalSignsReferenceResponse } from '@/types/clinicalRecord';
import { assessVitalSign, parseBloodPressure, calculateAge, VITAL_TYPE_MAP } from '@/utils/vitalSignsAssessment';
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
  patientDateOfBirth?: string; // Optional: Patient date of birth (fallback if record.patient.dateOfBirth is not available)
}

export default function ClinicalRecordView({
  record,
  onEdit,
  canEdit = false,
  appointmentStatus,
  patientDateOfBirth,
}: ClinicalRecordViewProps) {
  const [toothStatuses, setToothStatuses] = useState<ToothStatusResponse[]>([]);
  const [loadingToothStatuses, setLoadingToothStatuses] = useState(false);
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [vitalSignsReferences, setVitalSignsReferences] = useState<VitalSignsReferenceResponse[]>([]);
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

  // Load vital signs reference ranges for client-side assessment
  useEffect(() => {
    const loadReferences = async () => {
      // Use record.patient.dateOfBirth first, fallback to patientDateOfBirth prop
      const dob = record?.patient?.dateOfBirth || patientDateOfBirth;
      if (!dob) return;
      
      try {
        const age = calculateAge(dob);
        const refs = await vitalSignsReferenceService.getReferencesByAge(age);
        setVitalSignsReferences(refs);
      } catch (error: any) {
        console.error('Error loading vital signs references:', error);
        // Silently fail - assessment will fallback to UNKNOWN
      }
    };

    loadReferences();
  }, [record?.patient?.dateOfBirth, patientDateOfBirth]);

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Combine assessments and vitalSigns to ensure all 4 vital signs are displayed */}
                    {(() => {
                      // Create a map of assessments by vital type for quick lookup
                      const assessmentMap = new Map();
                      if (record.vitalSignsAssessment && record.vitalSignsAssessment.length > 0) {
                        record.vitalSignsAssessment.forEach((assessment) => {
                          // Map both systolic and diastolic to blood pressure
                          if (assessment.vitalType === 'BLOOD_PRESSURE_SYSTOLIC' || assessment.vitalType === 'BLOOD_PRESSURE_DIASTOLIC') {
                            assessmentMap.set('bloodPressure', assessment);
                          } else {
                            const keyMap: Record<string, string> = {
                              HEART_RATE: 'heartRate',
                              TEMPERATURE: 'temperature',
                              OXYGEN_SATURATION: 'oxygenSaturation',
                            };
                            const key = keyMap[assessment.vitalType];
                            if (key) {
                              assessmentMap.set(key, assessment);
                            }
                          }
                        });
                      }

                      // Define the 4 main vital signs we want to display
                      const vitalSignsToDisplay = [
                        { key: 'bloodPressure', label: 'Huyết áp', unit: 'mmHg' },
                        { key: 'heartRate', label: 'Nhịp tim', unit: 'bpm' },
                        { key: 'temperature', label: 'Nhiệt độ', unit: '°C' },
                        { key: 'oxygenSaturation', label: 'SpO2', unit: '%' },
                      ];

                      return vitalSignsToDisplay.map((vital) => {
                        const assessment = assessmentMap.get(vital.key);
                        const vitalValue = record.vitalSigns?.[vital.key] || 
                                         record.vitalSigns?.[vital.key.replace(/([A-Z])/g, '_$1').toLowerCase()];

                        // Skip if no value and no assessment
                        if (!vitalValue && !assessment) return null;

                        // Use assessment if available, otherwise use raw value
                        if (assessment) {
                          const labelMap: Record<string, string> = {
                            BLOOD_PRESSURE_SYSTOLIC: 'Huyết áp',
                            BLOOD_PRESSURE_DIASTOLIC: 'Huyết áp',
                            HEART_RATE: 'Nhịp tim',
                            TEMPERATURE: 'Nhiệt độ',
                            OXYGEN_SATURATION: 'SpO2',
                          };
                          const label = labelMap[assessment.vitalType] || vital.label;
                          
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
                          const config = statusConfig[assessment.status as keyof typeof statusConfig] || statusConfig.UNKNOWN;
                          const StatusIcon = config.icon;
                          
                          return (
                            <div 
                              key={vital.key} 
                              className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${config.color}`}
                              style={{
                                borderLeftColor: config.borderColor
                              }}
                            >
                              <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
                              <div className="text-xl font-bold text-gray-900">
                                {assessment.value} <span className="text-sm font-normal text-gray-600">{assessment.unit}</span>
                              </div>
                            </div>
                          );
                        } else if (vitalValue) {
                          // Fallback: Client-side assessment if no BE assessment
                          let clientAssessment = null;
                          
                          // Try to assess client-side
                          if (vitalSignsReferences.length > 0) {
                            if (vital.key === 'bloodPressure') {
                              // Parse blood pressure "120/80"
                              const bp = parseBloodPressure(String(vitalValue));
                              if (bp) {
                                clientAssessment = assessVitalSign('BLOOD_PRESSURE_SYSTOLIC', bp.systolic, vitalSignsReferences);
                              }
                            } else {
                              const vitalType = VITAL_TYPE_MAP[vital.key];
                              if (vitalType) {
                                const numValue = parseFloat(String(vitalValue));
                                if (!isNaN(numValue) && numValue !== 0) {
                                  clientAssessment = assessVitalSign(vitalType, numValue, vitalSignsReferences);
                                }
                              }
                            }
                          }
                          
                          // Use client assessment if available, otherwise UNKNOWN
                          const status = clientAssessment?.status || 'UNKNOWN';
                          
                          const statusConfig = {
                            NORMAL: { 
                              color: 'bg-green-50 text-green-800 border-green-300', 
                              borderColor: '#10b981',
                            },
                            BELOW_NORMAL: { 
                              color: 'bg-yellow-50 text-yellow-800 border-yellow-300', 
                              borderColor: '#f59e0b',
                            },
                            ABOVE_NORMAL: { 
                              color: 'bg-red-50 text-red-800 border-red-300', 
                              borderColor: '#ef4444',
                            },
                            UNKNOWN: { 
                              color: 'bg-gray-50 text-gray-800 border-gray-300', 
                              borderColor: '#6b7280',
                            },
                          };
                          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNKNOWN;
                          
                          return (
                            <div 
                              key={vital.key} 
                              className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${config.color}`}
                              style={{
                                borderLeftColor: config.borderColor
                              }}
                            >
                              <div className="text-sm font-medium text-gray-700 mb-2">{vital.label}</div>
                              <div className="text-xl font-bold text-gray-900">
                                {String(vitalValue)} <span className="text-sm font-normal text-gray-600">{vital.unit}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }).filter(Boolean);
                    })()}
                  </div>
                  
                  {/* Legends */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Chú thích:</div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 bg-green-50 border-green-300" style={{ borderLeftColor: '#10b981' }}></div>
                        <span className="text-xs text-gray-600">Bình thường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 bg-yellow-50 border-yellow-300" style={{ borderLeftColor: '#f59e0b' }}></div>
                        <span className="text-xs text-gray-600">Thấp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 bg-red-50 border-red-300" style={{ borderLeftColor: '#ef4444' }}></div>
                        <span className="text-xs text-gray-600">Cao</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 bg-gray-50 border-gray-300" style={{ borderLeftColor: '#6b7280' }}></div>
                        <span className="text-xs text-gray-600">Không xác định</span>
                      </div>
                    </div>
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
              Hình ảnh của bệnh nhân
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

