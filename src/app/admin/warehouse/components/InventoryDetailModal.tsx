'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inventory, WarehouseType, InventoryStatus } from '@/types/warehouse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faWarehouse, faUser, faPhone, faEnvelope, faMapMarkerAlt, faCalendar, faClock, faCheckCircle, faNoteSticky, faSnowflake } from '@fortawesome/free-solid-svg-icons';

interface InventoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Inventory | null;
}

export default function InventoryDetailModal({
  isOpen,
  onClose,
  inventory,
}: InventoryDetailModalProps) {
  if (!inventory) return null;

  const isColdStorage = inventory.warehouseType === WarehouseType.COLD;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: InventoryStatus) => {
    const variants = {
      [InventoryStatus.ACTIVE]: { variant: 'default' as const, label: 'Hoạt động' },
      [InventoryStatus.INACTIVE]: { variant: 'secondary' as const, label: 'Ngưng' },
      [InventoryStatus.OUT_OF_STOCK]: { variant: 'destructive' as const, label: 'Hết hàng' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 90 && daysLeft >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBox} className="text-blue-500" />
            Chi tiết vật tư: {inventory.itemName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết và lịch sử giao dịch của vật tư
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mã vật tư</p>
              <p className="font-semibold">#{inventory.inventoryId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tên vật tư</p>
              <p className="font-semibold">{inventory.itemName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <FontAwesomeIcon icon={faWarehouse} className="mr-1" />
                Loại kho
              </p>
              <Badge variant={isColdStorage ? 'default' : 'secondary'}>
                {isColdStorage ? (
                  <>
                    <FontAwesomeIcon icon={faSnowflake} className="mr-1" />
                    Kho lạnh
                  </>
                ) : 'Kho thường'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Nhóm</p>
              <p className="font-medium">{inventory.category || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Đơn vị tính</p>
              <p className="font-medium">{inventory.unitOfMeasure}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
              {getStatusBadge(inventory.status)}
            </div>
          </div>

          {/* Supplier Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-blue-500" />
              Thông tin nhà cung cấp
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-1">Tên nhà cung cấp</p>
                <p className="font-medium">{inventory.supplierName || `#${inventory.supplierId}`}</p>
              </div>
              {inventory.supplierPhone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faPhone} className="mr-1" />
                    Số điện thoại
                  </p>
                  <p className="font-medium">{inventory.supplierPhone}</p>
                </div>
              )}
              {inventory.supplierEmail && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                    Email
                  </p>
                  <p className="font-medium">{inventory.supplierEmail}</p>
                </div>
              )}
              {inventory.supplierAddress && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                    Địa chỉ
                  </p>
                  <p className="font-medium">{inventory.supplierAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Info */}
          <div>
            <h3 className="font-semibold mb-3">Thông tin tồn kho</h3>
            <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tồn kho hiện tại</p>
                <p className="text-2xl font-bold text-blue-600">{inventory.stockQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tồn tối thiểu</p>
                <p className="text-lg font-semibold">{inventory.minStockLevel || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tồn tối đa</p>
                <p className="text-lg font-semibold">{inventory.maxStockLevel || '-'}</p>
              </div>
            </div>
          </div>

          {/* Expiry & Certification */}
          {(inventory.expiryDate || inventory.isCertified) && (
            <div>
              <h3 className="font-semibold mb-3">Hạn sử dụng & Chứng nhận</h3>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                {inventory.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faClock} className="mr-1" />
                      Hạn sử dụng
                    </p>
                    <div>
                      <p className="font-medium">{formatDate(inventory.expiryDate)}</p>
                      {isExpired(inventory.expiryDate) ? (
                        <Badge variant="destructive" className="mt-1">Đã hết hạn</Badge>
                      ) : isExpiringSoon(inventory.expiryDate) ? (
                        <Badge variant="destructive" className="mt-1">Sắp hết hạn</Badge>
                      ) : (
                        <Badge variant="default" className="mt-1">Còn hạn</Badge>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                    Chứng nhận
                  </p>
                  {inventory.isCertified ? (
                    <div>
                      <Badge variant="default">Đã chứng nhận</Badge>
                      {inventory.certificationDate && (
                        <p className="text-sm text-gray-600 mt-1">
                          Ngày: {formatDate(inventory.certificationDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary">Chưa chứng nhận</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {inventory.notes && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faNoteSticky} />
                Ghi chú
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{inventory.notes}</p>
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <div className="grid grid-cols-2 gap-2">
              <p>
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                Ngày tạo: {formatDate(inventory.createdAt)}
              </p>
              <p>
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                Cập nhật: {formatDate(inventory.updatedAt)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
