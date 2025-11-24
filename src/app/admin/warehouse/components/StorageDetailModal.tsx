'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { storageService, StorageTransaction } from '@/services/storageService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faInfoCircle,
  faBoxes,
  faCalendarAlt,
  faUser,
  faBuilding,
  faStickyNote,
  faBarcode,
  faBox,
  faMoneyBill,
} from '@fortawesome/free-solid-svg-icons';

interface StorageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
}

export default function StorageDetailModal({
  isOpen,
  onClose,
  transactionId,
}: StorageDetailModalProps) {
  const { data: transaction, isLoading } = useQuery({
    queryKey: ['storageTransaction', transactionId],
    queryFn: () => storageService.getById(transactionId!),
    enabled: isOpen && !!transactionId,
  });

  if (!transactionId) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'bg-green-100 text-green-800';
      case 'EXPORT': return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      case 'LOSS': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'Nhập kho';
      case 'EXPORT': return 'Xuất kho';
      case 'ADJUSTMENT': return 'Điều chỉnh';
      case 'LOSS': return 'Hao hụt';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faFileInvoice} className="text-primary" />
            Chi tiết phiếu kho
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết phiếu nhập/xuất kho
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4" />
              Thông tin phiếu
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <FontAwesomeIcon icon={faBoxes} className="w-4 h-4" />
              Chi tiết vật tư ({transaction?.items?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Info */}
          <TabsContent value="info" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="text-center py-8">Đang tải thông tin...</div>
            ) : !transaction ? (
              <div className="text-center py-8 text-red-500">Không thể tải thông tin phiếu</div>
            ) : (
              <>
                {/* Basic Information */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Thông tin cơ bản
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBarcode} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Mã phiếu</p>
                        <p className="font-semibold font-mono">{transaction.transactionCode}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Loại phiếu</p>
                        <Badge className={getTypeColor(transaction.transactionType)}>
                          {getTypeLabel(transaction.transactionType)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày giao dịch</p>
                        <p className="font-medium">{formatDate(transaction.transactionDate)}</p>
                      </div>
                    </div>

                    {transaction.supplierName && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nhà cung cấp</p>
                          <p className="font-medium">{transaction.supplierName}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Người thực hiện</p>
                        <p className="font-medium">{transaction.createdByName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {transaction.notes && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faStickyNote} className="w-4 h-4" />
                      Ghi chú
                    </h3>
                    <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                      <span>Ngày tạo: {formatDateTime(transaction.createdAt)}</span>
                    </div>
                    {transaction.updatedAt && (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                        <span>Cập nhật: {formatDateTime(transaction.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 2: Items */}
          <TabsContent value="items" className="mt-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">
                Danh sách vật tư
              </h3>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải danh sách vật tư...
                </div>
              ) : !transaction?.items || transaction.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FontAwesomeIcon icon={faBoxes} className="w-12 h-12 mb-3 opacity-30" />
                  <p>Không có vật tư nào</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr className="text-xs font-semibold text-slate-700">
                        <th className="p-3 text-left">STT</th>
                        <th className="p-3 text-left">Mã vật tư</th>
                        <th className="p-3 text-left">Tên vật tư</th>
                        <th className="p-3 text-left">Số lô</th>
                        <th className="p-3 text-right">Số lượng</th>
                        {transaction.transactionType === 'IMPORT' && (
                          <th className="p-3 text-center bg-amber-50 text-amber-900 font-bold">⚠️ Hạn sử dụng</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item, index) => (
                        <tr key={item.transactionItemId || index} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-600">{index + 1}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.itemCode || '-'}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{item.itemName || '-'}</td>
                          <td className="p-3 font-mono text-sm">{item.lotNumber}</td>
                          <td className="p-3 text-right font-semibold">
                            {item.quantityChange.toLocaleString()}
                          </td>
                          {transaction.transactionType === 'IMPORT' && (
                            <td className="p-3 text-center text-sm">
                              {item.expiryDate ? formatDate(item.expiryDate) : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-6">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
