'use client';

/**
 * Clinical Record Form Component
 * 
 * Form to create or update clinical records
 * Optimized UX: Single form with sections, minimal cards
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClinicalRecordResponse, CreateClinicalRecordRequest, UpdateClinicalRecordRequest, ToothStatusResponse, ToothCondition, PrescriptionDTO } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { toothStatusService } from '@/services/toothStatusService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';
import Odontogram from './Odontogram';
import ToothStatusDialog from './ToothStatusDialog';
import PrescriptionForm from './PrescriptionForm';

interface ClinicalRecordFormProps {
  appointmentId: number;
  patientId?: number; // Optional - for Odontogram (can get from existingRecord if not provided)
  existingRecord?: ClinicalRecordResponse | null;
  onSuccess?: (record: ClinicalRecordResponse) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

interface FormData {
  chiefComplaint: string;
  examinationFindings: string;
  diagnosis: string;
  treatmentNotes?: string;
  followUpDate?: string;
  // Vital signs
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
}

export default function ClinicalRecordForm({
  appointmentId,
  patientId,
  existingRecord,
  onSuccess,
  onCancel,
  readOnly = false,
}: ClinicalRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Odontogram state
  const [toothStatuses, setToothStatuses] = useState<ToothStatusResponse[]>([]);
  const [loadingToothStatuses, setLoadingToothStatuses] = useState(false);
  const [toothDialogOpen, setToothDialogOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<{
    number: string;
    status?: ToothCondition;
    notes?: string;
  } | null>(null);
  // Prescription state
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      chiefComplaint: existingRecord?.chiefComplaint || '',
      examinationFindings: existingRecord?.examinationFindings || '',
      diagnosis: existingRecord?.diagnosis || '',
      treatmentNotes: existingRecord?.treatmentNotes || '',
      followUpDate: existingRecord?.followUpDate || '',
      // Extract vital signs from JSONB
      bloodPressure: existingRecord?.vitalSigns?.bloodPressure || existingRecord?.vitalSigns?.blood_pressure || '',
      heartRate: existingRecord?.vitalSigns?.heartRate || existingRecord?.vitalSigns?.heart_rate || '',
      temperature: existingRecord?.vitalSigns?.temperature || '',
      respiratoryRate: existingRecord?.vitalSigns?.respiratoryRate || existingRecord?.vitalSigns?.respiratory_rate || '',
      oxygenSaturation: existingRecord?.vitalSigns?.oxygenSaturation || existingRecord?.vitalSigns?.oxygen_saturation || '',
    },
  });

  // Reset form when existingRecord changes
  useEffect(() => {
    if (existingRecord) {
      reset({
        chiefComplaint: existingRecord.chiefComplaint || '',
        examinationFindings: existingRecord.examinationFindings || '',
        diagnosis: existingRecord.diagnosis || '',
        treatmentNotes: existingRecord.treatmentNotes || '',
        followUpDate: existingRecord.followUpDate || '',
        bloodPressure: existingRecord.vitalSigns?.bloodPressure || existingRecord.vitalSigns?.blood_pressure || '',
        heartRate: existingRecord.vitalSigns?.heartRate || existingRecord.vitalSigns?.heart_rate || '',
        temperature: existingRecord.vitalSigns?.temperature || '',
        respiratoryRate: existingRecord.vitalSigns?.respiratoryRate || existingRecord.vitalSigns?.respiratory_rate || '',
        oxygenSaturation: existingRecord.vitalSigns?.oxygenSaturation || existingRecord.vitalSigns?.oxygen_saturation || '',
      });
    }
  }, [existingRecord, reset]);

  // Get patientId from props or existingRecord
  const effectivePatientId = patientId || existingRecord?.patient.patientId;

  // Load prescription when record exists
  useEffect(() => {
    const loadPrescription = async () => {
      if (!existingRecord?.clinicalRecordId) {
        setPrescription(null);
        return;
      }

      setLoadingPrescription(true);
      try {
        const prescriptionData = await clinicalRecordService.getPrescription(
          existingRecord.clinicalRecordId
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
  }, [existingRecord?.clinicalRecordId]);

  // Load tooth statuses
  useEffect(() => {
    const loadToothStatuses = async () => {
      if (!effectivePatientId) return;
      
      setLoadingToothStatuses(true);
      try {
        const statuses = await toothStatusService.getToothStatus(effectivePatientId);
        setToothStatuses(statuses);
      } catch (error: any) {
        console.error('Error loading tooth statuses:', error);
        // Don't show error toast - odontogram is optional
      } finally {
        setLoadingToothStatuses(false);
      }
    };

    loadToothStatuses();
  }, [effectivePatientId]);

  // Handle tooth click
  const handleToothClick = (
    toothNumber: string,
    status?: ToothCondition,
    notes?: string
  ) => {
    if (readOnly) return;
    setSelectedTooth({ number: toothNumber, status, notes });
    setToothDialogOpen(true);
  };

  // Handle tooth status update success
  const handleToothStatusUpdate = async () => {
    if (!effectivePatientId) return;
    
    try {
      const statuses = await toothStatusService.getToothStatus(effectivePatientId);
      setToothStatuses(statuses);
    } catch (error: any) {
      console.error('Error refreshing tooth statuses:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (readOnly) return;

    setIsSubmitting(true);
    try {
      // Build vital signs object (only include non-empty values)
      const vitalSigns: Record<string, any> = {};
      if (data.bloodPressure) vitalSigns.bloodPressure = data.bloodPressure;
      if (data.heartRate) vitalSigns.heartRate = data.heartRate;
      if (data.temperature) vitalSigns.temperature = data.temperature;
      if (data.respiratoryRate) vitalSigns.respiratoryRate = data.respiratoryRate;
      if (data.oxygenSaturation) vitalSigns.oxygenSaturation = data.oxygenSaturation;

      if (existingRecord) {
        // Update existing record
        const updateRequest: UpdateClinicalRecordRequest = {
          examinationFindings: data.examinationFindings,
          treatmentNotes: data.treatmentNotes || undefined,
          followUpDate: data.followUpDate || undefined,
          vitalSigns: Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined,
        };

        await clinicalRecordService.update(existingRecord.clinicalRecordId, updateRequest);
        toast.success('Đã cập nhật bệnh án thành công');

        // Refetch the updated record
        const updatedRecord = await clinicalRecordService.getByAppointmentId(appointmentId);
        
        //  Reload tooth statuses after updating clinical record
        // Odontogram may have been updated separately, so refresh to show latest state
        if (effectivePatientId) {
          try {
            const statuses = await toothStatusService.getToothStatus(effectivePatientId);
            setToothStatuses(statuses);
          } catch (error: any) {
            console.error('Error refreshing tooth statuses after update:', error);
            // Don't show error toast - odontogram refresh is optional
          }
        }

        //  Reload prescription after updating clinical record
        if (updatedRecord.clinicalRecordId) {
          try {
            const prescriptionData = await clinicalRecordService.getPrescription(
              updatedRecord.clinicalRecordId
            );
            setPrescription(prescriptionData);
          } catch (error: any) {
            // 404 means no prescription yet - this is OK
            if (error.status !== 404) {
              console.error('Error refreshing prescription after update:', error);
            }
            setPrescription(null);
          }
        }
        
        onSuccess?.(updatedRecord);
      } else {
        // Create new record
        const createRequest: CreateClinicalRecordRequest = {
          appointmentId,
          chiefComplaint: data.chiefComplaint,
          examinationFindings: data.examinationFindings,
          diagnosis: data.diagnosis,
          treatmentNotes: data.treatmentNotes || undefined,
          followUpDate: data.followUpDate || undefined,
          vitalSigns: Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined,
        };

        const response = await clinicalRecordService.create(createRequest);
        toast.success('Đã tạo bệnh án thành công');

        // Refetch the created record
        const newRecord = await clinicalRecordService.getByAppointmentId(appointmentId);
        onSuccess?.(newRecord);
      }
    } catch (error: any) {
      console.error('Error saving clinical record:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu bệnh án');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!existingRecord;
  const canEdit = !readOnly;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Chief Complaint & Diagnosis - Required fields for create */}
      {!isEditMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="chiefComplaint" className="text-sm font-semibold">
              Triệu Chứng Chính <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="chiefComplaint"
              {...register('chiefComplaint', {
                required: 'Vui lòng nhập triệu chứng chính',
                minLength: { value: 1, message: 'Triệu chứng chính phải có ít nhất 1 ký tự' },
                maxLength: { value: 1000, message: 'Triệu chứng chính không được vượt quá 1000 ký tự' },
              })}
              placeholder="Mô tả triệu chứng chính của bệnh nhân..."
              rows={3}
              disabled={!canEdit}
              className={errors.chiefComplaint ? 'border-destructive' : ''}
            />
            {errors.chiefComplaint && (
              <p className="text-sm text-destructive">{errors.chiefComplaint.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-sm font-semibold">
              Chẩn Đoán <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="diagnosis"
              {...register('diagnosis', {
                required: 'Vui lòng nhập chẩn đoán',
                minLength: { value: 1, message: 'Chẩn đoán phải có ít nhất 1 ký tự' },
                maxLength: { value: 500, message: 'Chẩn đoán không được vượt quá 500 ký tự' },
              })}
              placeholder="Nhập chẩn đoán..."
              rows={2}
              disabled={!canEdit}
              className={errors.diagnosis ? 'border-destructive' : ''}
            />
            {errors.diagnosis && (
              <p className="text-sm text-destructive">{errors.diagnosis.message}</p>
            )}
          </div>
        </>
      )}

      {/* Read-only display for edit mode */}
      {isEditMode && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Triệu Chứng Chính</Label>
            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
              {existingRecord.chiefComplaint}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Chẩn Đoán</Label>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium">
              {existingRecord.diagnosis}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Examination Findings */}
      <div className="space-y-2">
        <Label htmlFor="examinationFindings" className="text-sm font-semibold">
          Kết Quả Khám <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="examinationFindings"
          {...register('examinationFindings', {
            required: 'Vui lòng nhập kết quả khám',
            minLength: { value: 1, message: 'Kết quả khám phải có ít nhất 1 ký tự' },
            maxLength: { value: 2000, message: 'Kết quả khám không được vượt quá 2000 ký tự' },
          })}
          placeholder="Mô tả kết quả khám lâm sàng..."
          rows={5}
          disabled={!canEdit}
          className={errors.examinationFindings ? 'border-destructive' : ''}
        />
        {errors.examinationFindings && (
          <p className="text-sm text-destructive">{errors.examinationFindings.message}</p>
        )}
      </div>

      {/* Treatment Notes */}
      <div className="space-y-2">
        <Label htmlFor="treatmentNotes" className="text-sm font-semibold">
          Ghi Chú Điều Trị
        </Label>
        <Textarea
          id="treatmentNotes"
          {...register('treatmentNotes', {
            maxLength: { value: 2000, message: 'Ghi chú không được vượt quá 2000 ký tự' },
          })}
          placeholder="Ghi chú về quá trình điều trị..."
          rows={4}
          disabled={!canEdit}
          className={errors.treatmentNotes ? 'border-destructive' : ''}
        />
        {errors.treatmentNotes && (
          <p className="text-sm text-destructive">{errors.treatmentNotes.message}</p>
        )}
      </div>

      <Separator />

      {/* Vital Signs */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold">Dấu Hiệu Sinh Tồn</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bloodPressure" className="text-xs text-muted-foreground">
              Huyết Áp (mmHg)
            </Label>
            <Input
              id="bloodPressure"
              {...register('bloodPressure')}
              placeholder="120/80"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heartRate" className="text-xs text-muted-foreground">
              Nhịp Tim (bpm)
            </Label>
            <Input
              id="heartRate"
              {...register('heartRate')}
              placeholder="72"
              type="number"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-xs text-muted-foreground">
              Nhiệt Độ (°C)
            </Label>
            <Input
              id="temperature"
              {...register('temperature')}
              placeholder="36.5"
              type="number"
              step="0.1"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="respiratoryRate" className="text-xs text-muted-foreground">
              Nhịp Thở (lần/phút)
            </Label>
            <Input
              id="respiratoryRate"
              {...register('respiratoryRate')}
              placeholder="16"
              type="number"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oxygenSaturation" className="text-xs text-muted-foreground">
              SpO2 (%)
            </Label>
            <Input
              id="oxygenSaturation"
              {...register('oxygenSaturation')}
              placeholder="98"
              type="number"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Follow-up Date */}
      <div className="space-y-2">
        <Label htmlFor="followUpDate" className="text-sm font-semibold">
          Ngày Tái Khám
        </Label>
        <Input
          id="followUpDate"
          type="date"
          {...register('followUpDate')}
          disabled={!canEdit}
        />
      </div>

      <Separator />

      {/* Prescription Form */}
      {existingRecord?.clinicalRecordId && (
        <PrescriptionForm
          recordId={existingRecord.clinicalRecordId}
          existingPrescription={prescription}
          onSuccess={(updatedPrescription) => {
            setPrescription(updatedPrescription);
          }}
          onDelete={() => {
            setPrescription(null);
          }}
          readOnly={readOnly || !canEdit}
        />
      )}

      <Separator />

      {/* Odontogram */}
      {effectivePatientId && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Sơ Đồ Răng (Odontogram)</Label>
            <Odontogram
              patientId={effectivePatientId}
              toothStatuses={toothStatuses}
              onToothClick={handleToothClick}
              editable={canEdit}
              readOnly={readOnly || !canEdit}
            />
          </div>

          {/* Tooth Status Dialog */}
          {selectedTooth && (
            <ToothStatusDialog
              open={toothDialogOpen}
              onOpenChange={setToothDialogOpen}
              patientId={effectivePatientId}
              toothNumber={selectedTooth.number}
              currentStatus={selectedTooth.status}
              currentNotes={selectedTooth.notes}
              onSuccess={handleToothStatusUpdate}
            />
          )}
        </>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || (!isDirty && isEditMode)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Cập nhật' : 'Tạo bệnh án'}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
