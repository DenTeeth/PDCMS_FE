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
  const { data: supplierDetail, isLoading: loadingDetail } = useSupplier(
    supplier?.supplierId || null
  );

  if (!supplier) return null;

  // Filter supplied items from detail response by search keyword
  const filteredItems = supplierDetail?.suppliedItems?.filter((item) => {
    const keyword = searchKeyword.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(keyword) ||
      item.itemCode?.toLowerCase().includes(keyword)
    );
  }) || [];

  // Debug: Log each item detail
  if (supplierDetail?.suppliedItems?.length) {
    console.log('First supplied item:', supplierDetail.suppliedItems[0]);
  }

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
            ) : !supplierDetail ? (
              <div className="text-center py-8 text-red-500">Không thể tải thông tin nhà cung cấp</div>
            ) : (
              <>
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

                {/* Contact Information */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Thông tin liên hệ
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
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
                            {(item.totalQuantitySupplied || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center text-sm text-slate-600">
                            {item.lastSuppliedDate ? formatDate(item.lastSuppliedDate) : '-'}
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
