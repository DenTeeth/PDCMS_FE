'use client';

import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Supplier, SupplierItem } from '@/types/warehouse';
import { supplierServiceV3 } from '@/services/warehouseService';
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
} from '@fortawesome/free-solid-svg-icons';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export default function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
}: SupplierDetailModalProps) {
  // Fetch Supplied Items
  const { data: suppliedItems = [], isLoading: loadingItems } = useQuery<SupplierItem[]>({
    queryKey: ['suppliedItems', supplier?.supplierId],
    queryFn: () => supplierServiceV3.getSuppliedItems(supplier!.supplierId),
    enabled: !!supplier?.supplierId && isOpen,
  });

  if (!supplier) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      ACTIVE: { label: 'Hoạt động', variant: 'default' },
      INACTIVE: { label: 'Ngưng hoạt động', variant: 'secondary' },
      SUSPENDED: { label: 'Tạm ngưng', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <FontAwesomeIcon 
          icon={status === 'ACTIVE' ? faCheckCircle : faTimesCircle} 
          className="w-3 h-3" 
        />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary" />
            Chi tiết nhà cung cấp
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <FontAwesomeIcon icon={faBoxes} className="w-4 h-4" />
              Vật tư cung cấp ({suppliedItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Info */}
          <TabsContent value="info" className="space-y-6 mt-6">
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
                    <p className="font-semibold">{supplier.supplierName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mã NCC</p>
                    <p className="font-semibold">#{supplier.supplierId}</p>
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
                    <p className="font-medium">{supplier.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{supplier.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{supplier.address}</p>
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
            {supplier.notes && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faStickyNote} className="w-4 h-4" />
                  Ghi chú
                </h3>
                <p className="text-sm text-muted-foreground">{supplier.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                  <span>Ngày tạo: {formatDate(supplier.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                  <span>Cập nhật lần cuối: {formatDate(supplier.updatedAt)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Supplied Items */}
          <TabsContent value="items" className="mt-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2 mb-4">
                Danh sách vật tư đã cung cấp
              </h3>

              {loadingItems ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải danh sách vật tư...
                </div>
              ) : suppliedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FontAwesomeIcon icon={faBoxes} className="w-12 h-12 mb-3 opacity-30" />
                  <p>Chưa có vật tư nào được cung cấp bởi nhà cung cấp này</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr className="text-xs font-semibold text-slate-700">
                        <th className="p-3 text-left">STT</th>
                        <th className="p-3 text-left">Mã Vật Tư</th>
                        <th className="p-3 text-left">Tên Vật Tư</th>
                        <th className="p-3 text-right">Giá Nhập (Lần Cuối)</th>
                        <th className="p-3 text-center">Ngày Nhập (Lần Cuối)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliedItems.map((item, index) => (
                        <tr key={index} className="border-t hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-600">{index + 1}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.item_code}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{item.item_name}</td>
                          <td className="p-3 text-right">
                            {item.last_import_price ? (
                              <span className="flex items-center justify-end gap-1 text-emerald-700 font-semibold">
                                <FontAwesomeIcon icon={faMoneyBill} className="w-3 h-3" />
                                {item.last_import_price.toLocaleString('vi-VN')} đ
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa có</span>
                            )}
                          </td>
                          <td className="p-3 text-center text-sm text-slate-600">
                            {item.last_import_date ? (
                              new Date(item.last_import_date).toLocaleDateString('vi-VN')
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
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
