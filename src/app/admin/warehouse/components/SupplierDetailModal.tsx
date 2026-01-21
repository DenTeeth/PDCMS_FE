'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  SupplierSummaryResponse,
  SupplierDetailResponse,
  SuppliedItemResponse,
} from '@/types/supplier';
import { useSupplier, useSuppliedItems } from '@/hooks/useSuppliers';
import {
  formatDateTime,
  formatDate,
  formatPhone,
  getStatusColor,
  getStatusLabel,
} from '@/utils/formatters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faStickyNote,
  faCheckCircle,
  faTimesCircle,
  faBuilding,
  faInfoCircle,
  faCalendarAlt,
  faBoxes,
  faMoneyBill,
  faBarcode,
  faBox,
  faSearch,
  faShoppingCart,
  faBan,
  faExclamationTriangle,
  faStar,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierSummaryResponse | null;
}

export default function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
}: SupplierDetailModalProps) {
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch full supplier detail using API V1
  const { data: supplierDetail, isLoading: loadingDetail, error: detailError } = useSupplier(
    supplier?.supplierId || null
  );

  if (!supplier) return null;

  // Show error if fetch failed
  if (detailError && !loadingDetail) {
    console.error('Error loading supplier detail:', detailError);
  }

  // Filter supplied items from detail response by search keyword
  const filteredItems = supplierDetail?.suppliedItems?.filter((item) => {
    const keyword = searchKeyword.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(keyword) ||
      item.itemCode?.toLowerCase().includes(keyword)
    );
  }) || [];

  // Helper: Check if supplier is inactive (> 6 months)
  const isSupplierInactive = (): boolean => {
    const lastOrderDate = (supplierDetail as any)?.lastOrderDate;
    if (!lastOrderDate) return true; // Never ordered = inactive
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const lastOrder = new Date(lastOrderDate);
    return lastOrder < sixMonthsAgo;
  };

  // Get business metrics from supplier detail
  const businessMetrics = {
    totalOrders: (supplierDetail as any)?.totalOrders || 0,
    lastOrderDate: (supplierDetail as any)?.lastOrderDate,
    tierLevel: (supplierDetail as any)?.tierLevel,
    ratingScore: (supplierDetail as any)?.ratingScore,
    isBlacklisted: (supplierDetail as any)?.isBlacklisted || false,
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    return (
      <Badge className={getStatusColor(status) + ' flex items-center gap-1 w-fit'}>
        <FontAwesomeIcon
          icon={status === 'ACTIVE' ? faCheckCircle : faTimesCircle}
          className="w-3 h-3"
        />
        {getStatusLabel(status)}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary" />
            Chi tiết nhà cung cấp
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết và danh sách vật tư của nhà cung cấp
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <FontAwesomeIcon icon={faBoxes} className="w-4 h-4" />
              Vật tư cung cấp ({supplierDetail?.suppliedItems?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Info */}
          <TabsContent value="info" className="space-y-6 mt-6">
            {loadingDetail ? (
              <div className="text-center py-8">Đang tải thông tin...</div>
            ) : detailError ? (
              <div className="text-center py-8 text-red-500">
                <p className="font-semibold">Không thể tải thông tin nhà cung cấp</p>
                <p className="text-sm text-gray-500 mt-2">
                  {(detailError as any)?.response?.data?.message || 'Vui lòng thử lại sau'}
                </p>
              </div>
            ) : !supplierDetail ? (
              <div className="text-center py-8 text-red-500">Không tìm thấy thông tin nhà cung cấp</div>
            ) : (
              <>
                {/* Blacklist Warning Banner */}
                {businessMetrics.isBlacklisted && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBan} className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-red-800 mb-1">⛔ NHÀ CUNG CẤP TRONG DANH SÁCH ĐEN</h3>
                        <p className="text-sm text-red-700">
                          Nhà cung cấp này đã được đánh dấu là có vấn đề (chất lượng, fraud, giao hàng trễ, hóa đơn giả).
                          <strong className="block mt-1">KHÔNG NÊN ĐẶT HÀNG TỪ NHÀ CUNG CẤP NÀY!</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Basic Information */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Thông tin cơ bản
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tên nhà cung cấp</p>
                        <p className="font-semibold">{supplierDetail.supplierName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faBarcode} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Mã NCC</p>
                        <p className="font-semibold font-mono">{supplierDetail.supplierCode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Metrics */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Business Metrics
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faShoppingCart} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng số đơn hàng</p>
                        <p className="font-semibold text-lg">{businessMetrics.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">Số lần đã nhập hàng từ NCC này</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Đơn hàng gần nhất</p>
                        <p className="font-semibold">
                          {businessMetrics.lastOrderDate ? formatDate(businessMetrics.lastOrderDate) : 'Chưa có'}
                        </p>
                        <p className="text-xs text-muted-foreground">Ngày nhập hàng gần nhất</p>
                      </div>
                    </div>

                    {businessMetrics.tierLevel && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tier Level</p>
                          <p className="font-semibold">{businessMetrics.tierLevel}</p>
                          <p className="text-xs text-muted-foreground">Phân loại ưu tiên</p>
                        </div>
                      </div>
                    )}

                    {businessMetrics.ratingScore !== undefined && businessMetrics.ratingScore !== null && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Rating Score</p>
                          <p className="font-semibold">{businessMetrics.ratingScore.toFixed(1)} / 5.0</p>
                          <p className="text-xs text-muted-foreground">Điểm đánh giá chất lượng</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Thông tin liên hệ
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {(supplierDetail as any)?.contactPerson && (
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Người liên hệ</p>
                          <p className="font-medium">{(supplierDetail as any).contactPerson}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Số điện thoại</p>
                        <p className="font-medium">{formatPhone(supplierDetail.phoneNumber)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{supplierDetail.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Địa chỉ</p>
                        <p className="font-medium">{supplierDetail.address || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Trạng thái
                  </h3>
                  <div className="pl-1">
                    {getStatusBadge(supplier.status)}
                  </div>
                </div>

                {/* Notes */}
                {supplierDetail.notes && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faStickyNote} className="w-4 h-4" />
                      Ghi chú
                    </h3>
                    <p className="text-sm text-muted-foreground">{supplierDetail.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                      <span>Ngày tạo: {formatDateTime(supplierDetail.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 2: Supplied Items History */}
          <TabsContent value="items" className="mt-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">
                Vật tư đã cung cấp
              </h3>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo mã vật tư hoặc tên vật tư..."
                    className="pl-10"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
              </div>

              {loadingDetail ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải danh sách vật tư...
                </div>
              ) : !supplierDetail?.suppliedItems || supplierDetail.suppliedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FontAwesomeIcon icon={faBoxes} className="w-12 h-12 mb-3 opacity-30" />
                  <p>Chưa có vật tư nào được cung cấp</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FontAwesomeIcon icon={faBoxes} className="w-12 h-12 mb-3 opacity-30" />
                  <p>Không tìm thấy vật tư phù hợp</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr className="text-xs font-semibold text-slate-700">
                        <th className="p-3 text-left">STT</th>
                        <th className="p-3 text-left">Mã vật tư</th>
                        <th className="p-3 text-left">Tên vật tư</th>
                        <th className="p-3 text-right">Tổng số lượng</th>
                        <th className="p-3 text-center">Lần cuối cung cấp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, index) => (
                        <tr key={item.itemMasterId || index} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-600">{index + 1}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.itemCode || '-'}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{item.itemName || '-'}</td>
                          <td className="p-3 text-right font-semibold">
                            {(item.totalQuantity || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center text-sm text-slate-600">
                            {item.lastImportDate ? formatDate(item.lastImportDate) : '-'}
                          </td>
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
