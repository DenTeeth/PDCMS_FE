'use client';

/**
 * Clinical Record View Component
 * 
 * Displays clinical record details in read-only mode
 * Shows: diagnosis, vital signs, chief complaint, examination findings,
 * treatment notes, procedures, prescriptions, and appointment info
 */

import React, { useState } from 'react';
import { ClinicalRecordResponse } from '@/types/clinicalRecord';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ProcedureList from './ProcedureList';
import PrescriptionList from './PrescriptionList';
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
      <PrescriptionList prescriptions={record.prescriptions || []} />
    </div>
  );
}

