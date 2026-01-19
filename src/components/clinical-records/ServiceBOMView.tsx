'use client';


import React, { useState, useEffect } from 'react';
import { serviceConsumableService } from '@/services/serviceConsumableService';
import { ServiceConsumablesResponse, ConsumableItemResponse } from '@/types/serviceConsumable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Package,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ServiceBOMViewProps {
  serviceId: number | null;
  serviceName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ServiceBOMView({
  serviceId,
  serviceName,
  open,
  onOpenChange,
}: ServiceBOMViewProps) {
  const [loading, setLoading] = useState(false);
  const [bom, setBom] = useState<ServiceConsumablesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && serviceId) {
      loadBOM();
    } else {
      setBom(null);
      setError(null);
    }
  }, [open, serviceId]);

  const loadBOM = async () => {
    if (!serviceId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await serviceConsumableService.getServiceConsumables(serviceId);
      setBom(data);
    } catch (error: any) {
      console.error('Error loading service BOM:', error);
      setError(error.message || 'Không thể tải danh sách vật tư cần thiết');
      setBom(null);
      
      // Don't show toast if it's 404 (no BOM defined)
      if (error.status !== 404) {
        toast.error('Không thể tải danh sách vật tư cần thiết');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hết hàng
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Thấp
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Đủ
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Vật Tư Cần Thiết
          </DialogTitle>
          <DialogDescription>
            {serviceName ? `Danh sách vật tư cần thiết cho dịch vụ: ${serviceName}` : 'Danh sách vật tư cần thiết cho dịch vụ này'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Đang tải vật tư...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            {error.includes('404') || error.includes('not found') ? (
              <p className="text-xs text-muted-foreground">
                Thủ thuật này không tiêu hao vật tư
              </p>
            ) : (
              <Button variant="outline" size="sm" onClick={loadBOM} className="mt-4">
                Thử lại
              </Button>
            )}
          </div>
        ) : bom && bom.consumables && bom.consumables.length > 0 ? (
          <div className="space-y-4">
            {/* Stock Status Badge */}
            <div className="flex items-center justify-end">
              {bom.hasInsufficientStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Có vật tư thiếu
                </Badge>
              )}
              {!bom.hasInsufficientStock && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Đủ vật tư
                </Badge>
              )}
            </div>

            {/* Materials List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Danh sách vật tư</h4>
              {bom.consumables.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">{item.itemName}</h5>
                          {item.itemCode && (
                            <span className="text-xs text-muted-foreground font-mono">
                              ({item.itemCode})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Số lượng: <strong className="text-foreground">{item.quantity}</strong> {item.unitName}
                          </span>
                          {getStockStatusBadge(item.stockStatus)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Lưu ý:</p>
                  <p className="text-blue-800">
                    Khi hoàn thành appointment, hệ thống sẽ tự động trừ các vật tư này khỏi kho theo số lượng trên.
                    Vật tư sẽ được trừ theo thuật toán FEFO (First Expired First Out).
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">
              Thủ thuật này không tiêu hao vật tư
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Dịch vụ này không yêu cầu sử dụng vật tư từ kho
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}




