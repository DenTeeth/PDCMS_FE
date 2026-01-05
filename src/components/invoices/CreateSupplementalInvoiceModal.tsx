'use client';

/**
 * Create Supplemental Invoice Modal
 * 
 * Form để tạo hóa đơn bổ sung (supplemental invoice)
 * Không cần appointmentId hoặc treatmentPlanId
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, XCircle } from 'lucide-react';
import { invoiceService, CreateInvoiceRequest, InvoiceItemDto } from '@/services/invoiceService';
import { ServiceService } from '@/services/serviceService';
import { Service } from '@/types/service';
import { patientService } from '@/services/patientService';
import { Patient } from '@/types/patient';
import { formatCurrency } from '@/utils/formatters';

interface CreateSupplementalInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSupplementalInvoiceModal({
  open,
  onClose,
  onSuccess,
}: CreateSupplementalInvoiceModalProps) {
  const [creating, setCreating] = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientCode, setPatientCode] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemDto[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [notes, setNotes] = useState<string>('');

  // Load patients when modal opens
  useEffect(() => {
    if (open) {
      loadPatients();
      loadServices();
      // Reset form
      setPatientId(null);
      setPatientCode('');
      setInvoiceItems([]);
      setNotes('');
      setPatientSearch('');
    }
  }, [open]);

  // Load services when modal opens
  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await ServiceService.getServices({});
      setAvailableServices(response.content || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  // Load patients
  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await patientService.getPatients({
        page: 0,
        size: 100,
        searchTerm: patientSearch || undefined,
      });
      setPatients(response.content || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error('Không thể tải danh sách bệnh nhân');
    } finally {
      setLoadingPatients(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (selectedPatientCode: string) => {
    const patient = patients.find(p => p.patientCode === selectedPatientCode);
    if (patient) {
      setPatientCode(selectedPatientCode);
      setPatientId(patient.patientId);
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
  const handleCreate = async () => {
    if (!patientId) {
      toast.error('Vui lòng chọn bệnh nhân');
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
      setCreating(true);

      const request: CreateInvoiceRequest = {
        invoiceType: 'SUPPLEMENTAL',
        patientId: patientId,
        items: validItems.map(item => ({
          serviceId: item.serviceId,
          serviceCode: item.serviceCode,
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
        notes: notes.trim() || `Hóa đơn bổ sung cho bệnh nhân ${patientCode}`,
      };

      await invoiceService.createInvoice(request);
      toast.success('Tạo hóa đơn bổ sung thành công!');
      
      // Reset form
      setPatientId(null);
      setPatientCode('');
      setInvoiceItems([]);
      setNotes('');
      
      // Close modal and refresh
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo hóa đơn');
    } finally {
      setCreating(false);
    }
  };

  // Calculate total
  const totalAmount = invoiceItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn bổ sung</DialogTitle>
          <DialogDescription>
            Tạo hóa đơn cho các chi phí phát sinh không liên quan đến lịch hẹn hoặc kế hoạch điều trị
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Bệnh nhân *</Label>
            <Select
              value={patientCode}
              onValueChange={handlePatientSelect}
              disabled={creating || loadingPatients}
            >
              <SelectTrigger id="patient">
                <SelectValue placeholder="Chọn bệnh nhân" />
              </SelectTrigger>
              <SelectContent>
                {loadingPatients ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Không tìm thấy bệnh nhân
                  </div>
                ) : (
                  patients.map(patient => (
                    <SelectItem key={patient.patientCode} value={patient.patientCode}>
                      {patient.fullName} ({patient.patientCode})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {patientSearch && (
              <Input
                placeholder="Tìm kiếm bệnh nhân..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  loadPatients();
                }}
                className="mt-2"
              />
            )}
          </div>

          {/* Invoice Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Chi tiết dịch vụ *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={creating || loadingServices}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm dịch vụ
              </Button>
            </div>

            {invoiceItems.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500 text-sm">Chưa có dịch vụ nào. Nhấn "Thêm dịch vụ" để thêm.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 border rounded-lg">
                    <div className="md:col-span-5">
                      <Label htmlFor={`service-${index}`}>Dịch vụ *</Label>
                      <Select
                        value={item.serviceId.toString()}
                        onValueChange={(value) => handleItemChange(index, 'serviceId', parseInt(value))}
                        disabled={creating || loadingServices}
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
                        disabled={creating}
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
                        disabled={creating}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={invoiceItems.length === 1 || creating}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.serviceName && (
                      <div className="md:col-span-12">
                        <p className="text-sm text-gray-600">
                          Tổng: {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Amount */}
          {totalAmount > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Tổng tiền:</span>
                <span className="font-bold text-xl text-green-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (tùy chọn)..."
              rows={3}
              disabled={creating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !patientId || invoiceItems.length === 0 || totalAmount === 0}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              'Tạo hóa đơn'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


