'use client';

import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface ApiErrorHandlerOptions {
  showToast?: boolean;
  on403Error?: () => void;
  onOtherError?: (error: AxiosError) => void;
}

export function useApiErrorHandler(options: ApiErrorHandlerOptions = {}) {
  const [is403Error, setIs403Error] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleError = useCallback((error: AxiosError, customMessage?: string) => {
    console.error('API Error:', error);

    if (error.response?.status === 403) {
      setIs403Error(true);
      setErrorMessage(customMessage || 'Bạn không có quyền truy cập tính năng này.');
      
      if (options.showToast !== false) {
        toast.error('Không có quyền truy cập', {
          description: 'Tài khoản của bạn chưa được cấp quyền để thực hiện thao tác này.',
          duration: 5000,
        });
      }

      if (options.on403Error) {
        options.on403Error();
      }
    } else {
      const message = customMessage || 
        error.response?.data?.message || 
        error.message || 
        'Đã xảy ra lỗi không mong muốn.';
      
      setErrorMessage(message);
      
      if (options.showToast !== false) {
        toast.error('Lỗi', {
          description: message,
          duration: 5000,
        });
      }

      if (options.onOtherError) {
        options.onOtherError(error);
      }
    }
  }, [options]);

  const clearError = useCallback(() => {
    setIs403Error(false);
    setErrorMessage('');
  }, []);

  const reset = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    is403Error,
    errorMessage,
    handleError,
    clearError,
    reset,
  };
}
