'use client';

/**
 * Prescription List Component
 * 
 * Displays list of prescriptions (read-only for now)
 * Optimized UX: Simple list, minimal cards
 */

import React from 'react';
import { PrescriptionDTO } from '@/types/clinicalRecord';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Pill, Calendar, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PrescriptionListProps {
  prescriptions: PrescriptionDTO[];
  canEdit?: boolean;
  onEdit?: (prescription: PrescriptionDTO) => void;
  onCreate?: () => void;
}

export default function PrescriptionList({
  prescriptions,
  canEdit = false,
  onEdit,
  onCreate,
}: PrescriptionListProps) {
  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateTime;
    }
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Đơn thuốc</h3>
          </div>
          {canEdit && onCreate && (
            <Button onClick={onCreate} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Kê đơn thuốc
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có đơn thuốc nào được kê</p>
          {canEdit && onCreate && (
            <Button
              onClick={onCreate}
              variant="outline"
              className="mt-4"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Kê đơn thuốc
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Đơn Thuốc ({prescriptions.length})</h3>
        </div>
        {canEdit && onCreate && (
          <Button onClick={onCreate} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Kê đơn thuốc
          </Button>
        )}
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.map((prescription, prescriptionIndex) => (
          <div key={prescription.prescriptionId}>
            <div className="p-4 border rounded-lg space-y-3">
              {/* Prescription Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-medium">
                      Đơn #{prescription.prescriptionId}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(prescription.createdAt)}
                    </div>
                  </div>
                  {prescription.prescriptionNotes && (
                    <div className="text-sm text-muted-foreground mb-3">
                      {prescription.prescriptionNotes}
                    </div>
                  )}
                </div>
                {canEdit && onEdit && (
                  <Button
                    onClick={() => onEdit(prescription)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>

              {/* Prescription Items */}
              {prescription.items && prescription.items.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  {prescription.items.map((item, itemIndex) => (
                    <div
                      key={item.prescriptionItemId}
                      className="p-3 bg-muted/50 rounded-md space-y-1"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {item.itemName}
                            </span>
                            {item.itemCode && (
                              <Badge variant="secondary" className="text-xs">
                                {item.itemCode}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Số lượng: {item.quantity}
                            </Badge>
                          </div>
                          {item.dosageInstructions && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Cách dùng: </span>
                              {item.dosageInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!prescription.items || prescription.items.length === 0) && (
                <div className="text-sm text-muted-foreground italic pl-4">
                  Chưa có thuốc trong đơn này
                </div>
              )}
            </div>
            {prescriptionIndex < prescriptions.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

