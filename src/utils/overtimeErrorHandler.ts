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
  const code = error.response?.data?.code;
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
      if (error.code === OvertimeErrorCode.DUPLICATE_OT_REQUEST) {
        return 'Nhân viên đã đăng ký tăng ca cho ca làm việc này';
      } else if (error.code === OvertimeErrorCode.INVALID_STATE_TRANSITION) {
        return 'Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING';
      }
      return 'Xung đột dữ liệu';
    
    case 500:
      return 'Lỗi máy chủ. Vui lòng thử lại sau';
    
    default:
      return error.message || 'Có lỗi xảy ra';
  }
};

export const showOvertimeError = (error: any): void => {
  const overtimeError = handleOvertimeError(error);
  const message = getOvertimeErrorMessage(overtimeError);
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
