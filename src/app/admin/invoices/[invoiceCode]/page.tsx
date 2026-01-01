'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ArrowLeft,
  Loader2,
  FileText,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  QrCode,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus } from '@/services/invoiceService';
import { paymentService, PaymentResponse } from '@/services/paymentService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import Image from 'next/image';

// ==================== MAIN COMPONENT ====================
export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceCode = params?.invoiceCode as string;

  // State management
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (invoiceCode) {
      fetchInvoice();
    }
  }, [invoiceCode]);

  useEffect(() => {
    if (invoice?.invoiceId) {
      fetchPayments();
    }
  }, [invoice?.invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceByCode(invoiceCode);
      setInvoice(data);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết hóa đơn');
      router.push('/admin/invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!invoice?.invoiceId) return;

    try {
      setLoadingPayments(true);
      const data = await paymentService.getPaymentsByInvoice(invoice.invoiceId);
      setPayments(data);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error('Không thể tải lịch sử thanh toán');
    } finally {
      setLoadingPayments(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: InvoicePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã thanh toán
          </Badge>
        );
      case 'PARTIAL_PAID':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Thanh toán một phần
          </Badge>
        );
      case 'PENDING_PAYMENT':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chờ thanh toán
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return 'Lịch hẹn';
      case 'TREATMENT_PLAN':
        return 'Kế hoạch điều trị';
      case 'SUPPLEMENTAL':
        return 'Bổ sung';
      default:
        return type;
    }
  };

  // Copy payment code
  const copyPaymentCode = () => {
    if (invoice?.paymentCode) {
      navigator.clipboard.writeText(invoice.paymentCode);
      toast.success('Đã sao chép mã thanh toán');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_INVOICE_ALL']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Receipt className="h-8 w-8" />
                {invoice.invoiceCode}
              </h1>
              <p className="text-gray-600 mt-1">Chi tiết hóa đơn</p>
            </div>
          </div>
          {getStatusBadge(invoice.paymentStatus)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Mã hóa đơn</label>
                    <p className="font-semibold">{invoice.invoiceCode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Loại hóa đơn</label>
                    <p className="font-semibold">{getTypeLabel(invoice.invoiceType)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Bệnh nhân</label>
                    <p className="font-semibold">{invoice.patientName || `ID: ${invoice.patientId}`}</p>
                  </div>
                  {invoice.appointmentCode && (
                    <div>
                      <label className="text-sm text-gray-600">Lịch hẹn</label>
                      <p className="font-semibold">{invoice.appointmentCode}</p>
                    </div>
                  )}
                  {invoice.treatmentPlanCode && (
                    <div>
                      <label className="text-sm text-gray-600">Kế hoạch điều trị</label>
                      <p className="font-semibold">{invoice.treatmentPlanCode}</p>
                    </div>
                  )}
                  {invoice.createdAt && (
                    <div>
                      <label className="text-sm text-gray-600">Ngày tạo</label>
                      <p className="font-semibold">{format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  )}
                  {invoice.createdByName && (
                    <div>
                      <label className="text-sm text-gray-600">Người tạo</label>
                      <p className="font-semibold">{invoice.createdByName}</p>
                    </div>
                  )}
                </div>

                {invoice.notes && (
                  <div>
                    <label className="text-sm text-gray-600">Ghi chú</label>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items */}
            {invoice.items && invoice.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Chi Tiết Dịch Vụ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invoice.items.map((item, index) => (
                      <div key={item.itemId || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.serviceName}</p>
                          {item.serviceCode && (
                            <p className="text-sm text-gray-500">Mã: {item.serviceCode}</p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-gray-500">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                          <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Lịch Sử Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có thanh toán nào</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.paymentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.paymentCode}</p>
                          <p className="text-sm text-gray-500">
                            {payment.paymentMethod} • {payment.paymentDate && format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm')}
                          </p>
                          {payment.createdByName && (
                            <p className="text-sm text-gray-500">Người tạo: {payment.createdByName}</p>
                          )}
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payment Info & QR Code */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Tổng tiền</label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(invoice.totalAmount)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Đã thanh toán</label>
                  <p className="text-xl font-semibold">{formatCurrency(invoice.paidAmount)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Còn lại</label>
                  <p className="text-xl font-semibold text-orange-600">{formatCurrency(invoice.remainingDebt)}</p>
                </div>

                {invoice.paymentCode && (
                  <div>
                    <label className="text-sm text-gray-600">Mã thanh toán</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono font-semibold">{invoice.paymentCode}</p>
                      <Button variant="ghost" size="sm" onClick={copyPaymentCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {invoice.dueDate && (
                  <div>
                    <label className="text-sm text-gray-600">Hạn thanh toán</label>
                    <p className="font-semibold">{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && invoice.qrCodeUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Mã QR Thanh Toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice.paymentCode && (
                      <PaymentQRCode
                        invoiceCode={invoice.invoiceCode}
                        onPaymentSuccess={() => {
                          fetchInvoice();
                          fetchPayments();
                        }}
                      />
                    )}

                    {invoice.qrCodeUrl && (
                      <div className="flex flex-col items-center gap-2">
                        <Image
                          src={invoice.qrCodeUrl}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="border rounded-lg"
                        />
                        <p className="text-sm text-gray-600 text-center">
                          Quét mã QR để thanh toán
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

