'use client';

import React, { useState, useEffect, useRef } from 'react';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus } from '@/services/invoiceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentQRCodeProps {
  invoiceCode: string; // Changed from invoiceId to invoiceCode
  onPaymentSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Payment QR Code Component
 * Displays QR code for SePay payment and polls for payment status
 * 
 * Features:
 * - Displays QR code from invoice.qrCodeUrl
 * - Polls invoice status every 5 seconds
 * - Stops polling after 5 minutes or when payment confirmed
 * - Shows payment success/failure messages
 */
export default function PaymentQRCode({ invoiceCode, onPaymentSuccess, onClose }: PaymentQRCodeProps) {
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load invoice on mount
  useEffect(() => {
    loadInvoice();
  }, [invoiceCode]);

  // Auto-refresh QR code every 7 minutes
  useEffect(() => {
    // Only auto-refresh if invoice is not paid and has QR code
    if (invoice && invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'PARTIAL_PAID' && invoice.paymentStatus !== 'CANCELLED' && invoice.qrCodeUrl) {
      // Clear existing interval if any
      if (qrRefreshIntervalRef.current) {
        clearInterval(qrRefreshIntervalRef.current);
      }

      // Set interval to refresh QR code every 7 minutes
      qrRefreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing QR code after 7 minutes...');
        loadInvoice(true); // Silent refresh - don't show loading spinner
      }, 7 * 60 * 1000); // 7 minutes

      console.log('✅ Auto-refresh QR code timer started (7 minutes interval)');

      return () => {
        if (qrRefreshIntervalRef.current) {
          clearInterval(qrRefreshIntervalRef.current);
          qrRefreshIntervalRef.current = null;
          console.log('🛑 Auto-refresh QR code timer stopped');
        }
      };
    } else {
      // Stop auto-refresh if invoice is paid or no QR code
      if (qrRefreshIntervalRef.current) {
        clearInterval(qrRefreshIntervalRef.current);
        qrRefreshIntervalRef.current = null;
        console.log('🛑 Auto-refresh QR code timer stopped (invoice paid or no QR code)');
      }
    }
  }, [invoice?.paymentStatus, invoice?.qrCodeUrl, invoiceCode]); // Re-run when invoice payment status or QR code changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (qrRefreshIntervalRef.current) {
        clearInterval(qrRefreshIntervalRef.current);
      }
    };
  }, []);

  const loadInvoice = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const data = await invoiceService.getInvoiceByCode(invoiceCode);
      setInvoice(data);
      
      // Log QR code refresh (only if silent refresh, not initial load)
      if (silent && data.qrCodeUrl) {
        console.log('✅ QR code refreshed successfully');
      }
      
      // Start polling if invoice is not paid
      if (data.paymentStatus !== 'PAID' && data.paymentStatus !== 'CANCELLED') {
        startPolling();
      } else if (data.paymentStatus === 'PAID' || data.paymentStatus === 'PARTIAL_PAID') {
        // Already paid - stop auto-refresh
        if (qrRefreshIntervalRef.current) {
          clearInterval(qrRefreshIntervalRef.current);
          qrRefreshIntervalRef.current = null;
        }
        onPaymentSuccess?.();
      }
    } catch (err: any) {
      console.error('Load invoice error:', err);
      if (!silent) {
        setError(err.response?.data?.message || 'Không thể tải thông tin hóa đơn');
        toast.error('Không thể tải thông tin hóa đơn');
      } else {
        // Silent refresh failed - log but don't show error to user
        console.warn('⚠️ Silent QR code refresh failed:', err.response?.data?.message || err.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }

    setPolling(true);
    startTimeRef.current = Date.now();

    // Set timeout for 5 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setTimeoutReached(true);
      toast.warning('Đã hết thời gian chờ thanh toán. Vui lòng thử lại.');
    }, 5 * 60 * 1000); // 5 minutes

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updated = await invoiceService.getInvoiceByCode(invoiceCode);
        setInvoice(updated);

        // Check if payment is confirmed
        if (updated.paymentStatus === 'PAID' || updated.paymentStatus === 'PARTIAL_PAID') {
          stopPolling();
          toast.success('Thanh toán thành công!');
          onPaymentSuccess?.();
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        // Don't show error toast for polling errors, just log
      }
    }, 5000); // 5 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPolling(false);
  };

  const handleRefresh = () => {
    stopPolling();
    setTimeoutReached(false);
    loadInvoice();
  };

  const getStatusColor = (status: InvoicePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600';
      case 'PARTIAL_PAID':
        return 'text-yellow-600';
      case 'PENDING_PAYMENT':
        return 'text-red-600';
      case 'CANCELLED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: InvoicePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PARTIAL_PAID':
        return 'Thanh toán một phần';
      case 'PENDING_PAYMENT':
        return 'Chưa thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading && !invoice) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#8b5fbf]" />
        </CardContent>
      </Card>
    );
  }

  if (error && !invoice) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-center text-red-600">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return null;
  }

  const isPaid = invoice.paymentStatus === 'PAID' || invoice.paymentStatus === 'PARTIAL_PAID';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin thanh toán</CardTitle>
        <CardDescription>
          Quét mã QR bằng ứng dụng ngân hàng để thanh toán
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mã thanh toán:</span>
            <span className="font-mono font-semibold text-[#8b5fbf]">{invoice.paymentCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tổng tiền:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(invoice.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã thanh toán:</span>
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(invoice.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Còn lại:</span>
            <span className={`font-semibold ${getStatusColor(invoice.paymentStatus)}`}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(invoice.remainingDebt)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <span className={`font-semibold ${getStatusColor(invoice.paymentStatus)}`}>
              {getStatusText(invoice.paymentStatus)}
            </span>
          </div>
        </div>

        {/* QR Code */}
        {invoice.qrCodeUrl && !isPaid && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <img
                src={invoice.qrCodeUrl}
                alt="Payment QR Code"
                className="w-64 h-64"
                onError={(e) => {
                  console.error('QR code image error');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 max-w-xs">
              Mở ứng dụng ngân hàng, quét mã QR và nhập mã thanh toán <strong>{invoice.paymentCode}</strong> vào nội dung chuyển khoản
            </p>
          </div>
        )}

        {/* Payment Success */}
        {isPaid && (
          <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-green-800">Thanh toán thành công!</p>
              <p className="text-sm text-green-600 mt-2">
                Hóa đơn đã được thanh toán. Cảm ơn bạn!
              </p>
            </div>
          </div>
        )}

        {/* Polling Status */}
        {polling && !isPaid && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang kiểm tra thanh toán...</span>
          </div>
        )}

        {/* Timeout Message */}
        {timeoutReached && !isPaid && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 text-center">
              Đã hết thời gian chờ thanh toán. Vui lòng thử lại hoặc liên hệ lễ tân.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isPaid && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Đóng
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

