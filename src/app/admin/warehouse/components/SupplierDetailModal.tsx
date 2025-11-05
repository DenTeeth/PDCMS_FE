'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Supplier } from '@/types/warehouse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faPhone, 
  faEnvelope, 
  faMapMarkerAlt, 
  faInfoCircle,
  faNoteSticky,
  faCalendar,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-primary" />
            Chi tiết nhà cung cấp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                  <span>Mã NCC</span>
                </div>
                <div className="font-medium text-sm pl-5">#{supplier.supplierId}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                  <span>Tên nhà cung cấp</span>
                </div>
                <div className="font-medium text-sm pl-5">{supplier.supplierName || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
              Thông tin liên hệ
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                  <span>Số điện thoại</span>
                </div>
                <div className="font-medium text-sm pl-5">{supplier.phoneNumber || 'N/A'}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                  <span>Email</span>
                </div>
                <div className="font-medium text-sm pl-5">{supplier.email || 'N/A'}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                  <span>Địa chỉ</span>
                </div>
                <div className="font-medium text-sm pl-5">{supplier.address || 'N/A'}</div>
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
                <FontAwesomeIcon icon={faNoteSticky} className="w-3 h-3" />
                Ghi chú
              </h3>
              <div className="text-sm whitespace-pre-wrap pl-1">{supplier.notes}</div>
            </div>
          )}

          {/* Audit Information */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                  <span>Ngày tạo</span>
                </div>
                <div className="pl-5">{formatDate(supplier.createdAt)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                  <span>Ngày cập nhật</span>
                </div>
                <div className="pl-5">{formatDate(supplier.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetailModal;
