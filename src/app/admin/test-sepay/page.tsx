'use client';

/**
 * SePay Payment Test Page
 * 
 * Trang test để kiểm tra tích hợp SePay payment system
 * 
 * Features:
 * - Tạo invoice với invoiceType, patientId, và items
 * - Hiển thị QR code từ invoice
 * - Polling payment status
 * - Test payment flow end-to-end
 * 
 * Based on: docs/files/payment/controller/InvoiceController.java
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, QrCode, Receipt, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import { invoiceService, InvoiceResponse, InvoiceType, CreateInvoiceRequest, InvoiceItemDto } from '@/services/invoiceService';
import { ServiceService } from '@/services/serviceService';
import { Service } from '@/types/service';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentDetailDTO } from '@/types/appointment';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import { toast } from 'sonner';

export default function SePayTestPage() {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('APPOINTMENT');
  const [patientId, setPatientId] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [treatmentPlanId, setTreatmentPlanId] = useState<string>('');
  const [phaseNumber, setPhaseNumber] = useState<string>('');
  const [installmentNumber, setInstallmentNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Invoice items
  const [items, setItems] = useState<InvoiceItemDto[]>([
    { serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }
  ]);
  
  // Services for selection
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Appointment data
  const [appointment, setAppointment] = useState<AppointmentDetailDTO | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Load appointment when appointmentId changes
  useEffect(() => {
    if (appointmentId && invoiceType === 'APPOINTMENT') {
      loadAppointmentById(parseInt(appointmentId));
    } else {
      setAppointment(null);
      // Clear items if appointment is cleared
      if (!appointmentId) {
        setItems([{ serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [appointmentId, invoiceType]);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const data = await ServiceService.getServices({ isActive: 'true', size: 1000 });
      setServices(data.content || []);
    } catch (err) {
      console.error('Load services error:', err);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadAppointmentById = async (appointmentId: number) => {
    try {
      setLoadingAppointment(true);
      // Get appointment by ID
      const appointmentData = await appointmentService.getAppointmentById(appointmentId);
      
      // Check if appointment has code field (could be appointmentCode or code)
      const appointmentCode = (appointmentData as any)?.appointmentCode || (appointmentData as any)?.code;
      
      if (appointmentCode) {
        // Get full detail using appointment code
        const detail = await appointmentService.getAppointmentDetail(appointmentCode);
        setAppointment(detail);
        
        // Auto-fill items from appointment services
        if (detail.services && detail.services.length > 0 && services.length > 0) {
          const appointmentItems: InvoiceItemDto[] = detail.services.map(aptService => {
            // Find service in services list by serviceCode
            const service = services.find(s => s.serviceCode === aptService.serviceCode);
            return {
              serviceId: service?.serviceId || 0,
              serviceCode: aptService.serviceCode,
              serviceName: aptService.serviceName,
              quantity: 1,
              unitPrice: service?.price || 0,
            };
          }).filter(item => item.serviceId > 0); // Only include items where we found serviceId
          
          if (appointmentItems.length > 0) {
            setItems(appointmentItems);
            toast.success(`Đã tải ${appointmentItems.length} dịch vụ từ appointment`);
          } else {
            toast.warning('Không tìm thấy dịch vụ tương ứng trong danh sách dịch vụ');
          }
        } else if (detail.services && detail.services.length > 0) {
          // Services not loaded yet, wait for them
          toast.info('Đang chờ danh sách dịch vụ...');
        }
      } else {
        setAppointment(null);
        toast.error('Appointment không có mã code');
      }
    } catch (err: any) {
      console.error('Load appointment error:', err);
      const errorMsg = err.response?.data?.message || 'Không thể tải thông tin appointment';
      toast.error(errorMsg);
      setAppointment(null);
    } finally {
      setLoadingAppointment(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemDto, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If service selected, auto-fill serviceName and unitPrice
    if (field === 'serviceId' && value) {
      const service = services.find(s => s.serviceId === parseInt(value));
      if (service) {
        newItems[index].serviceName = service.serviceName;
        newItems[index].unitPrice = service.price;
        newItems[index].serviceCode = service.serviceCode;
      }
    }
    
    setItems(newItems);
  };

  const handleCreateInvoice = async () => {
    if (!patientId) {
      toast.error('Vui lòng nhập Patient ID');
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.serviceId > 0 && item.serviceName && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất một dịch vụ');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setInvoice(null);

      const request: CreateInvoiceRequest = {
        invoiceType,
        patientId: parseInt(patientId),
        items: validItems.map(item => ({
          serviceId: item.serviceId,
          serviceCode: item.serviceCode,
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
      };

      if (appointmentId) {
        request.appointmentId = parseInt(appointmentId);
      }

      if (treatmentPlanId) {
        request.treatmentPlanId = parseInt(treatmentPlanId);
      }

      if (phaseNumber) {
        request.phaseNumber = parseInt(phaseNumber);
      }

      if (installmentNumber) {
        request.installmentNumber = parseInt(installmentNumber);
      }

      if (notes) {
        request.notes = notes;
      }

      console.log('📝 Creating invoice with request:', request);

      const data = await invoiceService.createInvoice(request);
      setInvoice(data);
      toast.success('Tạo hóa đơn thành công!');
    } catch (err: any) {
      console.error('Create invoice error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo hóa đơn';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Thanh toán thành công!');
    // Reload invoice to get updated status
    if (invoice?.invoiceCode) {
      invoiceService.getInvoiceByCode(invoice.invoiceCode).then(setInvoice).catch(console.error);
    }
  };

  const handleReset = () => {
    setInvoice(null);
    setError(null);
    setInvoiceType('APPOINTMENT');
    setPatientId('');
    setAppointmentId('');
    setTreatmentPlanId('');
    setPhaseNumber('');
    setInstallmentNumber('');
    setNotes('');
    setItems([{ serviceId: 0, serviceName: '', quantity: 1, unitPrice: 0 }]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Test SePay Payment Integration</h1>
        <p className="text-muted-foreground mt-1">
          Trang test để kiểm tra tích hợp SePay payment system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Create Invoice Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="mr-2 h-5 w-5" />
              Tạo Hóa Đơn
            </CardTitle>
            <CardDescription>
              Tạo invoice mới để test SePay payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invoice Type */}
            <div>
              <Label htmlFor="invoiceType">
                Loại Hóa Đơn <span className="text-red-500">*</span>
              </Label>
              <Select
                value={invoiceType}
                onValueChange={(value) => setInvoiceType(value as InvoiceType)}
                disabled={creating || !!invoice}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPOINTMENT">APPOINTMENT - Hóa đơn cho appointment</SelectItem>
                  <SelectItem value="TREATMENT_PLAN">TREATMENT_PLAN - Hóa đơn cho kế hoạch điều trị</SelectItem>
                  <SelectItem value="SUPPLEMENTAL">SUPPLEMENTAL - Hóa đơn phát sinh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Patient ID */}
            <div>
              <Label htmlFor="patientId">
                Patient ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patientId"
                type="number"
                placeholder="Nhập Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={creating || !!invoice}
              />
            </div>

            {/* Appointment ID (for APPOINTMENT type) */}
            {invoiceType === 'APPOINTMENT' && (
              <div>
                <Label htmlFor="appointmentId">
                  Appointment ID (Optional)
                  {loadingAppointment && <Loader2 className="h-3 w-3 ml-2 inline animate-spin" />}
                </Label>
                <Input
                  id="appointmentId"
                  type="number"
                  placeholder="Nhập Appointment ID để tự động load dịch vụ"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  disabled={creating || !!invoice || loadingAppointment}
                />
                {appointment && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Đã load {appointment.services?.length || 0} dịch vụ từ appointment: {appointment.appointmentCode}
                  </p>
                )}
              </div>
            )}

            {/* Treatment Plan ID (for TREATMENT_PLAN type) */}
            {invoiceType === 'TREATMENT_PLAN' && (
              <>
                <div>
                  <Label htmlFor="treatmentPlanId">Treatment Plan ID (Optional)</Label>
                  <Input
                    id="treatmentPlanId"
                    type="number"
                    placeholder="Nhập Treatment Plan ID"
                    value={treatmentPlanId}
                    onChange={(e) => setTreatmentPlanId(e.target.value)}
                    disabled={creating || !!invoice}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="phaseNumber">Phase Number (Optional)</Label>
                    <Input
                      id="phaseNumber"
                      type="number"
                      placeholder="Phase"
                      value={phaseNumber}
                      onChange={(e) => setPhaseNumber(e.target.value)}
                      disabled={creating || !!invoice}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installmentNumber">Installment Number (Optional)</Label>
                    <Input
                      id="installmentNumber"
                      type="number"
                      placeholder="Installment"
                      value={installmentNumber}
                      onChange={(e) => setInstallmentNumber(e.target.value)}
                      disabled={creating || !!invoice}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Dịch Vụ <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={creating || !!invoice}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Dịch vụ #{index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          disabled={creating || !!invoice}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Dịch vụ</Label>
                      <Select
                        value={item.serviceId.toString()}
                        onValueChange={(value) => handleItemChange(index, 'serviceId', parseInt(value))}
                        disabled={creating || !!invoice || loadingServices}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn dịch vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.serviceId} value={service.serviceId.toString()}>
                              {service.serviceName} - {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(service.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Số lượng</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          disabled={creating || !!invoice}
                        />
                      </div>
                      <div>
                        <Label>Đơn giá (VND)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={creating || !!invoice}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Ghi chú (Optional)</Label>
                      <Input
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        placeholder="Ghi chú cho dịch vụ này"
                        disabled={creating || !!invoice}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Ghi chú (Optional)</Label>
              <Input
                id="notes"
                placeholder="Ghi chú cho hóa đơn"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={creating || !!invoice}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!invoice ? (
                <Button
                  onClick={handleCreateInvoice}
                  disabled={creating || !patientId}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Tạo Hóa Đơn
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Tạo Hóa Đơn Mới
                </Button>
              )}
            </div>

            {/* Invoice Info */}
            {invoice && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <h3 className="font-semibold text-blue-900">Thông tin Hóa Đơn:</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Invoice Code:</span>
                    <span className="font-mono font-semibold">{invoice.invoiceCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Payment Code:</span>
                    <span className="font-mono font-semibold text-[#8b5fbf]">
                      {invoice.paymentCode || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tổng tiền:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(invoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Trạng thái:</span>
                    <span
                      className={`font-semibold ${
                        invoice.paymentStatus === 'PAID'
                          ? 'text-green-600'
                          : invoice.paymentStatus === 'PARTIAL_PAID'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {invoice.paymentStatus === 'PAID'
                        ? 'Đã thanh toán'
                        : invoice.paymentStatus === 'PARTIAL_PAID'
                        ? 'Thanh toán một phần'
                        : invoice.paymentStatus === 'CANCELLED'
                        ? 'Đã hủy'
                        : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Payment QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Thanh Toán
            </CardTitle>
            <CardDescription>
              Quét mã QR để thanh toán qua SePay
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoice && invoice.invoiceCode ? (
              <PaymentQRCode
                invoiceCode={invoice.invoiceCode}
                onPaymentSuccess={handlePaymentSuccess}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <QrCode className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Tạo hóa đơn để hiển thị mã QR thanh toán
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Tạo Hóa Đơn:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Chọn loại hóa đơn (APPOINTMENT, TREATMENT_PLAN, hoặc SUPPLEMENTAL)</li>
              <li>Nhập Patient ID (bắt buộc)</li>
              <li>Thêm ít nhất một dịch vụ với số lượng và đơn giá</li>
              <li>Nhập Appointment ID hoặc Treatment Plan ID (tùy chọn)</li>
              <li>Click "Tạo Hóa Đơn"</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">2. Thanh Toán:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Mã QR sẽ tự động hiển thị sau khi tạo hóa đơn</li>
              <li>Quét mã QR bằng ứng dụng ngân hàng</li>
              <li>Nhập mã thanh toán vào nội dung chuyển khoản</li>
              <li>Chuyển khoản với số tiền đúng</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">3. Kiểm Tra Thanh Toán:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Hệ thống tự động polling mỗi 5 giây</li>
              <li>Khi thanh toán thành công, trạng thái sẽ tự động cập nhật</li>
              <li>Thời gian chờ tối đa: 5 phút</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> Đảm bảo SePay webhook đã được cấu hình đúng trong BE.
              Payment code phải được nhập vào nội dung chuyển khoản để hệ thống nhận diện.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
