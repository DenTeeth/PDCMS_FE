'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle,
  faBoxes,
  faClipboardList,
  faCheckCircle,
  faTimesCircle,
  faSnowflake,
  faWarehouse,
  faHistory,
  faArrowUp,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { inventoryService, type ItemMasterV1, type ItemBatchV1 } from '@/services/inventoryService';
import { useQuery } from '@tanstack/react-query';

// Import storage service for transaction history
import { storageService, type StorageTransaction, type StorageTransactionItem } from '@/services/storageService';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number | null;
}

export default function ItemDetailModal({
  isOpen,
  onClose,
  itemId,
}: ItemDetailModalProps) {
  // Fetch item detail
  const { data: itemDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['itemDetail', itemId],
    queryFn: () => inventoryService.getById(itemId!),
    enabled: !!itemId,
  });

  // Fetch batches for this item
  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ['itemBatches', itemId],
    queryFn: () => inventoryService.getBatchesByItemId(itemId!),
    enabled: !!itemId,
  });

  // Fetch transaction history for this item
  const { data: transactions = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['itemHistory', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      // Get all transactions and filter by itemMasterId
      const allTransactions = await storageService.getAll({});
      return allTransactions.filter((tx: StorageTransaction) => 
        tx.items?.some((item: StorageTransactionItem) => item.itemMasterId === itemId)
      ).sort((a: StorageTransaction, b: StorageTransaction) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
    },
    enabled: !!itemId,
  });

  if (!itemId) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStockStatusBadge = (status?: string) => {
    const variants: Record<string, { className: string; label: string; icon: any }> = {
      NORMAL: { className: 'bg-green-100 text-green-800', label: 'Bình thường', icon: faCheckCircle },
      LOW_STOCK: { className: 'bg-red-100 text-red-800', label: 'Sắp hết', icon: faTimesCircle },
      OUT_OF_STOCK: { className: 'bg-gray-100 text-gray-800', label: 'Hết hàng', icon: faTimesCircle },
      OVERSTOCK: { className: 'bg-blue-100 text-blue-800', label: 'Dư thừa', icon: faCheckCircle },
    };
    const config = variants[status || 'NORMAL'];
    return (
      <Badge className={config.className + ' flex items-center gap-1 w-fit'}>
        <FontAwesomeIcon icon={config.icon} className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getWarehouseTypeBadge = (type?: 'COLD' | 'NORMAL') => {
    return type === 'COLD' ? (
      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
        <FontAwesomeIcon icon={faSnowflake} className="w-3 h-3" />
        Kho lạnh
      </Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-800 flex items-center gap-1 w-fit">
        <FontAwesomeIcon icon={faWarehouse} className="w-3 h-3" />
        Kho thường
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (expiryDate?: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;

    if (days < 0) {
      return <Badge className="bg-red-600 text-white">Đã hết hạn</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-orange-500 text-white">Sắp hết hạn ({days} ngày)</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-yellow-500 text-white">Cảnh báo ({days} ngày)</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Còn hạn ({days} ngày)</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary" />
            Chi tiết vật tư
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết và danh sách lô hàng của vật tư
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : !itemDetail ? (
          <div className="text-center py-8 text-red-500">Không tìm thấy vật tư</div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger value="batches" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxes} className="h-4 w-4" />
                Danh sách lô hàng ({batches.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} className="h-4 w-4" />
                Lịch sử ({transactions.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Thông tin */}
            <TabsContent value="info" className="space-y-6 mt-6">
              {/* Thông tin chính */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} className="text-blue-600" />
                  Thông tin chính
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mã vật tư</p>
                    <p className="font-mono font-semibold">{itemDetail.itemCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tên vật tư</p>
                    <p className="font-semibold">{itemDetail.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Danh mục</p>
                    <p className="font-medium">{itemDetail.categoryName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đơn vị tính</p>
                    <p className="font-medium">{itemDetail.unitOfMeasure}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loại kho</p>
                    <div className="mt-1">{getWarehouseTypeBadge(itemDetail.warehouseType)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loại vật tư</p>
                    <p className="font-medium">{itemDetail.isTool ? 'Dụng cụ' : 'Vật tư tiêu hao'}</p>
                  </div>
                </div>
              </div>

              {/* Thông tin tồn kho */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faBoxes} className="text-green-600" />
                  Thông tin tồn kho
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tồn kho hiện tại</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {itemDetail.currentStock || 0} {itemDetail.unitOfMeasure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <div className="mt-1">{getStockStatusBadge(itemDetail.stockStatus)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tồn kho tối thiểu</p>
                    <p className="font-semibold text-orange-600">
                      {itemDetail.minStockLevel} {itemDetail.unitOfMeasure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tồn kho tối đa</p>
                    <p className="font-semibold text-green-600">
                      {itemDetail.maxStockLevel} {itemDetail.unitOfMeasure}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {itemDetail.notes && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Ghi chú</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{itemDetail.notes}</p>
                </div>
              )}

              {/* Thông tin hệ thống */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Thông tin hệ thống</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ngày tạo</p>
                    <p className="font-medium">{formatDate(itemDetail.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ngày cập nhật</p>
                    <p className="font-medium">{formatDate(itemDetail.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Danh sách lô hàng */}
            <TabsContent value="batches" className="mt-6">
              {loadingBatches ? (
                <div className="text-center py-8">Đang tải danh sách lô hàng...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon icon={faBoxes} className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lô hàng nào</p>
                  <p className="text-sm mt-1">Vật tư này chưa được nhập kho</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800">
                      💡 Danh sách lô hàng được sắp xếp theo nguyên tắc FEFO (First Expired, First Out)
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-3 border">Số lô</th>
                          <th className="text-right p-3 border">Tồn kho</th>
                          <th className="text-left p-3 border">Hạn sử dụng</th>
                          <th className="text-left p-3 border">Ngày nhập</th>
                          <th className="text-left p-3 border">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((batch: ItemBatchV1, index: number) => (
                          <tr 
                            key={batch.batchId} 
                            className={`border ${index === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="p-3 border">
                              <span className="font-mono text-sm font-medium">{batch.lotNumber}</span>
                              {index === 0 && (
                                <Badge className="ml-2 bg-green-600 text-white text-xs">Xuất ưu tiên</Badge>
                              )}
                            </td>
                            <td className="p-3 border text-right">
                              <span className="font-semibold">
                                {batch.quantityOnHand} {itemDetail.unitOfMeasure}
                              </span>
                            </td>
                            <td className="p-3 border">
                              {batch.expiryDate ? (
                                <div className="space-y-1">
                                  <p className="font-medium">{formatDate(batch.expiryDate)}</p>
                                  {getExpiryBadge(batch.expiryDate)}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-3 border">
                              <span className="text-sm">{formatDate(batch.importDate)}</span>
                            </td>
                            <td className="p-3 border">
                              {getWarehouseTypeBadge(batch.warehouseType)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Tổng số lô</p>
                        <p className="text-2xl font-bold text-blue-600">{batches.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tổng tồn kho</p>
                        <p className="text-2xl font-bold text-green-600">
                          {batches.reduce((sum: number, b: ItemBatchV1) => sum + b.quantityOnHand, 0)} {itemDetail.unitOfMeasure}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Lịch sử xuất nhập */}
            <TabsContent value="history" className="mt-6">
              {loadingHistory ? (
                <div className="text-center py-8">Đang tải lịch sử...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon icon={faHistory} className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lịch sử xuất nhập</p>
                  <p className="text-sm mt-1">Vật tư này chưa được sử dụng trong giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800">
                      📜 Lịch sử các giao dịch xuất/nhập kho của vật tư này
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-3 border">Ngày</th>
                          <th className="text-left p-3 border">Loại</th>
                          <th className="text-left p-3 border">Mã phiếu</th>
                          <th className="text-right p-3 border">Số lượng</th>
                          <th className="text-left p-3 border">Số lô</th>
                          <th className="text-left p-3 border">Người tạo</th>
                          <th className="text-left p-3 border">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx: StorageTransaction) => {
                          // Find items in this transaction that match our itemId
                          const relevantItems = tx.items?.filter((item: StorageTransactionItem) => item.itemMasterId === itemId) || [];
                          
                          return relevantItems.map((item, idx) => (
                            <tr 
                              key={`${tx.transactionId}-${idx}`}
                              className="hover:bg-gray-50 border"
                            >
                              <td className="p-3 border">
                                <span className="text-sm">{formatDate(tx.transactionDate)}</span>
                              </td>
                              <td className="p-3 border">
                                {tx.transactionType === 'IMPORT' ? (
                                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                    <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                                    Nhập kho
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
                                    <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                                    Xuất kho
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 border">
                                <span className="font-mono text-sm">{tx.transactionCode || '-'}</span>
                              </td>
                              <td className="p-3 border text-right">
                                <span className={`font-semibold ${tx.transactionType === 'IMPORT' ? 'text-green-600' : 'text-orange-600'}`}>
                                  {tx.transactionType === 'IMPORT' ? '+' : '-'}{item.quantityChange} {itemDetail?.unitOfMeasure}
                                </span>
                              </td>
                              <td className="p-3 border">
                                <span className="font-mono text-sm">{item.lotNumber || '-'}</span>
                              </td>
                              <td className="p-3 border">
                                <span className="text-sm">{tx.createdByName || '-'}</span>
                              </td>
                              <td className="p-3 border">
                                <span className="text-sm text-gray-600">{tx.notes || '-'}</span>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Tổng giao dịch</p>
                        <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lần nhập gần nhất</p>
                        <p className="text-sm font-medium">
                          {transactions.find((tx: StorageTransaction) => tx.transactionType === 'IMPORT')
                            ? formatDate(transactions.find((tx: StorageTransaction) => tx.transactionType === 'IMPORT')?.transactionDate)
                            : 'Chưa có'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lần xuất gần nhất</p>
                        <p className="text-sm font-medium">
                          {transactions.find((tx: StorageTransaction) => tx.transactionType === 'EXPORT')
                            ? formatDate(transactions.find((tx: StorageTransaction) => tx.transactionType === 'EXPORT')?.transactionDate)
                            : 'Chưa có'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-4 border-t mt-6">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
