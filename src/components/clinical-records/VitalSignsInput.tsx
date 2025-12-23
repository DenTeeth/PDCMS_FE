'use client';

/**
 * Vital Signs Input Component
 * Enhanced with reference ranges and real-time assessment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { vitalSignsReferenceService } from '@/services/vitalSignsReferenceService';
import { 
  VitalSignsReferenceResponse, 
  VitalSignAssessment 
} from '@/types/clinicalRecord';
import { 
  assessVitalSign, 
  parseBloodPressure, 
  calculateAge,
  VITAL_TYPE_MAP 
} from '@/utils/vitalSignsAssessment';
import { cn } from '@/lib/utils';

interface VitalSignsInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  patientDateOfBirth?: string;
  disabled?: boolean;
  // Current values from form
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
}

export default function VitalSignsInput({
  register,
  errors,
  patientDateOfBirth,
  disabled = false,
  bloodPressure,
  heartRate,
  temperature,
  oxygenSaturation,
}: VitalSignsInputProps) {
  const [references, setReferences] = useState<VitalSignsReferenceResponse[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);

  // Calculate patient age
  const patientAge = useMemo(() => {
    if (!patientDateOfBirth) return null;
    return calculateAge(patientDateOfBirth);
  }, [patientDateOfBirth]);

  // Load reference ranges
  useEffect(() => {
    const loadReferences = async () => {
      if (!patientAge) return;

      setLoadingReferences(true);
      try {
        const refs = await vitalSignsReferenceService.getReferencesByAge(patientAge);
        setReferences(refs);
      } catch (error: any) {
        console.error('Error loading vital signs references:', error);
        // Silently fail - form can still work without references
      } finally {
        setLoadingReferences(false);
      }
    };

    loadReferences();
  }, [patientAge]);

  // Get reference for a vital type
  const getReference = (vitalType: string): VitalSignsReferenceResponse | undefined => {
    return references.find(ref => ref.vitalType === vitalType);
  };

  // Assess vital sign value
  const assessValue = (fieldName: string, value: string | undefined): VitalSignAssessment | null => {
    // Don't assess if value is empty or "0" (undetermined)
    if (!value || !value.trim() || value.trim() === '0') return null;
    
    // Don't assess if no references loaded yet
    if (references.length === 0) return null;
    
    const vitalType = VITAL_TYPE_MAP[fieldName];
    if (!vitalType) return null;

    // Special handling for blood pressure
    if (fieldName === 'bloodPressure') {
      const bp = parseBloodPressure(value);
      if (!bp) return null;
      
      // Assess systolic
      return assessVitalSign('BLOOD_PRESSURE_SYSTOLIC', bp.systolic, references);
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) return null;

    return assessVitalSign(vitalType, numValue, references);
  };

  // Get status badge - only show if assessment exists
  const getStatusBadge = (assessment: VitalSignAssessment | null) => {
    if (!assessment) return null;
    
    // Don't show badge if status is UNKNOWN (should not happen now as we return null instead)
    if (assessment.status === 'UNKNOWN') {
      return null;
    }

    const statusConfig = {
      NORMAL: { 
        icon: CheckCircle2, 
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Bình thường'
      },
      BELOW_NORMAL: { 
        icon: AlertTriangle, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Thấp'
      },
      ABOVE_NORMAL: { 
        icon: AlertCircle, 
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Cao'
      },
      UNKNOWN: { 
        icon: AlertCircle, 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Không xác định'
      },
    };

    const config = statusConfig[assessment.status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="outline" className={cn('text-xs', config.color)}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        {assessment.normalMin && assessment.normalMax && (
          <span className="text-xs text-muted-foreground">
            ({assessment.normalMin}-{assessment.normalMax} {assessment.unit})
          </span>
        )}
      </div>
    );
  };

  // Assessments
  const bpAssessment = assessValue('bloodPressure', bloodPressure);
  const hrAssessment = assessValue('heartRate', heartRate);
  const tempAssessment = assessValue('temperature', temperature);
  const o2Assessment = assessValue('oxygenSaturation', oxygenSaturation);

  // Get reference ranges for display
  const bpRef = getReference('BLOOD_PRESSURE_SYSTOLIC');
  const hrRef = getReference('HEART_RATE');
  const tempRef = getReference('TEMPERATURE');
  const o2Ref = getReference('OXYGEN_SATURATION');

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Dấu Hiệu Sinh Tồn</Label>
      <div className="grid grid-cols-2 gap-4">
        {/* Blood Pressure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bloodPressure" className="text-xs text-muted-foreground">
              Huyết Áp (mmHg)
            </Label>
            {bpRef && (
              <span className="text-xs text-muted-foreground">
                Bình thường: {bpRef.normalMin}-{bpRef.normalMax} {bpRef.unit}
              </span>
            )}
          </div>
          <Input
            id="bloodPressure"
            {...register('bloodPressure')}
            placeholder="120/80"
            disabled={disabled}
            className={cn(
              bpAssessment?.status === 'ABOVE_NORMAL' || bpAssessment?.status === 'BELOW_NORMAL'
                ? 'border-yellow-500 focus:border-yellow-500'
                : ''
            )}
          />
          {getStatusBadge(bpAssessment)}
        </div>

        {/* Heart Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="heartRate" className="text-xs text-muted-foreground">
              Nhịp Tim (bpm)
            </Label>
            {hrRef && (
              <span className="text-xs text-muted-foreground">
                Bình thường: {hrRef.normalMin}-{hrRef.normalMax} {hrRef.unit}
              </span>
            )}
          </div>
          <Input
            id="heartRate"
            {...register('heartRate')}
            placeholder="72"
            type="number"
            disabled={disabled}
            className={cn(
              hrAssessment?.status === 'ABOVE_NORMAL' || hrAssessment?.status === 'BELOW_NORMAL'
                ? 'border-yellow-500 focus:border-yellow-500'
                : ''
            )}
          />
          {getStatusBadge(hrAssessment)}
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="temperature" className="text-xs text-muted-foreground">
              Nhiệt Độ (°C)
            </Label>
            {tempRef && (
              <span className="text-xs text-muted-foreground">
                Bình thường: {tempRef.normalMin}-{tempRef.normalMax} {tempRef.unit}
              </span>
            )}
          </div>
          <Input
            id="temperature"
            {...register('temperature')}
            placeholder="36.5"
            type="number"
            step="0.1"
            disabled={disabled}
            className={cn(
              tempAssessment?.status === 'ABOVE_NORMAL' || tempAssessment?.status === 'BELOW_NORMAL'
                ? 'border-yellow-500 focus:border-yellow-500'
                : ''
            )}
          />
          {getStatusBadge(tempAssessment)}
        </div>

        {/* Oxygen Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="oxygenSaturation" className="text-xs text-muted-foreground">
              SpO2 (%)
            </Label>
            {o2Ref && (
              <span className="text-xs text-muted-foreground">
                Bình thường: {o2Ref.normalMin}-{o2Ref.normalMax} {o2Ref.unit}
              </span>
            )}
          </div>
          <Input
            id="oxygenSaturation"
            {...register('oxygenSaturation')}
            placeholder="98"
            type="number"
            disabled={disabled}
            className={cn(
              o2Assessment?.status === 'ABOVE_NORMAL' || o2Assessment?.status === 'BELOW_NORMAL'
                ? 'border-yellow-500 focus:border-yellow-500'
                : ''
            )}
          />
          {getStatusBadge(o2Assessment)}
        </div>
      </div>
    </div>
  );
}

