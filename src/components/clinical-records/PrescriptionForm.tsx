'use client';

/**
 * Prescription Form Component
 * 
 * Allows creating/editing prescription for a clinical record
 * Features:
 * - Add/remove prescription items
 * - Link items to warehouse inventory (optional)
 * - Prescription notes
 * - Save/Delete prescription
 * 
 * API 8.14, 8.15, 8.16
 */

import React, { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { inventoryService, ItemMasterV1 } from '@/services/inventoryService';
import {
  PrescriptionDTO,
  PrescriptionItemRequest,
  SavePrescriptionRequest,
} from '@/types/clinicalRecord';
import { Plus, Trash2, Pill, Loader2, Search, X } from 'lucide-react';

interface PrescriptionFormProps {
  recordId: number;
  existingPrescription?: PrescriptionDTO | null;
  onSuccess?: (prescription: PrescriptionDTO) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  // Controlled mode: if provided, dialog is controlled from outside
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PrescriptionFormData {
  prescriptionNotes: string;
  items: Array<{
    itemMasterId?: number;
    itemName: string;
    quantity: number;
    dosageInstructions: string;
  }>;
}

export default function PrescriptionForm({
  recordId,
  existingPrescription,
  onSuccess,
  onDelete,
  readOnly = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PrescriptionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<ItemMasterV1[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<PrescriptionFormData>({
    defaultValues: {
      prescriptionNotes: existingPrescription?.prescriptionNotes || '',
      items: existingPrescription?.items?.map((item) => ({
        itemMasterId: item.itemMasterId,
        itemName: item.itemName,
        quantity: item.quantity,
        dosageInstructions: item.dosageInstructions || '',
      })) || [
        {
          itemName: '',
          quantity: 1,
          dosageInstructions: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Load inventory items for search
  useEffect(() => {
    if (isOpen && !readOnly) {
      loadInventoryItems();
    }
  }, [isOpen, readOnly]);

  // Reset form when dialog opens in controlled mode
  useEffect(() => {
    if (isOpen && isControlled) {
      if (existingPrescription) {
        reset({
          prescriptionNotes: existingPrescription.prescriptionNotes || '',
          items: existingPrescription.items?.map((item) => ({
            itemMasterId: item.itemMasterId,
            itemName: item.itemName,
            quantity: item.quantity,
            dosageInstructions: item.dosageInstructions || '',
          })) || [
            {
              itemName: '',
              quantity: 1,
              dosageInstructions: '',
            },
          ],
        });
      } else {
        reset({
          prescriptionNotes: '',
          items: [
            {
              itemName: '',
              quantity: 1,
              dosageInstructions: '',
            },
          ],
        });
      }
    }
  }, [isOpen, isControlled, existingPrescription, reset]);

  const loadInventoryItems = async () => {
    setLoadingInventory(true);
    try {
      // Load inventory items (medications) for search
      const response = await inventoryService.getSummary({
        page: 0,
        size: 100,
      });
      // Map InventorySummary to ItemMasterV1
      const mappedItems: ItemMasterV1[] = (response.content || []).map((item) => ({
        id: item.itemMasterId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        categoryId: 0,
        categoryName: item.categoryName,
        unitOfMeasure: item.unitOfMeasure,
        warehouseType: item.warehouseType,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        currentStock: item.totalQuantityOnHand,
        stockStatus: item.stockStatus,
        isTool: false,
      }));
      setInventoryItems(mappedItems);
    } catch (error: any) {
      console.error('Error loading inventory items:', error);
      // Don't show error - inventory search is optional
    } finally {
      setLoadingInventory(false);
    }
  };

  // Filter inventory items by search query
  const filteredInventoryItems = inventoryItems.filter((item) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(query) ||
      item.itemCode.toLowerCase().includes(query)
    );
  });

  const handleAddItem = () => {
    append({
      itemName: '',
      quantity: 1,
      dosageInstructions: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error('Phải có ít nhất một thuốc trong đơn');
    }
  };

  const handleSelectInventoryItem = (index: number, item: ItemMasterV1) => {
    const currentItems = watch('items');
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      itemMasterId: item.id,
      itemName: item.itemName,
    };
    reset({
      ...watch(),
      items: updatedItems,
    });
    setSearchQuery('');
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    setIsSubmitting(true);
    try {
      // Validate items
      if (data.items.length === 0) {
        toast.error('Phải có ít nhất một thuốc trong đơn');
        return;
      }

      // Validate each item
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.itemName || !item.itemName.trim()) {
          toast.error(`Thuốc thứ ${i + 1}: Tên thuốc không được để trống`);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          toast.error(`Thuốc thứ ${i + 1}: Số lượng phải lớn hơn 0`);
          return;
        }
      }

      // Build request
      const request: SavePrescriptionRequest = {
        prescriptionNotes: data.prescriptionNotes?.trim() || undefined,
        items: data.items.map((item) => ({
          itemMasterId: item.itemMasterId,
          itemName: item.itemName.trim(),
          quantity: item.quantity,
          dosageInstructions: item.dosageInstructions?.trim() || undefined,
        })),
      };

      const savedPrescription = await clinicalRecordService.savePrescription(recordId, request);
      
      toast.success('Lưu đơn thuốc thành công');
      reset({
        prescriptionNotes: savedPrescription.prescriptionNotes || '',
        items: savedPrescription.items.map((item) => ({
          itemMasterId: item.itemMasterId,
          itemName: item.itemName,
          quantity: item.quantity,
          dosageInstructions: item.dosageInstructions || '',
        })),
      });
      
      if (onSuccess) {
        onSuccess(savedPrescription);
      }
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu đơn thuốc';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPrescription) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa đơn thuốc này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await clinicalRecordService.deletePrescription(recordId);
      toast.success('Xóa đơn thuốc thành công');
      reset({
        prescriptionNotes: '',
        items: [
          {
            itemName: '',
            quantity: 1,
            dosageInstructions: '',
          },
        ],
      });
      if (onDelete) {
        onDelete();
      }
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa đơn thuốc';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset form when existingPrescription changes
  useEffect(() => {
    if (existingPrescription) {
      reset({
        prescriptionNotes: existingPrescription.prescriptionNotes || '',
        items: existingPrescription.items?.map((item) => ({
          itemMasterId: item.itemMasterId,
          itemName: item.itemName,
          quantity: item.quantity,
          dosageInstructions: item.dosageInstructions || '',
        })) || [
          {
            itemName: '',
            quantity: 1,
            dosageInstructions: '',
          },
        ],
      });
    } else {
      reset({
        prescriptionNotes: '',
        items: [
          {
            itemName: '',
            quantity: 1,
            dosageInstructions: '',
          },
        ],
      });
    }
  }, [existingPrescription, reset]);

  return (
    <>
      {!isControlled && (
        <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Đơn Thuốc
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
              >
                {existingPrescription ? (
                  <>
                    <Pill className="h-4 w-4 mr-2" />
                    Sửa đơn thuốc
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo đơn thuốc
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {existingPrescription ? (
            <div className="space-y-3">
              {existingPrescription.prescriptionNotes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Ghi chú:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {existingPrescription.prescriptionNotes}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {existingPrescription.items?.map((item, index) => (
                  <div
                    key={item.prescriptionItemId || index}
                    className="p-3 border rounded-md space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.itemName}</span>
                          {item.itemCode && (
                            <Badge variant="secondary" className="text-xs">
                              {item.itemCode}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Số lượng: {item.quantity}
                            {item.unitName && ` ${item.unitName}`}
                          </Badge>
                        </div>
                        {item.dosageInstructions && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Cách dùng: </span>
                            {item.dosageInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có đơn thuốc nào được kê</p>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo đơn thuốc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Prescription Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingPrescription ? 'Sửa đơn thuốc' : 'Tạo đơn thuốc'}
            </DialogTitle>
            <DialogDescription>
              {existingPrescription
                ? 'Cập nhật thông tin đơn thuốc. Tất cả thuốc cũ sẽ được thay thế bằng danh sách mới.'
                : 'Tạo đơn thuốc mới cho bệnh án này'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Prescription Notes */}
            <div>
              <Label htmlFor="prescriptionNotes">Ghi chú đơn thuốc (Tùy chọn)</Label>
              <Textarea
                id="prescriptionNotes"
                {...register('prescriptionNotes')}
                placeholder="Ví dụ: Kiêng đồ chua cay, uống nhiều nước, tái khám sau 5 ngày..."
                className="mt-1"
                rows={3}
                disabled={readOnly}
              />
            </div>

            {/* Prescription Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Danh sách thuốc</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thuốc
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline">Thuốc men</Badge>
                      {!readOnly && fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Item Name with Inventory Search */}
                      <div>
                        <Label>
                          Tên thuốc <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            {...register(`items.${index}.itemName`, {
                              required: 'Tên thuốc không được để trống',
                            })}
                            placeholder="Nhập tên thuốc hoặc tìm trong kho..."
                            disabled={readOnly}
                            className="pr-10"
                            onChange={(e) => {
                              register(`items.${index}.itemName`).onChange(e);
                              if (e.target.value.length > 0) {
                                setSearchQuery(e.target.value);
                              } else {
                                setSearchQuery('');
                              }
                            }}
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          
                          {/* Inventory Search Dropdown */}
                          {!readOnly && searchQuery.trim() && filteredInventoryItems.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {filteredInventoryItems.slice(0, 5).map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                                  onClick={() => handleSelectInventoryItem(index, item)}
                                >
                                  <div className="font-medium">{item.itemName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.itemCode} • {item.unitOfMeasure}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {errors.items?.[index]?.itemName && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.items[index]?.itemName?.message}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>
                            Số lượng <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            {...register(`items.${index}.quantity`, {
                              required: 'Số lượng không được để trống',
                              min: { value: 1, message: 'Số lượng phải lớn hơn 0' },
                              valueAsNumber: true,
                            })}
                            disabled={readOnly}
                            className="mt-1"
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.quantity?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dosage Instructions */}
                      <div>
                        <Label>Cách dùng (Tùy chọn)</Label>
                        <Textarea
                          {...register(`items.${index}.dosageInstructions`)}
                          placeholder="Ví dụ: Uống 2 viên/lần, 3 lần/ngày, sau bữa ăn..."
                          className="mt-1"
                          rows={2}
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              {existingPrescription && !readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa đơn thuốc
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting || isDeleting}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Pill className="h-4 w-4 mr-2" />
                      Lưu đơn thuốc
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

