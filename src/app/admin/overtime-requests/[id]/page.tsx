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

import { OvertimeService } from '@/services/overtimeService';
import { showOvertimeError } from '@/utils/overtimeErrorHandler';
import {
    OvertimeRequestDetail,
    OvertimeStatus,
    OVERTIME_STATUS_CONFIG,
} from '@/types/overtime';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminOvertimeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const requestId = params.id as string;

    const [request, setRequest] = useState<OvertimeRequestDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Permissions
    const canApprove = user?.permissions?.includes('APPROVE_OT');
    const canReject = user?.permissions?.includes('REJECT_OT');
    const canCancelPending = user?.permissions?.includes('CANCEL_OT_PENDING');

    useEffect(() => {
        loadRequestDetail();
    }, [requestId]);

    const loadRequestDetail = async () => {
        try {
            setLoading(true);
            const data = await OvertimeService.getOvertimeRequestById(requestId);
            setRequest(data);
        } catch (error: any) {
            console.error('Error loading overtime request:', error);
            showOvertimeError(error);
            router.push('/admin/overtime-requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!request) return;

        try {
            setProcessing(true);
            await OvertimeService.approveOvertimeRequest(request.requestId);
            setShowApproveModal(false);
            await loadRequestDetail();
            alert('Đã duyệt yêu cầu thành công!');
        } catch (error: any) {
            console.error('Error approving request:', error);
            showOvertimeError(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!request || !rejectReason.trim()) return;

        try {
            setProcessing(true);
            await OvertimeService.rejectOvertimeRequest(request.requestId, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            await loadRequestDetail();
            alert('Đã từ chối yêu cầu!');
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            showOvertimeError(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!request || !cancelReason.trim()) return;

        try {
            setProcessing(true);
            await OvertimeService.cancelOvertimeRequest(request.requestId, cancelReason);
            setShowCancelModal(false);
            setCancelReason('');
            await loadRequestDetail();
            alert('Đã hủy yêu cầu!');
        } catch (error: any) {
            console.error('Error canceling request:', error);
            showOvertimeError(error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải chi tiết yêu cầu...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Không tìm thấy yêu cầu.</p>
            </div>
        );
    }

    const statusConfig = OVERTIME_STATUS_CONFIG[request.status];
    const isPending = request.status === OvertimeStatus.PENDING;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    Quay lại
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Chi tiết yêu cầu làm thêm giờ</h1>
                        <p className="text-gray-600 mt-2">Mã yêu cầu: <strong>{request.requestId}</strong></p>
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
                                <div>
                                    <p className="font-medium">{request.employee.fullName}</p>
                                    <p className="text-xs text-gray-500">Mã NV: {request.employee.employeeCode}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Ngày làm việc</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                                <p className="font-medium">
                                    {format(new Date(request.workDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Ca làm việc</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                <div>
                                    <p className="font-medium">{request.workShift.shiftName}</p>
                                    <span className="text-sm text-gray-500">
                                        ({request.workShift.startTime} - {request.workShift.endTime})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-600">Số giờ</Label>
                            <p className="font-medium mt-1">{request.workShift.durationHours} giờ</p>
                        </div>
                    </div>

                    <div>
                        <Label className="text-gray-600">Lý do làm thêm giờ</Label>
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
                    <div>
                        <Label className="text-gray-600">Người yêu cầu</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <FontAwesomeIcon icon={faUser} className="text-purple-600" />
                            <div>
                                <p className="font-medium">{request.requestedBy.fullName}</p>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(request.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {request.approvedBy && request.approvedAt && (
                        <div>
                            <Label className="text-gray-600">Người duyệt</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                                <div>
                                    <p className="font-medium">{request.approvedBy.fullName}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(request.approvedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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

            {/* Actions */}
            {isPending && (
                <Card>
                    <CardHeader>
                        <CardTitle>Thao tác</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {canApprove && (
                                <Button
                                    onClick={() => setShowApproveModal(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    Duyệt yêu cầu
                                </Button>
                            )}

                            {canReject && (
                                <Button
                                    onClick={() => setShowRejectModal(true)}
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                    Từ chối
                                </Button>
                            )}

                            {canCancelPending && (
                                <Button
                                    onClick={() => setShowCancelModal(true)}
                                    variant="outline"
                                    className="text-gray-600 border-gray-600 hover:bg-gray-50"
                                >
                                    <FontAwesomeIcon icon={faBan} className="mr-2" />
                                    Hủy yêu cầu
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Xác nhận duyệt yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Bạn có chắc chắn muốn duyệt yêu cầu làm thêm giờ của <strong>{request.employee.fullName}</strong> vào ngày <strong>{format(new Date(request.workDate), 'dd/MM/yyyy', { locale: vi })}</strong>?
                                </p>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowApproveModal(false)}
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Từ chối yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="rejectReason">Lý do từ chối *</Label>
                                    <Textarea
                                        id="rejectReason"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối yêu cầu..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleReject}
                                        disabled={!rejectReason.trim() || processing}
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectReason('');
                                        }}
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Hủy yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="cancelReason">Lý do hủy *</Label>
                                    <Textarea
                                        id="cancelReason"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Nhập lý do hủy yêu cầu..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleCancel}
                                        disabled={!cancelReason.trim() || processing}
                                        className="flex-1"
                                    >
                                        {processing ? 'Đang xử lý...' : 'Xác nhận hủy'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setCancelReason('');
                                        }}
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        Hủy
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
