/**
 * Overtime Request Error Handler
 * Based on Overtime_API.md error codes and messages
 */

import { OvertimeErrorCode } from '@/types/overtime';

export interface OvertimeError {
  status: number;
  code?: string;
  message: string;
}

export const handleOvertimeError = (error: any): OvertimeError => {
  const status = error.response?.status || 500;
  // Backend có thể trả về code hoặc error
  const code = error.response?.data?.code || error.response?.data?.error;
  const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra';

  return {
    status,
    code,
    message,
  };
};

export const getOvertimeErrorMessage = (error: OvertimeError): string => {
  switch (error.status) {
    case 400:
      return `Dữ liệu không hợp lệ: ${error.message}`;

    case 403:
      return 'Bạn không có quyền thực hiện hành động này';

    case 404:
      if (error.code === OvertimeErrorCode.OT_REQUEST_NOT_FOUND) {
        return 'Không tìm thấy yêu cầu làm thêm giờ';
      } else if (error.code === OvertimeErrorCode.RELATED_RESOURCE_NOT_FOUND) {
        return 'Nhân viên hoặc ca làm việc không tồn tại';
      }
      return 'Không tìm thấy tài nguyên';

    case 409:
      if (error.code === OvertimeErrorCode.SLOT_CONFLICT) {
        return 'Nhân viên đã có lịch làm việc trùng giờ với ca này';
      } else if (error.code === OvertimeErrorCode.DUPLICATE_OT_REQUEST) {
        return 'Nhân viên đã đăng ký tăng ca cho ca làm việc này';
      } else if (error.code === OvertimeErrorCode.INVALID_STATE_TRANSITION) {
        return 'Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING';
      }
      // Nếu không có code cụ thể, hiển thị message từ backend
      return error.message || 'Xung đột dữ liệu: Nhân viên đã có lịch làm việc hoặc đã đăng ký ca này';

    case 500:
      // Hiển thị message từ backend nếu có
      if (error.message && error.message !== 'Internal server error') {
        return `Lỗi máy chủ: ${error.message}`;
      }
      return 'Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên';

    default:
      return error.message || 'Có lỗi xảy ra';
  }
};

export const showOvertimeError = (error: any): void => {
  const overtimeError = handleOvertimeError(error);
  const message = getOvertimeErrorMessage(overtimeError);

  // Log chi tiết error để debug
  console.error('🔴 Overtime Error Details:', {
    status: overtimeError.status,
    code: overtimeError.code,
    message: overtimeError.message,
    fullError: error.response?.data,
    userMessage: message
  });

  alert(message);
};

export const validateOvertimeForm = (formData: {
  employeeId?: number;
  workDate: string;
  workShiftId: string;
  reason: string;
}): string | null => {
  // Check required fields
  if (!formData.workDate || !formData.workShiftId || !formData.reason.trim()) {
    return 'Vui lòng điền đầy đủ thông tin';
  }

  // Validate employeeId if provided (for admin form)
  if (formData.employeeId !== undefined && formData.employeeId <= 0) {
    return 'Vui lòng chọn nhân viên hợp lệ';
  }

  // Validate date is not in the past
  const workDate = new Date(formData.workDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (workDate < today) {
    return 'Ngày làm việc không được ở quá khứ';
  }

  // Validate reason length
  if (formData.reason.trim().length < 10) {
    return 'Lý do phải có ít nhất 10 ký tự';
  }

  return null;
};
