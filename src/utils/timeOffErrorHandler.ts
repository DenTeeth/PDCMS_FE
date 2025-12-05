/**
 * Time-Off Request Error Handler
 * Centralized error handling for Time-Off Request operations
 */

export interface TimeOffErrorInfo {
    title: string;
    message: string;
    details?: string;
    shouldReload?: boolean;
    shouldRedirect?: string;
}

export class TimeOffErrorHandler {
    /**
     * Handle approve request errors
     */
    static handleApproveError(error: any, requestId: string): TimeOffErrorInfo {
        const errorStatus = error.response?.status;
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || errorData?.error || error.message;

        // Log for debugging
        if (process.env.NODE_ENV === 'development') {
            console.error(' Approve Error Details:', {
                requestId,
                status: errorStatus,
                statusText: error.response?.statusText,
                data: errorData,
                message: errorMsg,
                stack: error.stack,
            });
        }

        switch (errorStatus) {
            case 500:
                return {
                    title: 'Lỗi Backend (500)',
                    message: errorMsg || 'Internal Server Error',
                    details: `Chi tiết: ${JSON.stringify(errorData, null, 2)}\n\n` +
                        'Vui lòng kiểm tra:\n' +
                        '1. Backend logs để xem lỗi chi tiết\n' +
                        '2. Kết nối database\n' +
                        '3. Cấu hình time-off type và employee balance\n' +
                        '4. Nested employee objects trong response'
                };

            case 400:
                if (errorMsg?.includes('INVALID_STATE_TRANSITION') || errorMsg?.includes('PENDING')) {
                    return {
                        title: 'Lỗi Trạng thái',
                        message: 'Yêu cầu này không còn ở trạng thái "Chờ duyệt".',
                        details: 'Trang sẽ được tải lại để cập nhật trạng thái mới nhất.',
                        shouldReload: true
                    };
                }
                return {
                    title: 'Lỗi Dữ liệu',
                    message: errorMsg || 'Dữ liệu không hợp lệ'
                };

            case 403:
                return {
                    title: 'Không có quyền',
                    message: 'Bạn không có quyền duyệt yêu cầu nghỉ phép.',
                    details: 'Vui lòng liên hệ quản trị viên để được cấp quyền APPROVE_TIMEOFF.'
                };

            case 404:
                return {
                    title: 'Không tìm thấy',
                    message: 'Không tìm thấy yêu cầu này.',
                    details: 'Yêu cầu có thể đã bị xóa. Trang sẽ được tải lại.',
                    shouldReload: true
                };

            case 401:
                return {
                    title: 'Phiên hết hạn',
                    message: 'Phiên đăng nhập hết hạn.',
                    details: 'Vui lòng đăng nhập lại.',
                    shouldRedirect: '/login'
                };

            default:
                return {
                    title: `Lỗi không xác định (${errorStatus || 'N/A'})`,
                    message: errorMsg || 'Không thể duyệt yêu cầu. Vui lòng thử lại sau.'
                };
        }
    }

