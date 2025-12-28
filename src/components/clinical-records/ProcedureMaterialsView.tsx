'use client';

/**
 * Procedure Materials View Component
 * 
 * Displays materials used in a procedure with planned vs actual quantities,
 * variance tracking, stock status, and cost data (if user has permission)
 * 
 * Features:
 * - Shows planned, actual, and variance quantities
 * - Highlights variances (positive = over-consumption, negative = under-consumption)
 * - Displays stock status indicators (OK/LOW/OUT_OF_STOCK)
 * - Conditional rendering: Hides cost data if user doesn't have VIEW_WAREHOUSE_COST
 * - Button to edit quantities (only if user has WRITE_CLINICAL_RECORD)
 */

import React, { useState, useEffect } from 'react';
import { ProcedureMaterialsResponse, ProcedureMaterialItem } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Package,
  Edit,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import EditProcedureMaterialsDialog from './EditProcedureMaterialsDialog';
import EditMaterialQuantityDialog from './EditMaterialQuantityDialog';

interface ProcedureMaterialsViewProps {
  procedureId: number;
  procedureName?: string;
  toothNumber?: string;
  appointmentStatus?: string; // Only show materials if COMPLETED
  onMaterialsUpdated?: () => void;
}

export default function ProcedureMaterialsView({
  procedureId,
  procedureName,
  toothNumber,
  appointmentStatus,
  onMaterialsUpdated,
}: ProcedureMaterialsViewProps) {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<ProcedureMaterialsResponse | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingQuantityFor, setEditingQuantityFor] = useState<ProcedureMaterialItem | null>(null);

  // Permission checks
  const canViewCost = hasPermission('VIEW_WAREHOUSE_COST');
  const canEdit = hasPermission('WRITE_CLINICAL_RECORD');
  const isCompleted = appointmentStatus === 'COMPLETED';
  // NEW: Allow viewing materials even before completion (to edit quantity)
  const canViewMaterials = appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED';

  // Load materials
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await clinicalRecordService.getProcedureMaterials(procedureId);
      setMaterials(data);
    } catch (error: any) {
      console.error('Error loading procedure materials:', error);
      toast.error('Không thể tải danh sách vật tư');
      setMaterials(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // NEW: Load materials if IN_PROGRESS or COMPLETED
    if (procedureId && canViewMaterials) {
      loadMaterials();
    }
  }, [procedureId, canViewMaterials]);

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    loadMaterials();
    onMaterialsUpdated?.();
    toast.success('Đã cập nhật số lượng vật tư thành công');
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) {
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    } else if (variance < 0) {
      return <TrendingDown className="h-4 w-4 text-blue-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getVarianceBadge = (variance: number | null | undefined) => {
    const varianceValue = variance ?? 0;
    if (varianceValue > 0) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          +{varianceValue.toFixed(2)} (Dùng thêm)
        </Badge>
      );
    } else if (varianceValue < 0) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {varianceValue.toFixed(2)} (Dùng ít hơn)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        {varianceValue.toFixed(2)} ✓
      </Badge>
    );
  };

  const getStockStatusBadge = (status: string, currentStock: number) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hết hàng ({currentStock})
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Thấp ({currentStock})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Đủ ({currentStock})
          </Badge>
        );
    }
  };

  // Don't show if appointment is not in progress or completed
  if (!canViewMaterials) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Đang tải vật tư...</span>
        </CardContent>
      </Card>
    );
  }

  // Empty state: No consumables
  if (materials && materials.hasConsumables === false) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Thủ thuật này không tiêu hao vật tư</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state: No materials loaded
  if (!materials || !materials.materials || materials.materials.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có vật tư nào được ghi nhận cho thủ thuật này</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>
                Vật tư sử dụng
                {procedureName && ` - ${procedureName}`}
                {toothNumber && ` (Răng ${toothNumber})`}
              </CardTitle>
            </div>
            {canEdit && materials.materialsDeducted && (
              <Button
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa số lượng thực tế
              </Button>
            )}
          </div>
          {materials.materialsDeducted && (
            <div className="text-sm text-muted-foreground mt-2">
              Đã trừ kho: {materials.deductedAt && format(new Date(materials.deductedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              {materials.deductedBy && ` bởi ${materials.deductedBy}`}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Materials List */}
          {materials.materials.map((material) => (
            <div key={material.usageId} className="border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-base">{material.itemName}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {material.itemCode && (
                      <Badge variant="secondary" className="text-xs">
                        {material.itemCode}
                      </Badge>
                    )}
                    {material.categoryName && (
                      <Badge variant="outline" className="text-xs">
                        {material.categoryName}
                      </Badge>
                    )}
                    {getStockStatusBadge(material.stockStatus, material.currentStock)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quantities */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Định mức BOM</div>
                  <div className="font-medium">
                    {material.plannedQuantity} {material.unitName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>
                      Dự kiến dùng
                      {!materials.materialsDeducted && canEdit && (
                        <span className="text-xs text-blue-600 ml-1">(Có thể chỉnh sửa)</span>
                      )}
                    </span>
                    {!materials.materialsDeducted && canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuantityFor(material)}
                        className="h-6 px-2 text-xs"
                        title="Chỉnh sửa số lượng dự kiến"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="font-medium">
                    {material.quantity} {material.unitName}
                    {!materials.materialsDeducted && material.quantity !== material.plannedQuantity && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Đã điều chỉnh
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Thực tế sử dụng</div>
                  <div className="font-medium">
                    {material.actualQuantity} {material.unitName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Chênh lệch</div>
                  <div className="flex items-center gap-2">
                    {getVarianceIcon(material.varianceQuantity)}
                    {getVarianceBadge(material.varianceQuantity)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    (Thực tế - Dự kiến dùng)
                  </div>
                </div>
              </div>

              {/* Variance Reason */}
              {material.varianceReason && (
                <div className="bg-muted rounded-md p-2 text-sm">
                  <span className="font-medium">Lý do chênh lệch:</span>{' '}
                  {material.varianceReason}
                </div>
              )}

              {/* Cost Data (only if user has permission) */}
              {canViewCost && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Giá đơn vị
                      </div>
                      <div className="font-medium">
                        {formatCurrency(material.unitPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tổng dự kiến</div>
                      <div className="font-medium">
                        {formatCurrency(material.totalPlannedCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tổng thực tế</div>
                      <div className="font-medium">
                        {formatCurrency(material.totalActualCost)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {material.notes && (
                <div className="text-sm text-muted-foreground italic">
                  Ghi chú: {material.notes}
                </div>
              )}
            </div>
          ))}

          {/* Cost Summary (only if user has permission) */}
          {canViewCost && materials.totalPlannedCost !== null && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Tổng chi phí dự kiến</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(materials.totalPlannedCost)}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-sm text-muted-foreground">Tổng chi phí thực tế</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(materials.totalActualCost)}
                  </div>
                </div>
                {materials.costVariance !== null && materials.costVariance !== 0 && (
                  <div className="space-y-1 text-right">
                    <div className="text-sm text-muted-foreground">Chênh lệch</div>
                    <div
                      className={`text-lg font-semibold ${
                        materials.costVariance > 0 ? 'text-orange-600' : 'text-blue-600'
                      }`}
                    >
                      {materials.costVariance > 0 ? '+' : ''}
                      {formatCurrency(materials.costVariance)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Actual Quantities Dialog (after deduction) */}
      {showEditDialog && (
        <EditProcedureMaterialsDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          procedureId={procedureId}
          procedureName={procedureName}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Edit Quantity Dialog (before deduction) */}
      {editingQuantityFor && (
        <EditMaterialQuantityDialog
          open={!!editingQuantityFor}
          onOpenChange={(open) => !open && setEditingQuantityFor(null)}
          procedureId={procedureId}
          material={editingQuantityFor}
          onSuccess={(updatedMaterial) => {
            setEditingQuantityFor(null);
            loadMaterials();
            onMaterialsUpdated?.();
          }}
        />
      )}
    </>
  );
}




