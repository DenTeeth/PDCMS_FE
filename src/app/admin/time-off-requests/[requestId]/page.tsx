'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    faArrowLeft,
    faUser,
    faCalendarAlt,
    faClock,
    faFileAlt,
    faCheck,
    faTimes,
    faBan,
    faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { TimeOffRequestService } from '@/services/timeOffRequestService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { workShiftService } from '@/services/workShiftService';
import {
    TimeOffRequestDetail,
    TimeOffStatus,
    TIME_OFF_STATUS_CONFIG,
    TimeOffType,
} from '@/types/timeOff';
import { WorkShift } from '@/types/workShift';
import { useAuth } from '@/contexts/AuthContext';
import { TimeOffDataEnricher } from '@/utils/timeOffDataEnricher';

export default function AdminTimeOffDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const requestId = params.requestId as string;

    const [request, setRequest] = useState<TimeOffRequestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Permissions - ✅ Updated to use new BE permissions
    const canApprove = user?.permissions?.includes('APPROVE_TIME_OFF') || false; // ✅ BE: APPROVE_TIME_OFF
    const canReject = user?.permissions?.includes('APPROVE_TIME_OFF') || false; // ✅ BE: APPROVE_TIME_OFF covers approve/reject
    const canCancelPending = user?.permissions?.includes('APPROVE_TIME_OFF') || false; // ✅ BE: Admin can cancel pending
    const canCancelOwn = user?.permissions?.includes('VIEW_LEAVE_OWN') || false; // ✅ BE: Employee can cancel own (BE uses VIEW_LEAVE_OWN)

    useEffect(() => {
        if (requestId) {
            loadData();
        }
    }, [requestId]);

    const loadData = async () => {
        try {
            // Load timeOffTypes and workShifts first (needed for enriching request)
            await Promise.all([
                loadTimeOffTypes(),
                loadWorkShifts(),
            ]);
            // Then load and enrich request
            await loadRequestDetail();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadTimeOffTypes = async () => {
        try {
            const types = await TimeOffTypeService.getActiveTimeOffTypes();
            setTimeOffTypes(types);
        } catch (error) {
            console.error('Error loading time off types:', error);
        }
    };

    const loadWorkShifts = async () => {
        try {
            const shifts = await workShiftService.getAll(true);
            setWorkShifts(shifts);
        } catch (error) {
            console.error('Error loading work shifts:', error);
            setWorkShifts([]);
        }
    };

    const loadRequestDetail = async () => {
        try {
            setLoading(true);
            const data = await TimeOffRequestService.getTimeOffRequestById(requestId);
            
            // Enrich request with timeOffTypeName, workShiftName, and totalDays
            const enrichedRequest = TimeOffDataEnricher.enrichRequest(
                data,
                timeOffTypes,
                workShifts
            );
            
            setRequest(enrichedRequest);
        } catch (error: any) {
            console.error('Error loading time-off request:', error);
            alert('Không thể tải thông tin yêu cầu');
            router.push('/admin/time-off-requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!request) return;

        try {
            setProcessing(true);
            await TimeOffRequestService.approveTimeOffRequest(request.requestId);
            setShowApproveModal(false);
            await loadRequestDetail();
            alert('Đã duyệt yêu cầu thành công!');
        } catch (error: any) {
            console.error('Error approving request:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.code;

            if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
                alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt"');
                loadRequestDetail();
            } else if (errorMsg?.includes('FORBIDDEN')) {
                alert('Lỗi: Bạn không có quyền thực hiện hành động này');
            } else {
                alert(`Lỗi: ${errorMsg || 'Không thể duyệt yêu cầu'}`);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!request || !rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessing(true);
            await TimeOffRequestService.rejectTimeOffRequest(request.requestId, {
                rejectedReason: rejectReason
            });
            setShowRejectModal(false);
            setRejectReason('');
            await loadRequestDetail();
            alert('Đã từ chối yêu cầu!');
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.code;

            if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
                alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt"');
                loadRequestDetail();
            } else if (errorMsg?.includes('FORBIDDEN')) {
                alert('Lỗi: Bạn không có quyền thực hiện hành động này');
            } else {
                alert(`Lỗi: ${errorMsg || 'Không thể từ chối yêu cầu'}`);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!request || !cancelReason.trim()) {
            alert('Vui lòng nhập lý do hủy');
            return;
        }

        try {
            setProcessing(true);
            await TimeOffRequestService.cancelTimeOffRequest(request.requestId, {
                cancellationReason: cancelReason
            });
            setShowCancelModal(false);
            setCancelReason('');
            await loadRequestDetail();
            alert('Đã hủy yêu cầu!');
        } catch (error: any) {
            console.error('Error cancelling request:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.code;

            if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
                alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt"');
                loadRequestDetail();
            } else if (errorMsg?.includes('FORBIDDEN')) {
                alert('Lỗi: Bạn không có quyền thực hiện hành động này');
            } else {
                alert(`Lỗi: ${errorMsg || 'Không thể hủy yêu cầu'}`);
            }
        } finally {
            setProcessing(false);
        }
    };

    const canCancelRequest = () => {
        if (!request) return false;
        if (canCancelPending) return true;
        if (canCancelOwn && String(request.employee.employeeId) === user?.employeeId) return true;
        return false;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-red-600">Không tìm thấy yêu cầu</p>
            </div>
        );
    }

    const statusConfig = TIME_OFF_STATUS_CONFIG[request.status];
    const isPending = request.status === TimeOffStatus.PENDING;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Chi tiết yêu cầu nghỉ phép</h1>
                        <p className="text-gray-600 mt-1">Mã: {request.requestId}</p>
                    </div>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} text-lg px-4 py-2`}>
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Main Info Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Thông tin yêu cầu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-600">Nhân viên</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                                <p className="font-medium">{request.employee.fullName}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Loại phép</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
                                <p className="font-medium">{request.timeOffTypeName || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Thời gian nghỉ</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                                <div>
                                    <p className="font-medium">
                                        {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: vi })}
                                        {' - '}
                                        {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: vi })}
                                    </p>
                                    {request.workShiftName && (
                                        <p className="text-sm text-gray-500">{request.workShiftName}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Tổng số ngày</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                <p className="font-medium">
                                    {request.totalDays !== undefined && request.totalDays !== null 
                                        ? `${request.totalDays} ngày` 
                                        : 'N/A ngày'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-gray-600">Lý do nghỉ phép</Label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{request.reason}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Lịch sử xử lý</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-600">Người yêu cầu</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faUser} />
                                <div>
                                    <p className="font-medium">{request.requestedBy.fullName}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(request.requestedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {request.approvedBy && request.approvedAt && (
                            <div>
                                <Label className="text-gray-600">Người duyệt</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <FontAwesomeIcon icon={faCheck} />
                                    <div>
                                        <p className="font-medium">{request.approvedBy?.fullName || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(request.approvedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {request.rejectedReason && (
                        <div>
                            <Label className="text-gray-600">Lý do từ chối</Label>
                            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-900">{request.rejectedReason}</p>
                            </div>
                        </div>
                    )}

                    {request.cancellationReason && (
                        <div>
                            <Label className="text-gray-600">Lý do hủy</Label>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-gray-900">{request.cancellationReason}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions Card - Only for PENDING requests */}
            {isPending && (canApprove || canReject || canCancelRequest()) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Thao tác</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3 justify-end">
                            {canApprove && (
                                <Button
                                    onClick={() => setShowApproveModal(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                                    Duyệt yêu cầu
                                </Button>
                            )}

                            {canReject && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectModal(true)}
                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" />
                                    Từ chối
                                </Button>
                            )}

                            {canCancelRequest() && (
                                <Button
                                    onClick={() => setShowCancelModal(true)}
                                    variant="outline"
                                    className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                                >
                                    <FontAwesomeIcon icon={faBan} className="mr-2 h-4 w-4" />
                                    Hủy yêu cầu
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Xác nhận duyệt yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Bạn có chắc chắn muốn duyệt yêu cầu nghỉ phép của{' '}
                                    <strong>{request.employee.fullName}</strong> từ ngày{' '}
                                    <strong>{format(new Date(request.startDate), 'dd/MM/yyyy', { locale: vi })}</strong>{' '}
                                    đến ngày{' '}
                                    <strong>{format(new Date(request.endDate), 'dd/MM/yyyy', { locale: vi })}</strong>?
                                </p>

                                <div className="flex gap-2 pt-4 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowApproveModal(false)}
                                        disabled={processing}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Từ chối yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="rejectReason">Lý do từ chối <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="rejectReason"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối yêu cầu..."
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectReason('');
                                        }}
                                        disabled={processing}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleReject}
                                        disabled={processing || !rejectReason.trim()}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Hủy yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="cancelReason">Lý do hủy <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="cancelReason"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Nhập lý do hủy yêu cầu..."
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setCancelReason('');
                                        }}
                                        disabled={processing}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={processing || !cancelReason.trim()}
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận hủy'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
