'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageService } from '@/services/storageService';
import { inventoryService } from '@/services/inventoryService';
import type { StorageTransactionItemV3 } from '@/types/warehouse';
import { usePermission, useRole } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import Link from 'next/link';
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
  faCheckCircle,
  faTimesCircle,
  faBan,
  faCreditCard,
  faHospital,
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
  const [itemFallbacks, setItemFallbacks] = useState<Record<string, { itemCode?: string; expiryDate?: string }>>({});
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasViewCost = usePermission('VIEW_COST');
  // BE checks: hasRole('ADMIN') or hasAuthority('APPROVE_TRANSACTION')
  const isAdmin = useRole('ROLE_ADMIN');
  const hasApprovePermission = isAdmin || usePermission('APPROVE_TRANSACTION');
  const hasUpdatePermission = usePermission('UPDATE_WAREHOUSE') || usePermission('CANCEL_WAREHOUSE');

  // Debug: Log permission info
  useEffect(() => {
    if (transaction && isOpen) {
      console.log('🔍 [StorageDetailModal] Permission Debug:', {
        transactionId: transaction.transactionId,
        transactionCode: transaction.transactionCode,
        transactionStatus: transaction.status,
        isAdmin,
        hasApprovePermission,
        hasUpdatePermission,
        hasViewCost,
        userRoles: user?.roles || [],
        userPermissions: user?.permissions || [],
        canShowApproveButton: transaction.status === 'PENDING_APPROVAL' && hasApprovePermission,
        canShowCancelButton: (transaction.status === 'DRAFT' || transaction.status === 'PENDING_APPROVAL') && hasUpdatePermission,
      });
    }
  }, [transaction, isOpen, isAdmin, hasApprovePermission, hasUpdatePermission, hasViewCost, user]);

  const { data: transaction, isLoading, isError, error } = useQuery({
    queryKey: ['storageTransaction', transactionId],
    queryFn: () => storageService.getById(transactionId!),
    enabled: isOpen && !!transactionId,
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (notes?: string) => storageService.approve(transactionId!, notes),
    onSuccess: () => {
      toast.success('Đã duyệt phiếu thành công');
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt phiếu');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => storageService.reject(transactionId!, reason),
    onSuccess: () => {
      toast.success('Đã từ chối phiếu thành công');
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowRejectDialog(false);
      setRejectionReason('');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối phiếu');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => storageService.cancel(transactionId!, reason),
    onSuccess: () => {
      toast.success('Đã hủy phiếu thành công');
      queryClient.invalidateQueries({ queryKey: ['storageTransaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowCancelDialog(false);
      setCancellationReason('');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy phiếu');
    },
  });

  const getItemFallbackKey = (item: StorageTransactionItemV3) => {
    if (item.transactionItemId) return String(item.transactionItemId);
    const masterId = item.itemMasterId ?? 'unknown';
    const lot = item.lotNumber ?? 'no-lot';
    return `${masterId}-${lot}`;
  };

  useEffect(() => {
    if (!transaction?.items?.length) {
      setItemFallbacks({});
      return;
    }

    const itemsNeedingFallback = transaction.items.filter(
      (item) =>
        item.itemMasterId &&
        (!item.itemCode || (transaction.transactionType === 'IMPORT' && !item.expiryDate))
    );

    if (itemsNeedingFallback.length === 0) {
      setItemFallbacks({});
      return;
    }

    let cancelled = false;

    const fetchFallbackData = async () => {
      setFallbackLoading(true);
      try {
        const grouped = itemsNeedingFallback.reduce<Record<number, StorageTransactionItemV3[]>>(
          (acc, item) => {
            const id = item.itemMasterId!;
            if (!acc[id]) acc[id] = [];
            acc[id].push(item);
            return acc;
          },
          {}
        );

        for (const [itemMasterIdStr, items] of Object.entries(grouped)) {
          const itemMasterId = Number(itemMasterIdStr);
          try {
            const [itemDetail, batches] = await Promise.all([
              inventoryService.getById(itemMasterId),
              inventoryService.getBatchesByItemId(itemMasterId),
            ]);

            if (cancelled) return;

            setItemFallbacks((prev) => {
              const updated = { ...prev };
              items.forEach((item) => {
                const key = getItemFallbackKey(item);
                if (!updated[key]) {
                  const matchedBatch = item.lotNumber
                    ? batches.find((batch) => batch.lotNumber === item.lotNumber)
                    : undefined;

                  updated[key] = {
                    itemCode: itemDetail?.itemCode,
                    expiryDate: matchedBatch?.expiryDate,
                  };
                }
              });
              return updated;
            });
          } catch (error) {
            console.error('❌ Fallback fetch failed for itemMasterId:', itemMasterId, error);
          }
        }
      } finally {
        if (!cancelled) {
          setFallbackLoading(false);
        }
      }
    };

    fetchFallbackData();

    return () => {
      cancelled = true;
    };
  }, [transaction]);

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

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      PENDING_APPROVAL: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800 border-green-200' },
      REJECTED: { label: 'Đã từ chối', className: 'bg-red-100 text-red-800 border-red-200' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    rejectMutation.mutate(rejectionReason);
  };

  const handleCancel = () => {
    cancelMutation.mutate(cancellationReason || undefined);
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
              <div className="text-center py-8 space-y-2">
              <div className="text-red-500 font-semibold">Không thể tải thông tin phiếu</div>
              {isError && error && (
                <div className="text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : (error as any)?.response?.data?.message || 
                      (error as any)?.response?.data?.error || 
                      'Lỗi không xác định'}
                </div>
              )}
              {(error as any)?.response?.status === 500 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Lỗi máy chủ (500). Vui lòng thử lại sau hoặc liên hệ quản trị viên.
                </div>
              )}
            </div>
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

                    {transaction.status && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Trạng thái</p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    )}

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

                    {transaction.approvedByName && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Người duyệt</p>
                          <p className="font-medium">{transaction.approvedByName}</p>
                          {transaction.approvedAt && (
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(transaction.approvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {transaction.rejectionReason && (
                      <div className="flex items-start gap-3 col-span-2">
                        <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 text-red-600 mt-1" />
                        <div>
                          <p className="text-xs text-red-600 font-semibold">Lý do từ chối</p>
                          <p className="text-sm">{transaction.rejectionReason}</p>
                          {transaction.rejectedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(transaction.rejectedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {transaction.cancellationReason && (
                      <div className="flex items-start gap-3 col-span-2">
                        <FontAwesomeIcon icon={faBan} className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Lý do hủy</p>
                          <p className="text-sm">{transaction.cancellationReason}</p>
                          {transaction.cancelledAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(transaction.cancelledAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info (for IMPORT) */}
                {transaction.transactionType === 'IMPORT' && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                      Thông tin thanh toán
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Trạng thái thanh toán</p>
                        {(() => {
                          // Default to UNPAID for DRAFT/IMPORT transactions if paymentStatus is null
                          const paymentStatus = transaction.paymentStatus || (transaction.status === 'DRAFT' ? 'UNPAID' : null);
                          if (paymentStatus) {
                            return (
                              <Badge className={
                                paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {paymentStatus === 'PAID' ? 'Đã thanh toán' :
                                 paymentStatus === 'PARTIAL' ? 'Thanh toán một phần' :
                                 'Chưa thanh toán'}
                              </Badge>
                            );
                          }
                          return <p className="text-sm text-muted-foreground">Chưa có</p>;
                        })()}
                      </div>
                      {hasViewCost ? (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                            {transaction.paidAmount !== undefined && transaction.paidAmount !== null ? (
                              <p className="font-semibold text-green-600">{formatCurrency(transaction.paidAmount)}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Chưa có</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Còn nợ</p>
                            {transaction.remainingDebt !== undefined && transaction.remainingDebt !== null ? (
                              <p className="font-semibold text-red-600">{formatCurrency(transaction.remainingDebt)}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Chưa có</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground italic">
                            Thông tin tài chính chỉ hiển thị cho người có quyền VIEW_COST
                          </p>
                        </div>
                      )}
                      {transaction.dueDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Hạn thanh toán</p>
                          <p className="font-medium">{formatDate(transaction.dueDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appointment Info (for EXPORT) */}
                {transaction.transactionType === 'EXPORT' && transaction.relatedAppointmentId && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faHospital} className="w-4 h-4" />
                      Thông tin ca điều trị
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ca điều trị:</span>
                      <Link
                        href={`/admin/appointments/${transaction.relatedAppointmentId}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {transaction.relatedAppointmentCode || `#${transaction.relatedAppointmentId}`}
                      </Link>
                    </div>
                    {transaction.patientName && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Bệnh nhân:</span>
                        <span className="font-medium">{transaction.patientName}</span>
                      </div>
                    )}
                  </div>
                )}

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
                    {(() => {
                      const updatedAt = (transaction as any).updatedAt ?? transaction.updated_at;
                      return updatedAt ? (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                        <span>Cập nhật: {formatDateTime(updatedAt)}</span>
                      </div>
                      ) : null;
                    })()}
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
                        <th className="p-3 text-left">Mã vật tư / Hạn sử dụng</th>
                        <th className="p-3 text-left">Tên vật tư</th>
                        <th className="p-3 text-left">Số lô</th>
                        <th className="p-3 text-right">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item, index) => {
                        const fallback = itemFallbacks[getItemFallbackKey(item)];
                        const displayItemCode = item.itemCode || fallback?.itemCode;
                        const displayExpiry = item.expiryDate || fallback?.expiryDate;

                        return (
                          <tr key={item.transactionItemId || index} className="border-t hover:bg-slate-50">
                            <td className="p-3 text-center text-slate-600">{index + 1}</td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                {displayItemCode ? (
                                  <Badge variant="outline" className="font-mono text-xs w-fit">
                                    {displayItemCode}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Chưa có mã</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {displayExpiry
                                    ? `HSD: ${formatDate(displayExpiry)}`
                                    : 'HSD: Chưa có'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-medium">
                              {item.itemName || <span className="text-muted-foreground italic">Chưa có dữ liệu</span>}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{item.lotNumber || '-'}</span>
                                {item.itemMasterId && (
                                  <span className="text-[11px] text-muted-foreground">
                                    ID vật tư: {item.itemMasterId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {Math.abs(item.quantityChange).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {fallbackLoading && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      Đang đồng bộ thông tin vật tư...
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-6">
          {/* Approval Workflow Buttons */}
          <div className="flex gap-2">
            {transaction?.status === 'PENDING_APPROVAL' && hasApprovePermission && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 mr-2" />
                  {approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                >
                  <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
              </>
            )}
            {(transaction?.status === 'DRAFT' || transaction?.status === 'PENDING_APPROVAL') && hasUpdatePermission && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelMutation.isPending}
              >
                <FontAwesomeIcon icon={faBan} className="w-4 h-4 mr-2" />
                {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy phiếu'}
              </Button>
            )}
          </div>
          <Button onClick={onClose}>Đóng</Button>
        </div>

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Từ chối phiếu</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng nhập lý do từ chối phiếu này. Lý do này sẽ được lưu lại và hiển thị cho người tạo phiếu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejectionReason">Lý do từ chối *</Label>
                <Input
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className="mt-2"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRejectionReason('')}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hủy phiếu</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn hủy phiếu này? Bạn có thể nhập lý do hủy (tùy chọn).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="cancellationReason">Lý do hủy (tùy chọn)</Label>
                <Input
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Nhập lý do hủy..."
                  className="mt-2"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancellationReason('')}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="bg-gray-600 hover:bg-gray-700"
              >
                {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