    /**
     * Handle reject request errors
     */
    static handleRejectError(error: any, requestId: string, reason: string): TimeOffErrorInfo {
        const errorStatus = error.response?.status;
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || errorData?.error || error.message;

        if (process.env.NODE_ENV === 'development') {
            console.error(' Reject Error Details:', {
                requestId,
                reason,
                status: errorStatus,
                statusText: error.response?.statusText,
                data: errorData,
                message: errorMsg,
            });
        }

        switch (errorStatus) {
            case 500:
                return {
                    title: 'Lỗi Backend (500)',
                    message: errorMsg || 'Internal Server Error',
                    details: `Chi tiết: ${JSON.stringify(errorData, null, 2)}\n\nVui lòng kiểm tra backend logs.`
                };

            case 400:
                if (errorMsg?.includes('INVALID_STATE_TRANSITION') || errorMsg?.includes('PENDING')) {
                    return {
                        title: 'Lỗi Trạng thái',
                        message: 'Yêu cầu này không còn ở trạng thái "Chờ duyệt".',
                        shouldReload: true
                    };
                }
                if (errorMsg?.includes('rejectedReason')) {
                    return {
                        title: 'Thiếu thông tin',
                        message: 'Lý do từ chối là bắt buộc và không được để trống.'
                    };
                }
                return {
                    title: 'Lỗi Dữ liệu',
                    message: errorMsg || 'Dữ liệu không hợp lệ'
                };

            case 403:
                return {
                    title: 'Không có quyền',
                    message: 'Bạn không có quyền từ chối yêu cầu nghỉ phép.',
                    details: 'Vui lòng liên hệ quản trị viên để được cấp quyền REJECT_TIMEOFF.'
                };

            case 404:
                return {
                    title: 'Không tìm thấy',
                    message: 'Không tìm thấy yêu cầu này.',
                    shouldReload: true
                };

            case 401:
                return {
                    title: 'Phiên hết hạn',
                    message: 'Phiên đăng nhập hết hạn.',
                    shouldRedirect: '/login'
                };

            default:
                return {
                    title: `Lỗi không xác định (${errorStatus || 'N/A'})`,
                    message: errorMsg || 'Không thể từ chối yêu cầu'
                };
        }
    }

    /**
     * Handle cancel request errors
     */
    static handleCancelError(error: any, requestId: string, reason: string): TimeOffErrorInfo {
        const errorStatus = error.response?.status;
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || errorData?.error || error.message;

        if (process.env.NODE_ENV === 'development') {
            console.error(' Cancel Error Details:', {
                requestId,
                reason,
                status: errorStatus,
                statusText: error.response?.statusText,
                data: errorData,
                message: errorMsg,
            });
        }

        switch (errorStatus) {
            case 500:
                return {
                    title: 'Lỗi Backend (500)',
                    message: errorMsg || 'Internal Server Error',
                    details: `Chi tiết: ${JSON.stringify(errorData, null, 2)}\n\nVui lòng kiểm tra backend logs.`
                };

            case 400:
                if (errorMsg?.includes('INVALID_STATE_TRANSITION') || errorMsg?.includes('PENDING')) {
                    return {
                        title: 'Lỗi Trạng thái',
                        message: 'Yêu cầu này không còn ở trạng thái "Chờ duyệt".',
                        shouldReload: true
                    };
                }
                if (errorMsg?.includes('cancellationReason')) {
                    return {
                        title: 'Thiếu thông tin',
                        message: 'Lý do hủy là bắt buộc và không được để trống.'
                    };
                }
                return {
                    title: 'Lỗi Dữ liệu',
                    message: errorMsg || 'Dữ liệu không hợp lệ'
                };

            case 403:
                return {
                    title: 'Không có quyền',
                    message: 'Bạn không có quyền hủy yêu cầu này.',
                    details: 'Chỉ người tạo yêu cầu hoặc người có quyền CANCEL_TIMEOFF_PENDING mới có thể hủy.'
                };

            case 404:
                return {
                    title: 'Không tìm thấy',
                    message: 'Không tìm thấy yêu cầu này.',
                    shouldReload: true
                };

            case 401:
                return {
                    title: 'Phiên hết hạn',
                    message: 'Phiên đăng nhập hết hạn.',
                    shouldRedirect: '/login'
                };

            default:
                return {
                    title: `Lỗi không xác định (${errorStatus || 'N/A'})`,
                    message: errorMsg || 'Không thể hủy yêu cầu'
                };
        }
    }

    /**
     * Format error info into user-friendly alert message
     */
    static formatErrorMessage(errorInfo: TimeOffErrorInfo): string {
        let message = ` ${errorInfo.title}\n\n${errorInfo.message}`;

        if (errorInfo.details) {
            message += `\n\n${errorInfo.details}`;
        }

        return message;
    }
}
