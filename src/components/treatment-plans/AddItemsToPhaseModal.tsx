'use client';

/**
 * Add Items to Phase Modal Component
 * Phase 3.5: API 5.7 - Add emergent items to an existing phase
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, X, AlertTriangle } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ServiceService } from '@/services/serviceService';
import { AddItemToPhaseRequest, AddItemsToPhaseResponse, ApprovalStatus } from '@/types/treatmentPlan';
import { Service } from '@/types/service';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';

interface AddItemsToPhaseModalProps {
  open: boolean;
  onClose: () => void;
  phaseId: number;
  phaseName: string;
  planApprovalStatus?: ApprovalStatus; // V21.4: To determine autoSubmit behavior
  onSuccess: () => void; // Callback to refresh phase/plan data
}

interface ItemFormData {
  serviceCode: string;
  price: number;
  quantity: number;
  notes: string;
}

export default function AddItemsToPhaseModal({
  open,
  onClose,
  phaseId,
  phaseName,
  planApprovalStatus = ApprovalStatus.DRAFT,
  onSuccess,
}: AddItemsToPhaseModalProps) {
  const { user } = useAuth();
  const canUpdate = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false; // ✅ BE: MANAGE_TREATMENT_PLAN covers create/update/delete
  const canViewServices = user?.permissions?.includes('VIEW_SERVICE') || false;

  // State
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedSearch = useDebounce(serviceSearch, 300);

  // Form state: Array of items to add
  const [items, setItems] = useState<ItemFormData[]>([
    { serviceCode: '', price: 0, quantity: 1, notes: '' },
  ]);

  // Validation errors
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Load services when modal opens
  useEffect(() => {
    if (open && canUpdate) {
      if (canViewServices) {
        loadServices();
      } else {
        // User doesn't have VIEW_SERVICE permission
        toast.error('Bạn không có quyền xem danh sách dịch vụ', {
          description: 'Vui lòng liên hệ quản trị viên để được cấp quyền VIEW_SERVICE',
        });
        setServices([]); // Clear services to show empty state
      }
    } else if (open) {
      // Modal opened but user doesn't have MANAGE_TREATMENT_PLAN permission
      setServices([]);
    }
  }, [open, canUpdate, canViewServices]);

  // Filter services by search term (only if user has permission)
  useEffect(() => {
    if (open && canUpdate && canViewServices) {
      if (debouncedSearch) {
        loadServices(debouncedSearch);
      } else {
        loadServices();
      }
    }
  }, [debouncedSearch, open, canUpdate, canViewServices]);

  const loadServices = async (keyword?: string) => {
    if (!canViewServices) {
      console.warn('Cannot load services: User does not have VIEW_SERVICE permission');
      return;
    }

    setLoadingServices(true);
    try {
      console.log('Loading services...', { keyword, isActive: 'true' });
      
      // V21.4: Use /my-specializations endpoint for doctors
      // Check if user is a doctor: has ROLE_DENTIST role AND has employeeId (required for API)
      const isDoctor = (user?.roles?.some(r => r.toUpperCase().includes('DENTIST')) || false)
        && !!user?.employeeId; // API requires employeeId to get specializations
      
      console.log('Loading services - isDoctor:', isDoctor, 'roles:', user?.roles, 'employeeId:', user?.employeeId);
      
      let response;
      if (isDoctor) {
        try {
          // Use new endpoint that automatically filters by doctor's specializations
          response = await ServiceService.getServicesForCurrentDoctor({
            isActive: 'true',
            keyword,
            page: 0,
            size: 100,
            sortBy: 'serviceName',
            sortDirection: 'ASC',
          });
          console.log(' Loaded services from /my-specializations:', response.content?.length || 0);
        } catch (apiError: any) {
          // If new API fails (500, 404, etc.), fallback to regular endpoint
          console.warn(' /my-specializations API failed, falling back to /services:', apiError.response?.status, apiError.response?.data?.message);
          if (apiError.response?.status === 500 || apiError.response?.status === 404) {
            // API not available yet, use regular endpoint
            response = await ServiceService.getServices({
              isActive: 'true',
              keyword,
              page: 0,
              size: 100,
              sortBy: 'serviceName',
              sortDirection: 'ASC',
            });
            console.log(' Fallback: Loaded services from /services:', response.content?.length || 0);
          } else {
            throw apiError; // Re-throw other errors
          }
        }
      } else {
        // For non-doctors, use regular endpoint
        response = await ServiceService.getServices({
          isActive: 'true',
          keyword,
          page: 0,
          size: 100,
          sortBy: 'serviceName',
          sortDirection: 'ASC',
        });
        console.log(' Loaded services from /services (non-doctor):', response.content?.length || 0);
      }
      
      console.log('Services loaded:', { count: response.content.length, services: response.content });
      setServices(response.content || []);
      
      if (response.content.length === 0) {
        console.warn('No active services found in database');
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: errorMessage,
      });
      
      // Show more detailed error message
      if (error.response?.status === 403) {
        toast.error('Không có quyền xem danh sách dịch vụ', {
          description: 'Vui lòng liên hệ quản trị viên để được cấp quyền VIEW_SERVICE',
        });
      } else if (error.response?.status === 400 && error.response?.data?.errorCode === 'EMPLOYEE_NOT_FOUND') {
        // User is not a doctor, fallback to regular endpoint
        try {
          const response = await ServiceService.getServices({
            isActive: 'true',
            keyword,
            page: 0,
            size: 100,
            sortBy: 'serviceName',
            sortDirection: 'ASC',
          });
          setServices(response.content || []);
        } catch (fallbackError: any) {
          toast.error('Không thể tải danh sách dịch vụ', {
            description: errorMessage,
          });
          setServices([]);
        }
      } else {
        toast.error('Không thể tải danh sách dịch vụ', {
          description: errorMessage,
        });
        setServices([]); // Clear services on error
      }
    } finally {
      setLoadingServices(false);
    }
  };

  // Get service by code
  const getServiceByCode = (serviceCode: string): Service | undefined => {
    return services.find((s) => s.serviceCode === serviceCode);
  };

  // Validate item (V21.4: Removed price validation - backend auto-fills)
  const validateItem = (item: ItemFormData, index: number): Record<string, string> => {
    const itemErrors: Record<string, string> = {};
    const service = getServiceByCode(item.serviceCode);

    if (!item.serviceCode) {
      itemErrors.serviceCode = 'Vui lòng chọn dịch vụ';
    } else if (!service) {
      itemErrors.serviceCode = 'Dịch vụ không tồn tại';
    } else if (!service.isActive) {
      itemErrors.serviceCode = 'Dịch vụ không còn hoạt động';
    }

    // V21.4: Price validation removed - backend auto-fills from service default
    // Price field is read-only for doctors

    if (item.quantity < 1 || item.quantity > 10) {
      itemErrors.quantity = 'Số lượng phải từ 1 đến 10';
    }

    if (item.notes.length > 500) {
      itemErrors.notes = 'Ghi chú không được vượt quá 500 ký tự';
    }

    return itemErrors;
  };

  // Validate all items
  const validateAllItems = (): boolean => {
    const allErrors: Record<number, Record<string, string>> = {};
    let isValid = true;

    items.forEach((item, index) => {
      const itemErrors = validateItem(item, index);
      if (Object.keys(itemErrors).length > 0) {
        allErrors[index] = itemErrors;
        isValid = false;
      }
    });

    setErrors(allErrors);
    return isValid;
  };

  // Add new item row
  const handleAddItem = () => {
    if (items.length < 10) {
      setItems([...items, { serviceCode: '', price: 0, quantity: 1, notes: '' }]);
    }
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      // Remove errors for this index
      const newErrors = { ...errors };
      delete newErrors[index];
      // Reindex errors
      const reindexedErrors: Record<number, Record<string, string>> = {};
      Object.keys(newErrors).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
        } else {
          reindexedErrors[oldIndex] = newErrors[oldIndex];
        }
      });
      setErrors(reindexedErrors);
    }
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof ItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill price when service is selected
    if (field === 'serviceCode' && value) {
      const service = getServiceByCode(value);
      if (service) {
        newItems[index].price = service.price;
      }
    }

    setItems(newItems);

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      if (newErrors[index]) {
        delete newErrors[index][field];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      setErrors(newErrors);
    }
  };

  // Calculate preview (V21.4: Use service price instead of item.price)
  const calculatePreview = () => {
    let totalItems = 0;
    let totalCost = 0;

    items.forEach((item) => {
      if (item.serviceCode && item.quantity > 0) {
        const service = getServiceByCode(item.serviceCode);
        if (service) {
          totalItems += item.quantity;
          totalCost += service.price * item.quantity;
        }
      }
    });

    return { totalItems, totalCost };
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canUpdate) {
      toast.error('Bạn không có quyền thêm hạng mục');
      return;
    }

    // Validate
    if (!validateAllItems()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    // V21.4: Determine autoSubmit based on plan approval status
    const autoSubmit = planApprovalStatus === ApprovalStatus.APPROVED;
    
    // Confirm dialog with appropriate message
    const { totalItems, totalCost } = calculatePreview();
    const confirmMessage = autoSubmit
      ? `Bạn có chắc muốn thêm ${totalItems} hạng mục vào phase này?\n` +
        `Tổng chi phí thêm: ${totalCost.toLocaleString('vi-VN')} VND\n` +
        `Lộ trình sẽ chuyển sang trạng thái "Chờ duyệt" và cần được Quản lý duyệt lại.`
      : `Bạn có chắc muốn thêm ${totalItems} hạng mục vào phase này?\n` +
        `Tổng chi phí thêm: ${totalCost.toLocaleString('vi-VN')} VND\n` +
        `Lộ trình vẫn ở trạng thái nháp. Bạn có thể tiếp tục chỉnh sửa.`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setLoading(true);
    try {
      // V21.4: Convert form data to API request (price is optional - backend auto-fills)
      const request: AddItemToPhaseRequest[] = items.map((item) => ({
        serviceCode: item.serviceCode,
        // price: omit - backend will auto-fill from service default
        quantity: item.quantity,
        notes: item.notes.trim() || undefined,
      }));

      // V21.4: Call API with autoSubmit parameter
      const response = await TreatmentPlanService.addItemsToPhase(phaseId, request, autoSubmit);

      // Show success toast with financial impact
      toast.success('Thêm hạng mục thành công', {
        description: response.message || `Đã thêm ${response.items.length} hạng mục`,
      });

      // V21.4: Show appropriate message based on autoSubmit
      if (autoSubmit && response.approvalWorkflow.approvalRequired) {
        toast.warning('Lộ trình cần được duyệt lại', {
          description: 'Lộ trình đã chuyển sang trạng thái "Chờ duyệt". Quản lý cần duyệt lại trước khi có thể kích hoạt.',
        });
      } else if (!autoSubmit) {
        toast.success('Đã thêm hạng mục', {
          description: 'Bạn có thể tiếp tục chỉnh sửa lộ trình.',
        });
      }

      // Reset form
      setItems([{ serviceCode: '', price: 0, quantity: 1, notes: '' }]);
      setErrors({});
      setServiceSearch('');

      // Close modal and refresh data
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding items to phase:', error);

      // Handle specific errors
      if (error.response?.status === 400) {
        toast.error('Lỗi xác thực', {
          description: error.response?.data?.message || 'Thông tin không hợp lệ',
        });
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy phase', {
          description: 'Phase không tồn tại hoặc đã bị xóa',
        });
      } else if (error.response?.status === 409) {
        toast.error('Xung đột', {
          description: error.response?.data?.message || 'Không thể thêm hạng mục vào phase này',
        });
      } else {
        toast.error('Đã xảy ra lỗi', {
          description: error.response?.data?.message || 'Vui lòng thử lại sau',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setItems([{ serviceCode: '', price: 0, quantity: 1, notes: '' }]);
      setErrors({});
      setServiceSearch('');
    }
  }, [open]);

  const { totalItems, totalCost } = calculatePreview();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm hạng mục vào {phaseName}</DialogTitle>
          <DialogDescription>
            {planApprovalStatus === ApprovalStatus.APPROVED
              ? 'Thêm các hạng mục phát sinh vào phase này. Lộ trình sẽ cần được Quản lý duyệt lại.'
              : 'Thêm các hạng mục vào phase này. Lộ trình vẫn ở trạng thái nháp, bạn có thể tiếp tục chỉnh sửa.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Search */}
          <div>
            <Label>Tìm kiếm dịch vụ</Label>
            <Input
              placeholder="Nhập tên dịch vụ để tìm kiếm..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const service = getServiceByCode(item.serviceCode);
              const itemErrors = errors[index] || {};

              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Hạng mục {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Service Selection */}
                    <div>
                      <Label htmlFor={`service-${index}`} className="text-xs">
                        Dịch vụ <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={item.serviceCode}
                        onValueChange={(value) => handleItemChange(index, 'serviceCode', value)}
                        disabled={loading || loadingServices}
                      >
                        <SelectTrigger id={`service-${index}`} className="h-9 text-sm">
                          <SelectValue placeholder="Chọn dịch vụ" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {loadingServices ? (
                            <SelectItem value="loading" disabled>
                              Đang tải...
                            </SelectItem>
                          ) : services.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Không tìm thấy dịch vụ
                            </SelectItem>
                          ) : (
                            services.map((svc) => (
                              <SelectItem key={svc.serviceCode} value={svc.serviceCode}>
                                {svc.serviceName} ({svc.price.toLocaleString('vi-VN')} VND)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {itemErrors.serviceCode && (
                        <p className="text-xs text-red-500 mt-1">{itemErrors.serviceCode}</p>
                      )}
                      {service && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Giá gốc: {service.price.toLocaleString('vi-VN')} VND
                        </p>
                      )}
                    </div>

                    {/* Price - V21.4: Read-only, auto-filled from service */}
                    <div>
                      <Label htmlFor={`price-${index}`} className="text-xs">
                        Giá (VND)
                      </Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        value={service?.price || 0}
                        readOnly
                        disabled
                        className="h-9 text-sm bg-gray-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Giá mặc định từ dịch vụ. Kế toán sẽ điều chỉnh nếu cần.
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label htmlFor={`quantity-${index}`} className="text-xs">
                        Số lượng <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          handleItemChange(index, 'quantity', Math.max(1, Math.min(10, value)));
                        }}
                        className="h-9 text-sm"
                        disabled={loading}
                        min={1}
                        max={10}
                      />
                      {itemErrors.quantity && (
                        <p className="text-xs text-red-500 mt-1">{itemErrors.quantity}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Số lượng: 1-10 (sẽ tạo {item.quantity} items riêng biệt)
                      </p>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor={`notes-${index}`} className="text-xs">
                        Ghi chú (tùy chọn)
                      </Label>
                      <Textarea
                        id={`notes-${index}`}
                        value={item.notes}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 500) {
                            handleItemChange(index, 'notes', value);
                          }
                        }}
                        placeholder="Nhập ghi chú..."
                        className="h-20 text-sm"
                        disabled={loading}
                        maxLength={500}
                      />
                      {itemErrors.notes && (
                        <p className="text-xs text-red-500 mt-1">{itemErrors.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.notes.length}/500
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Button */}
          {items.length < 10 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddItem}
              disabled={loading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm hạng mục khác
            </Button>
          )}

          {/* Preview Section - V21.4: Dynamic message based on approval status */}
          {totalItems > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Tổng quan</span>
              </div>
              <div className="text-sm space-y-1 text-blue-800">
                <p>• Số items sẽ tạo: <strong>{totalItems}</strong></p>
                <p>• Tổng chi phí thêm: <strong>{totalCost.toLocaleString('vi-VN')} VND</strong></p>
                {planApprovalStatus === ApprovalStatus.APPROVED ? (
                  <p className="text-orange-600 font-medium">
                     Lộ trình sẽ chuyển sang trạng thái "Chờ duyệt"
                  </p>
                ) : (
                  <p className="text-green-600 font-medium">
                    ✓ Lộ trình vẫn ở trạng thái nháp. Bạn có thể tiếp tục chỉnh sửa.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !canUpdate}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Thêm hạng mục'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

