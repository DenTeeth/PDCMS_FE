'use client';


import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToothCondition, UpdateToothStatusRequest } from '@/types/clinicalRecord';
import { toothStatusService } from '@/services/toothStatusService';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

// Status labels in Vietnamese (matching legend - excluding HEALTHY and MISSING)
const TOOTH_STATUS_LABELS: Record<ToothCondition, string> = {
  HEALTHY: 'Khỏe mạnh',
  CARIES_MILD: 'Sâu răng nhẹ',
  CARIES_MODERATE: 'Sâu răng vừa',
  CARIES_SEVERE: 'Sâu răng nặng',
  FILLED: 'Răng trám',
  CROWN: 'Bọc sứ',
  ROOT_CANAL: 'Điều trị tủy',
  MISSING: 'Mất răng',
  IMPLANT: 'Cấy ghép',
  FRACTURED: 'Gãy răng',
  IMPACTED: 'Mọc ngầm',
};

// Status options for dropdown (only show in legend)
const DROPDOWN_STATUS_OPTIONS: ToothCondition[] = [
  'CARIES_MILD',
  'CARIES_MODERATE',
  'CARIES_SEVERE',
  'FILLED',
  'CROWN',
  'ROOT_CANAL',
  'IMPLANT',
  'FRACTURED',
  'IMPACTED',
];

interface ToothStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  toothNumber: string;
  currentStatus?: ToothCondition;
  currentNotes?: string;
  onSuccess?: () => void;
}

export default function ToothStatusDialog({
  open,
  onOpenChange,
  patientId,
  toothNumber,
  currentStatus,
  currentNotes,
  onSuccess,
}: ToothStatusDialogProps) {
  const [status, setStatus] = useState<ToothCondition>(currentStatus || 'HEALTHY');
  const [notes, setNotes] = useState<string>(currentNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens or props change
  useEffect(() => {
    if (open) {
      setStatus(currentStatus || 'CARIES_MILD'); // Default to CARIES_MILD instead of HEALTHY
      setNotes(currentNotes || '');
    }
  }, [open, currentStatus, currentNotes]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const request: UpdateToothStatusRequest = {
        toothNumber,
        status,
        notes: notes.trim() || undefined,
      };

      await toothStatusService.updateToothStatus(patientId, request);
      
      toast.success(`Đã cập nhật trạng thái răng ${toothNumber}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating tooth status:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái răng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cập Nhật Trạng Thái Răng {toothNumber}</DialogTitle>
          <DialogDescription>
            Chọn trạng thái và thêm ghi chú (nếu cần) cho răng {toothNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng Thái <span className="text-destructive">*</span></Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ToothCondition)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent align="start">
                {DROPDOWN_STATUS_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TOOTH_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú về trạng thái răng (tùy chọn)..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 ký tự
            </p>
          </div>

          {/* Info Note */}
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Nếu chọn "Khỏe mạnh", bản ghi trạng thái sẽ bị xóa (răng trở về trạng thái mặc định)</li>
              <li>Chỉ các răng có trạng thái bất thường mới được lưu trong hệ thống</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

