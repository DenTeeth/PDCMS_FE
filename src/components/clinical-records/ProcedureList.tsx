'use client';

/**
 * Procedure List Component
 * 
 * Displays list of procedures with edit/delete actions
 * Optimized UX: Simple list, minimal cards
 */

import React, { useState, useEffect } from 'react';
import { ProcedureDTO } from '@/types/clinicalRecord';
import { clinicalRecordService } from '@/services/clinicalRecordService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit, Trash2, ClipboardList, Plus, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ProcedureForm from './ProcedureForm';
import ProcedureMaterialsView from './ProcedureMaterialsView';

interface ProcedureListProps {
  recordId: number;
  canEdit?: boolean;
  appointmentStatus?: string; // Only show materials if COMPLETED
  onRefresh?: () => void; // Optional callback for parent to refresh
}

export default function ProcedureList({
  recordId,
  canEdit = false,
  appointmentStatus,
  onRefresh,
}: ProcedureListProps) {
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDTO | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingProcedure, setDeletingProcedure] = useState<ProcedureDTO | null>(null);
  const [viewingMaterialsFor, setViewingMaterialsFor] = useState<number | null>(null);
  // Materials count cache: procedureId -> materials count
  const [materialsCount, setMaterialsCount] = useState<Record<number, number>>({});
  const [loadingMaterialsCount, setLoadingMaterialsCount] = useState<Record<number, boolean>>({});

  // Load procedures
  const loadProcedures = async () => {
    try {
      setLoading(true);
      const data = await clinicalRecordService.getProcedures(recordId);
      setProcedures(data);
    } catch (error: any) {
      console.error('Error loading procedures:', error);
      // Don't show error if 404 (no procedures yet)
      if (error.status !== 404 && error.response?.status !== 404) {
        toast.error('Không thể tải danh sách thủ thuật');
      }
      setProcedures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcedures();
  }, [recordId]);

  // Load materials count for all procedures when appointment status allows
  useEffect(() => {
    const canViewMaterials = appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED';
    console.log('[ProcedureList] Materials count effect:', {
      appointmentStatus,
      canViewMaterials,
      proceduresCount: procedures.length,
    });
    if (!canViewMaterials || procedures.length === 0) {
      console.log('[ProcedureList] Skipping materials count load:', {
        canViewMaterials,
        proceduresCount: procedures.length,
      });
      return;
    }

    const loadMaterialsCounts = async () => {
      const counts: Record<number, number> = {};
      const loading: Record<number, boolean> = {};

      // Set loading state for all procedures
      procedures.forEach((p) => {
        loading[p.procedureId] = true;
      });
      setLoadingMaterialsCount(loading);

      // Load materials count for each procedure in parallel
      const promises = procedures.map(async (procedure) => {
        try {
          const materials = await clinicalRecordService.getProcedureMaterials(procedure.procedureId);
          // Count only if hasConsumables is true or materials array exists
          if (materials.hasConsumables === false) {
            counts[procedure.procedureId] = 0; // No consumables
          } else {
            counts[procedure.procedureId] = materials.materials?.length || 0;
          }
        } catch (error: any) {
          // If 404 or error, assume no materials or can't load
          console.warn(`Could not load materials for procedure ${procedure.procedureId}:`, error);
          counts[procedure.procedureId] = -1; // -1 means unknown/error
        }
      });

      await Promise.all(promises);
      setMaterialsCount(counts);
      setLoadingMaterialsCount({});
    };

    loadMaterialsCounts();
  }, [procedures, appointmentStatus]);

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateTime;
    }
  };

  const handleEdit = (procedure: ProcedureDTO) => {
    setEditingProcedure(procedure);
  };

  const handleDelete = (procedure: ProcedureDTO) => {
    setDeletingProcedure(procedure);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProcedure) return;

    try {
      await clinicalRecordService.deleteProcedure(recordId, deletingProcedure.procedureId);
      toast.success('Đã xóa thủ thuật thành công');
      setDeletingProcedure(null);
      await loadProcedures();
      onRefresh?.(); // Call parent callback if provided
    } catch (error: any) {
      console.error('Error deleting procedure:', error);
      toast.error(error.message || 'Không thể xóa thủ thuật');
    }
  };

  const handleFormSuccess = async () => {
    setEditingProcedure(null);
    setShowAddForm(false);
    await loadProcedures();
    onRefresh?.(); // Call parent callback if provided
  };

  const handleFormCancel = () => {
    setEditingProcedure(null);
    setShowAddForm(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Thủ thuật thực hiện ({procedures.length})
            </h3>
          </div>
          {canEdit && appointmentStatus !== 'COMPLETED' && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm thủ thuật
            </Button>
          )}
        </div>

        {/* Procedures List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : procedures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có thủ thuật nào được ghi nhận</p>
            {canEdit && appointmentStatus !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                  Thêm thủ thuật
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-[150px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures.map((procedure) => (
                  <TableRow key={procedure.procedureId}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="font-medium">
                          {procedure.serviceName || procedure.serviceCode || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {procedure.serviceCode && (
                            <Badge variant="secondary" className="text-xs">
                              {procedure.serviceCode}
                            </Badge>
                          )}
                          {procedure.toothNumber && (
                            <Badge variant="default" className="bg-blue-500">
                              Răng {procedure.toothNumber}
                            </Badge>
                          )}
                          {procedure.patientPlanItemId && (
                            <Badge variant="outline" className="text-xs">
                              Liên kết lộ trình
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(procedure.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {procedure.procedureDescription || '-'}
                        </div>
                        {procedure.notes && (
                          <div className="text-sm text-muted-foreground italic">
                            Ghi chú: {procedure.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details Button - Show if appointment is IN_PROGRESS or COMPLETED */}
                        {(appointmentStatus === 'IN_PROGRESS' || appointmentStatus === 'COMPLETED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingMaterialsFor(procedure.procedureId)}
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && appointmentStatus !== 'COMPLETED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(procedure)}
                              className="h-8 w-8 p-0"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(procedure)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      {(showAddForm || editingProcedure) && (
        <ProcedureForm
          recordId={recordId}
          procedure={editingProcedure || undefined}
          appointmentStatus={appointmentStatus}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProcedure}
        onOpenChange={(open) => !open && setDeletingProcedure(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thủ thuật</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thủ thuật này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {deletingProcedure && (
            <div className="py-4">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <div className="font-medium">{deletingProcedure.procedureDescription}</div>
                {deletingProcedure.serviceName && (
                  <div className="text-sm text-muted-foreground">
                    Dịch vụ: {deletingProcedure.serviceName}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProcedure(null)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      {viewingMaterialsFor && (
        <Dialog
          open={!!viewingMaterialsFor}
          onOpenChange={(open) => !open && setViewingMaterialsFor(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết thủ thuật</DialogTitle>
              <DialogDescription>
                {(() => {
                  const procedure = procedures.find((p) => p.procedureId === viewingMaterialsFor);
                  return procedure?.serviceName || 'Thủ thuật';
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Procedure Info */}
              {(() => {
                const procedure = procedures.find((p) => p.procedureId === viewingMaterialsFor);
                if (!procedure) return null;
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Tên thủ thuật</h4>
                      <p className="text-sm">{procedure.serviceName || procedure.serviceCode || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Mô tả</h4>
                      <p className="text-sm text-muted-foreground">
                        {procedure.procedureDescription || '-'}
                      </p>
                      {procedure.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          Ghi chú: {procedure.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <Separator />

              {/* Materials */}
              <div>
                <h4 className="text-sm font-semibold mb-4">Vật tư tiêu hao</h4>
                <ProcedureMaterialsView
                  procedureId={viewingMaterialsFor}
                  procedureName={
                    procedures.find((p) => p.procedureId === viewingMaterialsFor)?.serviceName
                  }
                  toothNumber={
                    procedures.find((p) => p.procedureId === viewingMaterialsFor)?.toothNumber
                  }
                  appointmentStatus={appointmentStatus}
                  onMaterialsUpdated={() => {
                    loadProcedures();
                    onRefresh?.();
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

