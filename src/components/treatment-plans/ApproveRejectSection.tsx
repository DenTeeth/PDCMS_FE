'use client';

/**
 * Approve/Reject Treatment Plan Section
 * Phase 3.5: API 5.9 - Manager approval workflow
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { TreatmentPlanDetailResponse, TreatmentPlanDetailResponseWithApproval, ApprovalStatus, ApprovePlanRequest } from '@/types/treatmentPlan';
import { useAuth } from '@/contexts/AuthContext';

interface ApproveRejectSectionProps {
  plan: TreatmentPlanDetailResponse | TreatmentPlanDetailResponseWithApproval;
  onPlanUpdated: (updatedPlan: TreatmentPlanDetailResponse | TreatmentPlanDetailResponseWithApproval) => void; // Callback to refresh plan data
}

export default function ApproveRejectSection({
  plan,
  onPlanUpdated,
}: ApproveRejectSectionProps) {
  const { user } = useAuth();

  // Debug: Log plan data to check submitNotes
  if (plan.approvalStatus === 'PENDING_REVIEW' || plan.approvalStatus === 'PENDING_APPROVAL') {
    console.log('ApproveRejectSection - Plan data:', {
      planCode: plan.planCode,
      approvalStatus: plan.approvalStatus,
      submitNotes: (plan as TreatmentPlanDetailResponse).submitNotes,
      hasSubmitNotes: 'submitNotes' in plan,
      allKeys: Object.keys(plan),
    });
  }
  // Chỉ check permission, không check role (theo yêu cầu dự án)
  // ✅ BE: MANAGE_TREATMENT_PLAN covers approve/reject (BE controller line 882)
  const canApprove = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false;

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');

  // Helper: Normalize approval status (backend returns string, may be PENDING_REVIEW or PENDING_APPROVAL)
  // Note: approvalStatus và status là 2 cột riêng biệt trong DB
  // - status: TreatmentPlanStatus (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  // - approvalStatus: ApprovalStatus (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
  const normalizeApprovalStatus = (status?: ApprovalStatus | string | null): ApprovalStatus => {
    // Nếu không có approvalStatus, mặc định là DRAFT (theo BE: default value)
    if (!status) return ApprovalStatus.DRAFT;
    if (typeof status === 'string') {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'DRAFT') return ApprovalStatus.DRAFT;
      if (upperStatus === 'PENDING_REVIEW' || upperStatus === 'PENDING_APPROVAL') return ApprovalStatus.PENDING_REVIEW;
      if (upperStatus === 'APPROVED') return ApprovalStatus.APPROVED;
      if (upperStatus === 'REJECTED') return ApprovalStatus.REJECTED;
      // Nếu không match, mặc định là DRAFT
      return ApprovalStatus.DRAFT;
    }
    return status as ApprovalStatus;
  };

  const normalizedApprovalStatus = normalizeApprovalStatus(plan.approvalStatus);

  // Check if plan can be approved/rejected
  // Backend requires: approvalStatus == PENDING_REVIEW (not PENDING_APPROVAL)
  const canApprovePlan = canApprove && normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW;
  const canRejectPlan = canApprove && normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW;

  // Note: Zero-price items are now allowed (removed validation per user request)

  // Get approval status badge
  const getApprovalStatusBadge = () => {
    const status = normalizedApprovalStatus;
    switch (status) {
      case ApprovalStatus.DRAFT:
        return <Badge className="bg-slate-100 text-slate-700 border border-slate-300 rounded-full px-3 py-1 font-medium">Bản nháp</Badge>;
      case ApprovalStatus.PENDING_REVIEW:
        return <Badge className="bg-amber-400 text-amber-900 border border-amber-500 rounded-full px-3 py-1 font-medium shadow-sm">Chờ duyệt</Badge>;
      case ApprovalStatus.APPROVED:
        return <Badge className="bg-emerald-400 text-emerald-900 border border-emerald-500 rounded-full px-3 py-1 font-medium shadow-sm">Đã duyệt</Badge>;
      case ApprovalStatus.REJECTED:
        return <Badge className="bg-red-400 text-red-900 border border-red-500 rounded-full px-3 py-1 font-medium shadow-sm">Đã từ chối</Badge>;
      default:
        return null;
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!canApprovePlan) return;

    // Validate notes (optional for approval, max 5000 chars per backend)
    if (notes.length > 5000) {
      setNotesError('Ghi chú không được vượt quá 5000 ký tự');
      return;
    }
    setNotesError('');

    setIsProcessing(true);
    try {
      const request: ApprovePlanRequest = {
        approvalStatus: 'APPROVED',
        notes: notes.trim() || '',
      };

      const response = await TreatmentPlanService.approveTreatmentPlan(plan.planCode, request);

      // Show success toast
      toast.success('Duyệt lộ trình thành công', {
        description: 'Lộ trình đã được duyệt và có thể kích hoạt',
      });

      // Reset form
      setShowApproveForm(false);
      setNotes('');

      // Refresh plan data
      onPlanUpdated(response as TreatmentPlanDetailResponseWithApproval);
    } catch (error: any) {
      console.error('Error approving plan:', error);

      // Handle specific errors
      if (error.response?.status === 400) {
        toast.error('Lỗi xác thực', {
          description: error.response?.data?.message || 'Không thể duyệt lộ trình',
        });
        setNotesError(error.response?.data?.message || '');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy lộ trình', {
          description: 'Lộ trình không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        toast.error('Xung đột', {
          description: error.response?.data?.message || 'Không thể duyệt lộ trình trong trạng thái hiện tại',
        });
      } else if (error.response?.status === 400) {
        // Check if error is about zero-price items
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.includes('giá 0đ') || errorMessage.includes('giá 0') || errorMessage.includes('zero') || errorMessage.includes('0đ')) {
          toast.error('Không thể duyệt lộ trình', {
            description: 'Backend hiện tại không cho phép duyệt lộ trình có hạng mục với giá 0 VND. Vui lòng liên hệ BE team để bỏ validation này hoặc cập nhật giá trước khi duyệt.',
            duration: 8000,
          });
        } else {
          toast.error('Lỗi xác thực', {
            description: errorMessage || 'Không thể duyệt lộ trình',
          });
          setNotesError(errorMessage || '');
        }
      } else {
        toast.error('Đã xảy ra lỗi', {
          description: error.response?.data?.message || 'Vui lòng thử lại sau',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!canRejectPlan) return;

    // Validate notes (required for rejection, max 5000 chars per backend)
    if (!notes.trim()) {
      setNotesError('Vui lòng nhập lý do từ chối');
      return;
    }
    if (notes.length > 5000) {
      setNotesError('Ghi chú không được vượt quá 5000 ký tự');
      return;
    }
    setNotesError('');

    // Confirm rejection
    const confirmed = window.confirm(
      'Bạn có chắc muốn từ chối lộ trình này?\n' +
      'Lộ trình sẽ chuyển sang trạng thái "Đã từ chối" và không thể kích hoạt.'
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const request: ApprovePlanRequest = {
        approvalStatus: 'REJECTED',
        notes: notes.trim(),
      };

      const response = await TreatmentPlanService.approveTreatmentPlan(plan.planCode, request);

      // Show success toast
      toast.success('Từ chối lộ trình thành công', {
        description: 'Lộ trình đã được từ chối',
      });

      // Reset form
      setShowRejectForm(false);
      setNotes('');

      // Refresh plan data
      onPlanUpdated(response as TreatmentPlanDetailResponseWithApproval);
    } catch (error: any) {
      console.error('Error rejecting plan:', error);

      // Handle specific errors
      if (error.response?.status === 400) {
        toast.error('Lỗi xác thực', {
          description: error.response?.data?.message || 'Không thể từ chối lộ trình',
        });
        setNotesError(error.response?.data?.message || '');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy lộ trình', {
          description: 'Lộ trình không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        toast.error('Xung đột', {
          description: error.response?.data?.message || 'Không thể từ chối lộ trình trong trạng thái hiện tại',
        });
      } else {
        toast.error('Đã xảy ra lỗi', {
          description: error.response?.data?.message || 'Vui lòng thử lại sau',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show section if user doesn't have permission
  if (!canApprove) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-lg text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Duyệt lộ trình điều trị
          </CardTitle>
          {getApprovalStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Approval Status Info */}
        <div className="text-sm">
          {normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW && (
            <div className="space-y-3">
              <p className="text-amber-900 font-medium">
                Lộ trình đang chờ được duyệt. Quản lý cần duyệt trước khi có thể kích hoạt.
              </p>
              {/*  Display submit notes from doctor */}
              {(() => {
                // Check if plan has submitNotes field and it's not empty
                // Handle both TreatmentPlanDetailResponse and TreatmentPlanDetailResponseWithApproval
                const planWithNotes = plan as TreatmentPlanDetailResponse;
                const submitNotes = planWithNotes.submitNotes;

                // Debug: Log to check if submitNotes exists
                if (normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW) {
                  console.log('ApproveRejectSection - Plan submitNotes:', submitNotes);
                  console.log('ApproveRejectSection - Plan object keys:', Object.keys(plan));
                }

                if (submitNotes && typeof submitNotes === 'string' && submitNotes.trim()) {
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-sm">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-700" />
                        <div className="flex-1 space-y-1.5">
                          <p className="font-semibold text-blue-900 text-sm">Ghi chú từ bác sĩ:</p>
                          <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {submitNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
          {normalizedApprovalStatus === ApprovalStatus.APPROVED && (
            <p className="text-emerald-700 font-medium">
              Lộ trình đã được duyệt và có thể kích hoạt.
            </p>
          )}
          {/* Show rejection/return notice for both REJECTED and DRAFT with notes */}
          {(normalizedApprovalStatus === ApprovalStatus.REJECTED ||
            (normalizedApprovalStatus === ApprovalStatus.DRAFT &&
              'approvalMetadata' in plan && plan.approvalMetadata && plan.approvalMetadata.notes)) && (
              <div className="space-y-2">
                <p className="text-red-700 font-medium">
                  {normalizedApprovalStatus === ApprovalStatus.REJECTED
                    ? 'Lộ trình đã bị từ chối và không thể kích hoạt.'
                    : 'Lộ trình đã bị trả về bản nháp. Vui lòng xem ghi chú và chỉnh sửa lại.'}
                </p>
                {/* Show rejection/return reason prominently */}
                {'approvalMetadata' in plan && plan.approvalMetadata && plan.approvalMetadata.notes && (
                  <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
                    <div className="flex items-start gap-3 text-red-700">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-base text-red-900">
                          Phản hồi từ người duyệt:
                        </p>
                        <p className="text-red-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {plan.approvalMetadata.notes}
                        </p>
                        {plan.approvalMetadata.approvedBy && (
                          <p className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                            <span className="font-medium">Người xử lý:</span>{' '}
                            {typeof plan.approvalMetadata.approvedBy === 'string'
                              ? plan.approvalMetadata.approvedBy
                              : plan.approvalMetadata.approvedBy.fullName ||
                              plan.approvalMetadata.approvedBy.employeeCode}
                            {plan.approvalMetadata.approvedAt && (
                              <span className="ml-2">
                                • {new Date(plan.approvalMetadata.approvedAt).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {(!('approvalMetadata' in plan) || !plan.approvalMetadata || !plan.approvalMetadata.notes) && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-sm text-yellow-800 shadow-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-600" />
                      <p className="font-medium">
                        Không có thông tin lý do từ chối. Vui lòng liên hệ quản lý để biết thêm chi tiết.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          {normalizedApprovalStatus === ApprovalStatus.DRAFT && (
            <p className="text-gray-700 font-medium">
              Lộ trình đang ở trạng thái bản nháp.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {canApprovePlan && (
          <div className="space-y-3 pt-2">
            {!showApproveForm && !showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowApproveForm(true);
                    setShowRejectForm(false);
                    setNotes('');
                    setNotesError('');
                  }}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Duyệt
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRejectForm(true);
                    setShowApproveForm(false);
                    setNotes('');
                    setNotesError('');
                  }}
                  disabled={isProcessing}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg shadow-sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-white">
                {showApproveForm && (
                  <>
                    <div>
                      <Label htmlFor="approve-notes" className="text-sm">
                        Ghi chú (tùy chọn)
                      </Label>
                      <Textarea
                        id="approve-notes"
                        value={notes}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 5000) {
                            setNotes(value);
                            setNotesError('');
                          } else {
                            setNotesError('Ghi chú không được vượt quá 5000 ký tự');
                          }
                        }}
                        placeholder="Nhập ghi chú (tùy chọn)"
                        className="mt-1 h-20 text-sm"
                        disabled={isProcessing}
                        maxLength={5000}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {notesError && (
                          <span className="text-xs text-red-500">{notesError}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {notes.length}/5000
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveForm(false);
                          setNotes('');
                          setNotesError('');
                        }}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={isProcessing || !!notesError}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Xác nhận duyệt
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {showRejectForm && (
                  <>
                    <div>
                      <Label htmlFor="reject-notes" className="text-sm">
                        Lý do từ chối <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="reject-notes"
                        value={notes}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 5000) {
                            setNotes(value);
                            setNotesError('');
                          } else {
                            setNotesError('Ghi chú không được vượt quá 5000 ký tự');
                          }
                        }}
                        placeholder="Nhập lý do từ chối (bắt buộc)"
                        className="mt-1 h-20 text-sm"
                        disabled={isProcessing}
                        maxLength={5000}
                        required
                      />
                      <div className="flex items-center justify-between mt-1">
                        {notesError && (
                          <span className="text-xs text-red-500">{notesError}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {notes.length}/5000
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setNotes('');
                          setNotesError('');
                        }}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isProcessing || !notes.trim() || !!notesError}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Xác nhận từ chối
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

