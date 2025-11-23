'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import storageService, { StorageTransaction } from '@/services/storageService';
import supplierServiceV3 from '@/services/supplierService';
import { itemMasterService } from '@/services/warehouseService';
import { ItemMaster } from '@/types/warehouse';

interface EditImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
}

interface EditImportFormData {
  supplier_id: number;
  transaction_date: string;
  notes: string;
  items: {
    item_master_id: number;
    lot_number: string;
    quantity: number;
    import_price: number;
    expiry_date: string;
  }[];
}

export default function EditImportModal({
  isOpen,
  onClose,
  transactionId,
}: EditImportModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch transaction detail
  const { data: transaction, isLoading: loadingTransaction } = useQuery({
    queryKey: ['storageTransaction', transactionId],
    queryFn: () => storageService.getById(transactionId!),
    enabled: isOpen && !!transactionId,
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierServiceV3.getAll(),
    enabled: isOpen,
  });

  const suppliers = suppliersData || [];

  // Fetch item masters
  const { data: items = [] } = useQuery<ItemMaster[]>({
    queryKey: ['itemMasters'],
    queryFn: async () => {
      const result = await itemMasterService.getSummary({});
      return result;
    },
    enabled: isOpen,
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<EditImportFormData>({
    defaultValues: {
      supplier_id: 0,
      transaction_date: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Populate form when transaction loaded
  useEffect(() => {
    if (transaction && isOpen) {
      reset({
        supplier_id: transaction.supplierId || 0,
        transaction_date: transaction.transactionDate?.split('T')[0] || '',
        notes: transaction.notes || '',
        items: transaction.items.map(item => ({
          item_master_id: item.itemMasterId,
          lot_number: item.lotNumber,
          quantity: item.quantityChange,
          import_price: item.unitPrice,
          expiry_date: item.expiryDate?.split('T')[0] || '',
        })),
      });
    }
  }, [transaction, isOpen, reset]);

  const onSubmit = async (data: EditImportFormData) => {
    if (!transactionId) return;

    // Validation
    if (!data.supplier_id) {
      toast.error('Vui lòng chọn nhà cung cấp!');
      return;
    }

    if (data.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 vật tư!');
      return;
    }

    // Validate transaction is not too old (30 days)
    const transactionDate = new Date(transaction!.transactionDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      toast.error('Không thể sửa phiếu nhập quá 30 ngày!');
      return;
    }

    // Check for empty items
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.item_master_id || !item.lot_number || item.quantity <= 0 || item.import_price < 0) {
        toast.error(`Vui lòng điền đầy đủ thông tin vật tư dòng ${i + 1}!`);
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: Call API to update full import transaction
      // Currently backend only supports updateNotes
      // For now, just update notes as workaround
      await storageService.updateNotes(transactionId, data.notes);
      
      toast.success('Cập nhật phiếu nhập thành công!');
      toast.warning('Lưu ý: Hiện tại chỉ cập nhật được ghi chú. Vui lòng liên hệ IT để cập nhật items.');
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
      
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phiếu nhập!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    append({
      item_master_id: items.length > 0 ? items[0].item_master_id : 0,
      lot_number: '',
      quantity: 1,
      import_price: 0,
      expiry_date: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length <= 1) {
      toast.error('Phải có ít nhất 1 vật tư trong phiếu!');
      return;
    }
    remove(index);
  };

  if (!transactionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phiếu nhập #{transaction?.transactionCode}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phiếu nhập kho. Lưu ý: Không thể sửa phiếu quá 30 ngày.
          </DialogDescription>
        </DialogHeader>

        {loadingTransaction ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_id">Nhà cung cấp *</Label>
                <select
                  id="supplier_id"
                  {...register('supplier_id', { required: true, valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={0}>-- Chọn nhà cung cấp --</option>
                  {(Array.isArray(suppliers) ? suppliers : suppliers?.content || []).map((sup: any) => (
                    <option key={sup.supplierId} value={sup.supplierId}>
                      {sup.supplierName}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="text-sm text-red-600 mt-1">Vui lòng chọn nhà cung cấp</p>
                )}
              </div>

              <div>
                <Label htmlFor="transaction_date">Ngày nhập *</Label>
                <div className="relative">
                  <Input
                    id="transaction_date"
                    type="date"
                    {...register('transaction_date', { required: true })}
                    className="pl-10"
                  />
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                  />
                </div>
                {errors.transaction_date && (
                  <p className="text-sm text-red-600 mt-1">Vui lòng chọn ngày nhập</p>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-semibold">Danh sách vật tư</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                  Thêm vật tư
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vật tư</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lô</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hạn sử dụng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-2">
                          <select
                            {...register(`items.${index}.item_master_id`, { valueAsNumber: true })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {items.map((item) => (
                              <option key={item.item_master_id} value={item.item_master_id}>
                                {item.item_code} - {item.item_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            {...register(`items.${index}.lot_number`)}
                            placeholder="LOT123"
                            className="text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            min={1}
                            className="text-sm w-24"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="date"
                            {...register(`items.${index}.expiry_date`)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Nhập ghi chú..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
