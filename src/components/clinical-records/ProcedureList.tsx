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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit, Trash2, ClipboardList, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ProcedureForm from './ProcedureForm';

interface ProcedureListProps {
  recordId: number;
  canEdit?: boolean;
  onRefresh?: () => void; // Optional callback for parent to refresh
}

export default function ProcedureList({
  recordId,
  canEdit = false,
  onRefresh,
}: ProcedureListProps) {
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDTO | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingProcedure, setDeletingProcedure] = useState<ProcedureDTO | null>(null);

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
              Thủ Thuật Đã Thực Hiện ({procedures.length})
            </h3>
          </div>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm Thủ Thuật
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
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thủ thuật đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {procedures.map((procedure, index) => (
              <div key={procedure.procedureId}>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {procedure.serviceName && (
                          <Badge variant="outline" className="font-medium">
                            {procedure.serviceName}
                          </Badge>
                        )}
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

                      {/* Description */}
                      <div className="text-sm font-medium">
                        {procedure.procedureDescription}
                      </div>

                      {/* Notes */}
                      {procedure.notes && (
                        <div className="text-sm text-muted-foreground">
                          {procedure.notes}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(procedure.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(procedure)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(procedure)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {index < procedures.length - 1 && <Separator className="my-3" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      {(showAddForm || editingProcedure) && (
        <ProcedureForm
          recordId={recordId}
          procedure={editingProcedure || undefined}
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
    </>
  );
}

