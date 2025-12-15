'use client';

/**
 * Odontogram Test Page
 * 
 * Test page để preview và kiểm duyệt component Odontogram
 */

import React, { useState } from 'react';
import Odontogram from '@/components/clinical-records/Odontogram';
import { ToothStatusResponse, ToothCondition } from '@/types/clinicalRecord';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Helper constants (same as in Odontogram component)
const TOOTH_STATUS_COLORS: Record<ToothCondition, string> = {
  HEALTHY: '#10b981',
  CARIES: '#ef4444',
  FILLED: '#3b82f6',
  CROWN: '#f59e0b',
  ROOT_CANAL: '#ec4899',
  MISSING: '#6b7280',
  IMPLANT: '#8b5cf6',
  FRACTURED: '#f97316',
  IMPACTED: '#6366f1',
};

const TOOTH_STATUS_LABELS: Record<ToothCondition, string> = {
  HEALTHY: 'Khỏe mạnh',
  CARIES: 'Sâu răng',
  FILLED: 'Trám',
  CROWN: 'Bọc sứ',
  ROOT_CANAL: 'Điều trị tủy',
  MISSING: 'Mất răng',
  IMPLANT: 'Cấy ghép',
  FRACTURED: 'Gãy răng',
  IMPACTED: 'Mọc ngầm',
};

const TOOTH_STATUS_ABBR: Record<ToothCondition, string> = {
  HEALTHY: '',
  CARIES: 'SR',
  FILLED: 'ĐT',
  CROWN: 'BS',
  ROOT_CANAL: 'ĐTT',
  MISSING: 'MR',
  IMPLANT: 'CG',
  FRACTURED: 'GR',
  IMPACTED: 'MN',
};

// Mock data for testing
const MOCK_TOOTH_STATUSES: ToothStatusResponse[] = [
  {
    toothStatusId: 1,
    patientId: 1,
    toothNumber: '18',
    status: 'MISSING',
    notes: 'Răng khôn đã nhổ năm 2023',
    recordedAt: '2025-12-02T03:17:35',
    updatedAt: '2025-12-02T03:18:28',
  },
  {
    toothStatusId: 2,
    patientId: 1,
    toothNumber: '36',
    status: 'CROWN',
    notes: 'Bọc sứ kim loại',
    recordedAt: '2025-12-02T03:17:35',
  },
  {
    toothStatusId: 3,
    patientId: 1,
    toothNumber: '46',
    status: 'CARIES',
    notes: 'Sâu răng sau, cần điều trị',
    recordedAt: '2025-12-02T03:17:35',
  },
  {
    toothStatusId: 4,
    patientId: 1,
    toothNumber: '21',
    status: 'IMPLANT',
    notes: 'Cấy ghép Implant thành công',
    recordedAt: '2025-12-02T03:17:35',
  },
  {
    toothStatusId: 5,
    patientId: 1,
    toothNumber: '12',
    status: 'FILLED',
    notes: 'Đã trám composite',
    recordedAt: '2025-12-02T03:17:35',
  },
  {
    toothStatusId: 6,
    patientId: 1,
    toothNumber: '35',
    status: 'ROOT_CANAL',
    notes: 'Đã điều trị tủy',
    recordedAt: '2025-12-02T03:17:35',
  },
  {
    toothStatusId: 7,
    patientId: 1,
    toothNumber: '47',
    status: 'FRACTURED',
    notes: 'Răng bị gãy một phần',
    recordedAt: '2025-12-02T03:17:35',
  },
];

