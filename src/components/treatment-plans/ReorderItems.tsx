'use client';

/**
 * Reorder Items Component
 * API 5.14: Reorder Treatment Plan Items via Drag & Drop
 * V21.5: Allows doctors/managers to reorder items within a phase
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, GripVertical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ItemDetailDTO, ReorderItemsRequest } from '@/types/treatmentPlan';
import { cn } from '@/lib/utils';

interface ReorderItemsProps {
  phaseId: number;
  phaseName: string;
  items: ItemDetailDTO[];
  onSuccess: () => void; // Callback to refresh phase data
  disabled?: boolean;
}

export default function ReorderItems({
  phaseId,
  phaseName,
  items: initialItems,
  onSuccess,
  disabled = false,
}: ReorderItemsProps) {
  const [items, setItems] = useState<ItemDetailDTO[]>(initialItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync items when prop changes
  useEffect(() => {
    setItems(initialItems);
    setHasChanges(false);
  }, [initialItems]);

  // Handle drag start
  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();

    if (draggedIndex !== index) {
      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, draggedItem);
      setItems(newItems);
      setDraggedIndex(index);
      setHasChanges(true);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const request: ReorderItemsRequest = {
        itemIds: items.map((item) => item.itemId),
      };

      const response = await TreatmentPlanService.reorderItems(phaseId, request);

      toast.success('Đã lưu thứ tự mới', {
        description: `Đã sắp xếp lại ${response.itemsReordered} hạng mục trong ${phaseName}`,
      });

      setHasChanges(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error reordering items:', error);

      // Rollback to original order
      setItems(initialItems);
      setHasChanges(false);

      if (error.response?.status === 409) {
        // Concurrent modification detected
        toast.error('Có người khác đã thay đổi danh sách', {
          description: 'Vui lòng tải lại trang để xem thứ tự mới nhất.',
          duration: 5000,
        });
        // Auto-reload after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy phase hoặc items', {
          description: error.response?.data?.message || 'Dữ liệu không tồn tại',
        });
      } else {
        toast.error('Không thể lưu thứ tự', {
          description: error.response?.data?.message || 'Vui lòng thử lại sau',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setItems(initialItems);
    setHasChanges(false);
    setDraggedIndex(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Không có hạng mục để sắp xếp
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sắp xếp thứ tự hạng mục</span>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Lưu thay đổi
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Alert */}
      {hasChanges && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Thứ tự đã thay đổi</p>
              <p className="text-xs text-blue-800">
                Kéo thả các hạng mục để sắp xếp lại. Nhấn "Lưu thứ tự" để áp dụng thay đổi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isDragging = draggedIndex === index;
          const sequenceNumber = index + 1;

          return (
            <div
              key={item.itemId}
              draggable={!disabled && !isSaving}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-3 p-3 border rounded-lg bg-white transition-all',
                isDragging && 'opacity-50 cursor-grabbing',
                !disabled && !isSaving && 'cursor-grab hover:bg-gray-50 hover:border-primary/50',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              {/* Drag Handle */}
              <div className="flex-shrink-0">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Sequence Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{sequenceNumber}</span>
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.itemName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {item.price != null && item.price > 0 && (
                    <>
                      <span>{item.price.toLocaleString('vi-VN')} VND</span>
                    </>
                  )}
                  {item.estimatedTimeMinutes > 0 && (
                    <>
                      {item.price != null && item.price > 0 && <span>•</span>}
                      <span>~{item.estimatedTimeMinutes} phút</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      {!hasChanges && !disabled && (
        <p className="text-xs text-muted-foreground text-center">
          Kéo thả các hạng mục để sắp xếp lại thứ tự
        </p>
      )}
    </div>
  );
}

