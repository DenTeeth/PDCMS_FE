'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorageTransaction, TransactionType, WarehouseType } from '@/types/warehouse';
import { FileText, Calendar, User, Package } from 'lucide-react';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: StorageTransaction | null;
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isInTransaction = transaction.type === TransactionType.IN;
  const isColdStorage = transaction.warehouseType === WarehouseType.COLD;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết {isInTransaction ? 'phiếu nhập' : 'phiếu xuất'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết của phiếu {isInTransaction ? 'nhập' : 'xuất'} kho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mã phiếu</p>
              <p className="font-semibold text-lg">{transaction.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Loại kho</p>
              <Badge variant={isColdStorage ? 'default' : 'secondary'}>
                {isColdStorage ? 'Kho lạnh' : 'Kho thường'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {isInTransaction ? 'Ngày nhập' : 'Ngày xuất'}
              </p>
              <p className="font-medium">
                {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            {isInTransaction && transaction.supplierName && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Nhà cung cấp
                </p>
                <p className="font-medium">{transaction.supplierName}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Chi tiết vật tư ({transaction.items?.length || 0})
            </h3>
            {transaction.items && transaction.items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">STT</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Mã vật tư</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Tên vật tư</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">Số lượng</th>
                      {isColdStorage && (
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Hạn SD</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-4 text-sm">{index + 1}</td>
                        <td className="py-2 px-4">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.itemId || '-'}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 text-sm font-medium">{item.itemName}</td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">{item.quantity}</td>
                        {isColdStorage && (
                          <td className="py-2 px-4 text-sm">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString('vi-VN')
                              : '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không có vật tư nào</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div>
              <h3 className="font-semibold mb-2">Ghi chú</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{transaction.notes}</p>
            </div>
          )}

          {/* Footer Info */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <p>Ngày tạo: {new Date(transaction.createdAt).toLocaleString('vi-VN')}</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
