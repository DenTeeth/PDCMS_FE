'use client';

/**
 * Payment Tab Component for Treatment Plan Detail Page
 * 
 * Displays:
 * - List of invoices for the treatment plan
 * - Payment status for each invoice
 * - QR code for unpaid invoices
 * - Payment history
 * - Phase/Installment information
 * - Services in each phase
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt, QrCode, CheckCircle, Clock, AlertCircle, DollarSign, Copy, Plus, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus } from '@/services/invoiceService';
import { paymentService, PaymentResponse } from '@/services/paymentService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import { useAuth } from '@/contexts/AuthContext';
import { TreatmentPlanDetailResponse } from '@/types/treatmentPlan';
import { patientService } from '@/services/patientService';

interface TreatmentPlanPaymentTabProps {
  treatmentPlanId: number;
  treatmentPlanCode: string;
  patientId?: number; // Optional: sẽ tự lấy từ patientCode nếu không có
  patientCode: string; // Required: để lấy patientId
  plan?: TreatmentPlanDetailResponse; // Optional: để hiển thị phase info
}

export default function TreatmentPlanPaymentTab({
  treatmentPlanId,
  treatmentPlanCode,
  patientId,
  patientCode,
  plan,
}: TreatmentPlanPaymentTabProps) {
  const { hasPermission } = useAuth();
  const canViewInvoice = hasPermission('VIEW_INVOICE_ALL') || hasPermission('VIEW_INVOICE_OWN');

  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsMap, setPaymentsMap] = useState<Record<number, PaymentResponse[]>>({});
  const [actualPatientId, setActualPatientId] = useState<number | null>(null);

  // Get patientId from patientCode if not provided
  useEffect(() => {
    const loadPatientId = async () => {
      if (patientId) {
        setActualPatientId(patientId);
        return;
      }

      if (patientCode) {
        try {
          const patient = await patientService.getPatientByCode(patientCode);
          setActualPatientId(patient.patientId);
        } catch (error: any) {
          console.error('Error loading patient:', error);
          toast.error('Không thể tải thông tin bệnh nhân');
          setActualPatientId(null);
        }
      }
    };

    loadPatientId();
  }, [patientId, patientCode]);

  // Fetch invoices for this treatment plan
  useEffect(() => {
    if (treatmentPlanId && treatmentPlanId > 0 && actualPatientId && actualPatientId > 0) {
      fetchInvoices();
    } else if (actualPatientId === null) {
      // Still loading patientId
      setLoading(true);
    } else {
      console.warn('⚠️ TreatmentPlanPaymentTab: Invalid treatmentPlanId or patientId:', { treatmentPlanId, actualPatientId });
      setInvoices([]);
      setLoading(false);
    }
  }, [treatmentPlanId, treatmentPlanCode, actualPatientId]);

  // Fetch payments for each invoice
  useEffect(() => {
    if (invoices.length > 0) {
      invoices.forEach((invoice) => {
        if (invoice.invoiceId && !paymentsMap[invoice.invoiceId]) {
          fetchPayments(invoice.invoiceId);
        }
      });
    }
  }, [invoices]);

  const fetchInvoices = async () => {
    if (!actualPatientId) return;
    
    try {
      setLoading(true);
      // Fetch all invoices for patient, then filter by treatmentPlanId
      const allInvoices = await invoiceService.getInvoicesByPatient(actualPatientId);
      
      // Filter invoices for this treatment plan
      // Include both TREATMENT_PLAN and SUPPLEMENTAL invoices (SUPPLEMENTAL invoices are created when items are added to PAID/PARTIAL_PAID plans)
      const planInvoices = allInvoices.filter(
        (inv) => 
          (inv.invoiceType === 'TREATMENT_PLAN' || inv.invoiceType === 'SUPPLEMENTAL') && 
          inv.treatmentPlanId === treatmentPlanId
      );

      // Additional validation: check treatmentPlanCode matches
      const validatedInvoices = planInvoices.filter((inv) => {
        if (inv.treatmentPlanCode && inv.treatmentPlanCode !== treatmentPlanCode) {
          console.warn(`⚠️ Invoice ${inv.invoiceCode} has mismatched treatmentPlanCode: expected ${treatmentPlanCode}, got ${inv.treatmentPlanCode}`);
          return false;
        }
        return true;
      });

      // Sort invoices by creation date (newest first) to show updated invoices at the top
      const sortedInvoices = validatedInvoices.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setInvoices(sortedInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (invoiceId: number) => {
    try {
      const data = await paymentService.getPaymentsByInvoice(invoiceId);
      setPaymentsMap((prev) => ({ ...prev, [invoiceId]: data }));
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    }
  };

  const handlePaymentSuccess = async (invoiceCode: string) => {
    // Refresh invoice data
    await fetchInvoices();
    toast.success('Thanh toán thành công!');
  };

  const copyPaymentCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã thanh toán');
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

  // Get phase info for invoice
  const getPhaseInfo = (invoice: InvoiceResponse) => {
    if (invoice.phaseNumber) {
      const phase = plan?.phases.find((p) => p.phaseNumber === invoice.phaseNumber);
      if (phase) {
        return {
          phaseNumber: invoice.phaseNumber,
          phaseName: phase.phaseName,
          items: phase.items,
        };
      }
    }
    return null;
  };

  if (!canViewInvoice) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Bạn không có quyền xem hóa đơn</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải hóa đơn...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Hóa đơn thanh toán</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvoices}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Chưa có hóa đơn nào cho kế hoạch điều trị này</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const phaseInfo = getPhaseInfo(invoice);
            
            return (
              <Card key={invoice.invoiceId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{invoice.invoiceCode}</CardTitle>
                      {getStatusBadge(invoice.paymentStatus)}
                      {invoice.invoiceType === 'SUPPLEMENTAL' ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                          Hóa đơn bổ sung
                        </Badge>
                      ) : (
                        <Badge variant="outline">Kế hoạch điều trị</Badge>
                      )}
                      {invoice.phaseNumber && (
                        <Badge variant="outline" className="bg-blue-50">
                          Giai đoạn {invoice.phaseNumber}
                        </Badge>
                      )}
                      {invoice.installmentNumber && (
                        <Badge variant="outline" className="bg-purple-50">
                          Đợt {invoice.installmentNumber}
                        </Badge>
                      )}
                      {/* Show indicator if invoice was updated (has notes about update) */}
                      {invoice.notes && invoice.notes.includes('Đã cập nhật: Thêm') && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Đã cập nhật
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Invoice Information */}
                    <div className="space-y-4">
                      {/* Invoice Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {invoice.treatmentPlanCode && (
                          <div>
                            <label className="text-gray-600">Mã kế hoạch điều trị:</label>
                            <p className="font-medium">{invoice.treatmentPlanCode}</p>
                          </div>
                        )}
                        {phaseInfo && (
                          <div>
                            <label className="text-gray-600">Giai đoạn:</label>
                            <p className="font-medium">{phaseInfo.phaseName} (Giai đoạn {phaseInfo.phaseNumber})</p>
                          </div>
                        )}
                        {invoice.patientName && (
                          <div>
                            <label className="text-gray-600">Bệnh nhân:</label>
                            <p className="font-medium">{invoice.patientName}</p>
                          </div>
                        )}
                        {invoice.createdByName && invoice.createdAt && (
                          <div>
                            <label className="text-gray-600">Bác sĩ phụ trách:</label>
                            <p className="font-medium">
                              {invoice.createdByName} - {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                        )}
                        {/* Show update info if invoice was updated */}
                        {invoice.notes && invoice.notes.includes('Đã cập nhật: Thêm') && (
                          <div className="col-span-2">
                            <label className="text-gray-600">Thông tin cập nhật:</label>
                            <p className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                              {invoice.notes.split('|').find(n => n.includes('Đã cập nhật')) || invoice.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Financial Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm text-gray-600">Tổng tiền</label>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                      </div>

                      {/* Phase Services (if phase info available) */}
                      {phaseInfo && phaseInfo.items.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Dịch vụ trong giai đoạn {phaseInfo.phaseNumber}:
                          </label>
                          <div className="space-y-2">
                            {phaseInfo.items.map((item) => (
                              <div key={item.itemId} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.itemName}</p>
                                  {item.serviceCode && (
                                    <p className="text-xs text-gray-500">Mã: {item.serviceCode}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invoice Items */}
                      {invoice.items && invoice.items.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Chi tiết dịch vụ</label>
                          <div className="space-y-2">
                            {invoice.items.map((item, index) => (
                              <div key={item.itemId || index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.serviceName}</p>
                                  {item.serviceCode && (
                                    <p className="text-xs text-gray-500">Mã: {item.serviceCode}</p>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-gray-400 italic">{item.notes}</p>
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
                        </div>
                      )}

                      {/* Payment Code */}
                      {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && invoice.paymentCode && (
                        <div className="border-t pt-4">
                          <label className="text-sm font-medium mb-2 block">Mã thanh toán</label>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-semibold">{invoice.paymentCode}</p>
                            <Button variant="ghost" size="sm" onClick={() => copyPaymentCode(invoice.paymentCode!)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Payment History */}
                      {paymentsMap[invoice.invoiceId!] && paymentsMap[invoice.invoiceId!].length > 0 && (
                        <div className="border-t pt-4">
                          <label className="text-sm font-medium mb-2 block">Lịch sử thanh toán</label>
                          <div className="space-y-2">
                            {paymentsMap[invoice.invoiceId!].map((payment) => (
                              <div key={payment.paymentId} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="text-sm font-medium">{payment.paymentCode}</p>
                                  <p className="text-xs text-gray-500">
                                    {payment.paymentMethod} • {payment.paymentDate && format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                </div>
                                <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Created Date */}
                      {invoice.createdAt && (
                        <div className="text-sm text-gray-500 border-t pt-2">
                          Tạo lúc: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </div>

                    {/* Right Column: QR Code Payment */}
                    {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && invoice.invoiceCode && (
                      <div className="lg:border-l lg:pl-6">
                        <div className="sticky top-4">
                          <div className="space-y-4">
                            <div>
                              <PaymentQRCode
                                invoiceCode={invoice.invoiceCode}
                                onPaymentSuccess={() => handlePaymentSuccess(invoice.invoiceCode!)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