export default function OdontogramTestPage() {
  const [toothStatuses, setToothStatuses] = useState<ToothStatusResponse[]>(MOCK_TOOTH_STATUSES);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ToothCondition>('HEALTHY');
  const [notes, setNotes] = useState('');
  const [readOnly, setReadOnly] = useState(false);

  const handleToothClick = (
    toothNumber: string,
    status?: ToothCondition,
    existingNotes?: string
  ) => {
    setSelectedTooth(toothNumber);
    setSelectedStatus(status || 'HEALTHY');
    setNotes(existingNotes || '');
    toast.info(`Đã chọn răng ${toothNumber}`);
  };

  const handleUpdateStatus = () => {
    if (!selectedTooth) {
      toast.error('Vui lòng chọn một răng');
      return;
    }

    const existingIndex = toothStatuses.findIndex(
      (ts) => ts.toothNumber === selectedTooth
    );

    const newStatus: ToothStatusResponse = {
      toothStatusId: existingIndex >= 0 ? toothStatuses[existingIndex].toothStatusId : Date.now(),
      patientId: 1,
      toothNumber: selectedTooth,
      status: selectedStatus,
      notes: notes || undefined,
      recordedAt: existingIndex >= 0
        ? toothStatuses[existingIndex].recordedAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...toothStatuses];
      updated[existingIndex] = newStatus;
      setToothStatuses(updated);
    } else {
      // Add new
      setToothStatuses([...toothStatuses, newStatus]);
    }

    toast.success(`Đã cập nhật trạng thái răng ${selectedTooth}`);
    setSelectedTooth(null);
    setNotes('');
  };

  const handleRemoveStatus = () => {
    if (!selectedTooth) {
      toast.error('Vui lòng chọn một răng');
      return;
    }

    setToothStatuses(
      toothStatuses.filter((ts) => ts.toothNumber !== selectedTooth)
    );
    toast.success(`Đã xóa trạng thái răng ${selectedTooth}`);
    setSelectedTooth(null);
    setNotes('');
  };

  const handleClearAll = () => {
    setToothStatuses([]);
    setSelectedTooth(null);
    toast.success('Đã xóa tất cả trạng thái răng');
  };

  const handleResetToMock = () => {
    setToothStatuses(MOCK_TOOTH_STATUSES);
    setSelectedTooth(null);
    toast.success('Đã reset về dữ liệu mẫu');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Odontogram Component</h1>
        <p className="text-muted-foreground mt-2">
          Trang test để preview và kiểm duyệt sơ đồ răng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Odontogram Display */}
        <div className="lg:col-span-2">
          <Odontogram
            patientId={1}
            toothStatuses={toothStatuses}
            onToothClick={handleToothClick}
            editable={!readOnly}
            readOnly={readOnly}
          />
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Điều Khiển</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Read-only toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="readonly">Chế độ chỉ đọc</Label>
                <input
                  id="readonly"
                  type="checkbox"
                  checked={readOnly}
                  onChange={(e) => setReadOnly(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              {/* Selected tooth info */}
              {selectedTooth && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Răng đã chọn:</span>
                    <Badge variant="outline">{selectedTooth}</Badge>
                  </div>
                </div>
              )}

              {/* Status selector */}
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái răng</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as ToothCondition)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTHY">Khỏe mạnh</SelectItem>
                    <SelectItem value="CARIES">Sâu răng</SelectItem>
                    <SelectItem value="FILLED">Đã trám</SelectItem>
                    <SelectItem value="CROWN">Bọc sứ</SelectItem>
                    <SelectItem value="ROOT_CANAL">Điều trị tủy</SelectItem>
                    <SelectItem value="EXTRACTED">Đã nhổ</SelectItem>
                    <SelectItem value="MISSING">Mất răng</SelectItem>
                    <SelectItem value="IMPLANT">Cấy ghép</SelectItem>
                    <SelectItem value="FRACTURED">Gãy răng</SelectItem>
                    <SelectItem value="IMPACTED">Mọc ngầm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes input */}
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  placeholder="Nhập ghi chú..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleUpdateStatus}
                  className="w-full"
                  disabled={!selectedTooth}
                >
                  Cập nhật trạng thái
                </Button>
                <Button
                  onClick={handleRemoveStatus}
                  variant="destructive"
                  className="w-full"
                  disabled={!selectedTooth}
                >
                  Xóa trạng thái
                </Button>
              </div>

              {/* Utility buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  className="w-full"
                >
                  Xóa tất cả
                </Button>
                <Button
                  onClick={handleResetToMock}
                  variant="outline"
                  className="w-full"
                >
                  Reset về dữ liệu mẫu
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Danh Sách Trạng Thái</CardTitle>
            </CardHeader>
            <CardContent>
              {toothStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có trạng thái nào được ghi nhận
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {toothStatuses.map((status) => (
                    <div
                      key={status.toothStatusId}
                      className="p-2 border rounded text-sm hover:bg-muted cursor-pointer"
                      onClick={() => handleToothClick(status.toothNumber, status.status, status.notes)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Răng {status.toothNumber}</span>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${
                              status.status
                                ? `#${TOOTH_STATUS_COLORS[status.status].slice(1)}20`
                                : '#e5e7eb'
                            }`,
                            borderColor: status.status
                              ? TOOTH_STATUS_COLORS[status.status]
                              : '#9ca3af',
                          }}
                        >
                          {TOOTH_STATUS_LABELS[status.status]}
                        </Badge>
                      </div>
                      {status.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{status.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

