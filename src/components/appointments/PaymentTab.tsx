'use client';

/**
 * Payment Tab Component for Appointment Detail Page
 * 
 * Displays:
 * - List of invoices for the appointment
 * - Payment status for each invoice
 * - QR code for unpaid invoices
 * - Payment history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Receipt, QrCode, CheckCircle, Clock, AlertCircle, DollarSign, Copy, ExternalLink, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus, CreateInvoiceRequest, InvoiceItemDto } from '@/services/invoiceService';
import { paymentService, PaymentResponse } from '@/services/paymentService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceService } from '@/services/serviceService';
import { Service } from '@/types/service';

interface PaymentTabProps {
  appointmentId: number;
  appointmentCode: string;
  patientCode?: string; // Patient code (from appointment.patient.patientCode)
  patientId?: number; // Patient ID (if available)
  treatmentPlanId?: number;
  treatmentPlanCode?: string;
  appointmentServices?: Array<{
    serviceCode: string;
    serviceName: string;
  }>; // Services from appointment to validate invoice items
}

export default function PaymentTab({
  appointmentId,
  appointmentCode,
  patientCode,
  patientId,
  treatmentPlanId,
  treatmentPlanCode,
  appointmentServices = [],
}: PaymentTabProps) {
  const { hasPermission } = useAuth();
  const canCreateInvoice = hasPermission('CREATE_INVOICE');
  const canViewInvoice = hasPermission('VIEW_INVOICE_ALL') || hasPermission('VIEW_INVOICE_OWN');

  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsMap, setPaymentsMap] = useState<Record<number, PaymentResponse[]>>({});

  // Invoice creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemDto[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Fetch invoices for this appointment
  useEffect(() => {
    if (appointmentId && appointmentId > 0) {
      fetchInvoices();
    } else {
      console.warn('⚠️ PaymentTab: Invalid appointmentId:', appointmentId);
      setInvoices([]);
      setLoading(false);
    }
  }, [appointmentId, appointmentCode, appointmentServices]);

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

  // Load available services for invoice creation
  useEffect(() => {
    if (canCreateInvoice && showCreateForm) {
      loadAvailableServices();
    }
  }, [canCreateInvoice, showCreateForm]);

  // Auto-fill invoice items from appointment services when form opens
  useEffect(() => {
    if (showCreateForm && appointmentServices.length > 0 && availableServices.length > 0 && invoiceItems.length === 0) {
      autoFillItemsFromAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateForm, appointmentServices, availableServices]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoicesByAppointment(appointmentId);
      
      console.log('📋 Fetched invoices from BE:', {
        appointmentId,
        appointmentCode,
        appointmentServices: appointmentServices.map(s => s.serviceCode),
        totalInvoices: data.length,
        invoices: data.map(inv => ({
          invoiceCode: inv.invoiceCode,
          invoiceType: inv.invoiceType,
          appointmentId: inv.appointmentId,
          appointmentCode: inv.appointmentCode,
          itemsCount: inv.items?.length || 0,
          items: inv.items?.map(item => ({
            serviceCode: item.serviceCode,
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        })),
      });
      
      // Filter invoices: Only show APPOINTMENT type invoices that match this appointment
      // CRITICAL: BE must ensure data integrity - appointmentCode, patientId, and items must match
      const filteredInvoices = data.filter((invoice) => {
        // Only show APPOINTMENT type invoices
        if (invoice.invoiceType !== 'APPOINTMENT') {
          console.log(`❌ Filtered out invoice ${invoice.invoiceCode}: type is ${invoice.invoiceType}, not APPOINTMENT`);
          return false;
        }
        
        // CRITICAL: Validate appointmentId matches (primary check)
        if (invoice.appointmentId !== appointmentId) {
          console.error(`🚨 CRITICAL: Invoice ${invoice.invoiceCode} has different appointmentId: ${invoice.appointmentId} vs ${appointmentId}`);
          return false;
        }
        
        // Validate appointmentCode matches (BE should populate this correctly)
        if (invoice.appointmentCode && invoice.appointmentCode !== appointmentCode) {
          console.error(`🚨 CRITICAL: Invoice ${invoice.invoiceCode} has different appointmentCode: ${invoice.appointmentCode} vs ${appointmentCode}`);
          return false;
        }
        
        // CRITICAL: Validate patientId matches appointment patientId
        // This is a data integrity check - invoice patient must match appointment patient
        if (patientId && invoice.patientId !== patientId) {
          console.error(`🚨 CRITICAL DATA MISMATCH: Invoice ${invoice.invoiceCode} has patientId ${invoice.patientId} but appointment has patientId ${patientId}`);
          console.error(`   Invoice patientName: ${invoice.patientName}`);
          console.error(`   This indicates BE data integrity issue - invoice should be filtered out or fixed`);
          // Still show invoice but log error for BE team to investigate
          // TODO: After BE fix, we can filter this out
        }
        
        // Validate services if available (extra safety check)
        // Note: Invoice might have additional services added manually, so we only warn, not filter
        if (appointmentServices.length > 0 && invoice.items && invoice.items.length > 0) {
          const appointmentServiceCodes = new Set(appointmentServices.map(s => s.serviceCode));
          const invoiceServiceCodes = invoice.items
            .map(item => item.serviceCode)
            .filter(Boolean) as string[];
          
          // Check if invoice has services NOT in appointment
          const invalidServices = invoiceServiceCodes.filter(
            code => !appointmentServiceCodes.has(code)
          );
          
          if (invalidServices.length > 0) {
            console.warn(`⚠️ Invoice ${invoice.invoiceCode} has services not in appointment:`, {
              invalidServices,
              invoiceServices: invoiceServiceCodes,
              appointmentServices: Array.from(appointmentServiceCodes),
            });
            // Don't filter out - might be valid if admin added extra services manually
            // But log warning for BE team to investigate data integrity
          }
        }
        
        console.log(`✅ Invoice ${invoice.invoiceCode} passed filters`, {
          appointmentId: invoice.appointmentId,
          appointmentCode: invoice.appointmentCode,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
        });
        return true;
      });
      
      console.log('📊 Filtered invoices result:', {
        before: data.length,
        after: filteredInvoices.length,
        filtered: filteredInvoices.map(inv => inv.invoiceCode),
      });
      
      setInvoices(filteredInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (invoiceId: number) => {
    try {
      const data = await paymentService.getPaymentsByInvoice(invoiceId);
      setPaymentsMap((prev) => ({
        ...prev,
        [invoiceId]: data,
      }));
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      // Don't show toast for payments, just log
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

  // Load available services for invoice creation
  const loadAvailableServices = async () => {
    try {
      setLoadingServices(true);
      const services = await ServiceService.getAllServices();
      setAvailableServices(services);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  // Auto-fill invoice items from appointment services
  const autoFillItemsFromAppointment = () => {
    if (appointmentServices.length === 0 || availableServices.length === 0) {
      return;
    }

    const items: InvoiceItemDto[] = appointmentServices.map(aptService => {
      const service = availableServices.find(s => s.serviceCode === aptService.serviceCode);
      return {
        serviceId: service?.serviceId || 0,
        serviceCode: aptService.serviceCode,
        serviceName: aptService.serviceName,
        quantity: 1,
        unitPrice: service?.price || 0,
        notes: `Dịch vụ từ lịch hẹn ${appointmentCode}`,
      };
    }).filter(item => item.serviceId > 0); // Only include items where we found serviceId

    if (items.length > 0) {
      setInvoiceItems(items);
      toast.success(`Đã tự động điền ${items.length} dịch vụ từ lịch hẹn`);
    } else {
      // If no services found, add empty item
      setInvoiceItems([{ serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  // Handle invoice item changes
  const handleItemChange = (index: number, field: keyof InvoiceItemDto, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If service selected, auto-fill serviceName and unitPrice
    if (field === 'serviceId' && value) {
      const service = availableServices.find(s => s.serviceId === parseInt(value));
      if (service) {
        newItems[index].serviceName = service.serviceName;
        newItems[index].unitPrice = service.price;
        newItems[index].serviceCode = service.serviceCode;
      }
    }

    setInvoiceItems(newItems);
  };

  // Add new invoice item
  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }]);
  };

  // Remove invoice item
  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!patientId) {
      toast.error('Không có thông tin bệnh nhân');
      return;
    }

    // Validate items
    const validItems = invoiceItems.filter(
      item => item.serviceId > 0 && item.serviceName && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất một dịch vụ');
      return;
    }

    try {
      setCreatingInvoice(true);

      const request: CreateInvoiceRequest = {
        invoiceType: 'APPOINTMENT',
        patientId,
        appointmentId,
        items: validItems.map(item => ({
          serviceId: item.serviceId,
          serviceCode: item.serviceCode,
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
        notes: `Hóa đơn cho lịch hẹn ${appointmentCode}`,
      };

      const newInvoice = await invoiceService.createInvoice(request);
      toast.success('Tạo hóa đơn thành công!');
      
      // Refresh invoices list
      await fetchInvoices();
      
      // Close form and reset
      setShowCreateForm(false);
      setInvoiceItems([]);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo hóa đơn');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Copy payment code
  const copyPaymentCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã thanh toán');
  };

  // Refresh invoice after payment success
  const handlePaymentSuccess = async (invoiceCode: string) => {
    // Refresh all invoices
    await fetchInvoices();
    
    // Find and refresh payments for the updated invoice
    const invoice = invoices.find((inv) => inv.invoiceCode === invoiceCode);
    if (invoice?.invoiceId) {
      await fetchPayments(invoice.invoiceId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Thông Tin Thanh Toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Mã lịch hẹn</label>
              <p className="font-semibold">{appointmentCode}</p>
            </div>
            {patientId && (
              <div>
                <label className="text-sm text-gray-600">Patient ID</label>
                <p className="font-semibold">{patientId}</p>
              </div>
            )}
            {patientCode && (
              <div>
                <label className="text-sm text-gray-600">Patient Code</label>
                <p className="font-semibold">{patientCode}</p>
              </div>
            )}
            {treatmentPlanCode && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Mã kế hoạch điều trị</label>
                  <p className="font-semibold">{treatmentPlanCode}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Treatment Plan ID</label>
                  <p className="font-semibold">{treatmentPlanId}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Form */}
      {showCreateForm && canCreateInvoice && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Tạo Hóa Đơn Mới
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setInvoiceItems([]);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Hóa đơn sẽ được tạo cho lịch hẹn <strong>{appointmentCode}</strong>.
                {appointmentServices.length > 0 && (
                  <> Dịch vụ từ lịch hẹn đã được tự động điền vào form.</>
                )}
              </p>
            </div>

            {/* Invoice Items */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Chi tiết dịch vụ</Label>
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 border rounded-lg">
                  <div className="md:col-span-5">
                    <Label htmlFor={`service-${index}`}>Dịch vụ *</Label>
                    <Select
                      value={item.serviceId.toString()}
                      onValueChange={(value) => handleItemChange(index, 'serviceId', parseInt(value))}
                      disabled={creatingInvoice || loadingServices}
                    >
                      <SelectTrigger id={`service-${index}`}>
                        <SelectValue placeholder="Chọn dịch vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map(service => (
                          <SelectItem key={service.serviceId} value={service.serviceId.toString()}>
                            {service.serviceName} ({formatCurrency(service.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Số lượng *</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      disabled={creatingInvoice}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor={`price-${index}`}>Đơn giá (₫) *</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      disabled={creatingInvoice}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={invoiceItems.length === 1 || creatingInvoice}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={handleAddItem}
                disabled={creatingInvoice}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm dịch vụ
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleCreateInvoice}
                disabled={creatingInvoice || loadingServices}
                className="flex-1"
              >
                {creatingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Tạo hóa đơn
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setInvoiceItems([]);
                }}
                disabled={creatingInvoice}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      {invoices.length === 0 && !showCreateForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Chưa có hóa đơn nào cho lịch hẹn này</p>
            {canCreateInvoice && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo hóa đơn mới
              </Button>
            )}
            {!canCreateInvoice && (
              <p className="text-sm text-gray-500 mt-2">
                Vui lòng liên hệ admin/lễ tân để tạo hóa đơn
              </p>
            )}
          </CardContent>
        </Card>
      ) : invoices.length > 0 ? (
        <div className="space-y-4">
          {/* Create Invoice Button (if has invoices but can create more) */}
          {canCreateInvoice && !showCreateForm && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo hóa đơn mới
              </Button>
            </div>
          )}

          {invoices.map((invoice) => (
            <Card key={invoice.invoiceId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{invoice.invoiceCode}</CardTitle>
                    {getStatusBadge(invoice.paymentStatus)}
                    <Badge variant="outline">{getTypeLabel(invoice.invoiceType)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {invoice.appointmentCode && (
                    <div>
                      <label className="text-gray-600">Mã lịch hẹn:</label>
                      <p className="font-medium">{invoice.appointmentCode}</p>
                    </div>
                  )}
                  {invoice.treatmentPlanCode && (
                    <div>
                      <label className="text-gray-600">Mã kế hoạch điều trị:</label>
                      <p className="font-medium">{invoice.treatmentPlanCode}</p>
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
                      <label className="text-gray-600">Tạo bởi:</label>
                      <p className="font-medium">
                        {invoice.createdByName} - {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm text-gray-600">Tổng tiền</label>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Đã thanh toán</label>
                    <p className="text-xl font-semibold">{formatCurrency(invoice.paidAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Còn lại</label>
                    <p className="text-xl font-semibold text-orange-600">{formatCurrency(invoice.remainingDebt)}</p>
                  </div>
                </div>

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

                {/* Payment Code & QR */}
                {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && (
                  <div className="border-t pt-4 space-y-4">
                    {invoice.paymentCode && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Mã thanh toán</label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold">{invoice.paymentCode}</p>
                          <Button variant="ghost" size="sm" onClick={() => copyPaymentCode(invoice.paymentCode!)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* QR Code */}
                    {invoice.invoiceCode && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Mã QR Thanh Toán</label>
                        <div className="flex flex-col items-center gap-4">
                          <PaymentQRCode
                            invoiceCode={invoice.invoiceCode}
                            onPaymentSuccess={() => handlePaymentSuccess(invoice.invoiceCode)}
                          />

                          {invoice.qrCodeUrl && (
                            <div className="flex flex-col items-center gap-2">
                              <img
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
                      </div>
                    )}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

