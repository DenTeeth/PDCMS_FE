'use client';

/**
 * Create Custom Treatment Plan Modal Component
 * Phase 4: API 5.4 - Create custom treatment plan from scratch
 * 
 * Multi-step form:
 * Step 1: Plan Info (name, doctor, payment type, discount, dates)
 * Step 2: Phases Management (add/remove phases, set duration)
 * Step 3: Items Management (add/remove items per phase, service selection, price validation)
 * Step 4: Review & Confirm
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { ServiceService } from '@/services/serviceService';
import { EmployeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import {
  CreateCustomPlanRequest,
  CreateCustomPlanPhaseRequest,
  CreateCustomPlanItemRequest,
  PaymentType,
  TemplateDetailResponse,
  TemplatePhaseDTO,
  TemplateServiceDTO,
  TemplateSummaryDTO
} from '@/types/treatmentPlan';
import { Service } from '@/types/service';
import { Employee } from '@/types/employee';
import { Patient } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

interface CreateCustomPlanModalProps {
  open: boolean;
  onClose: () => void;
  patientCode?: string; // Optional - can be selected in form
  onSuccess: () => void; // Callback to refresh plan list
}

type Step = 0 | 1 | 2 | 3 | 4;

interface PhaseFormData {
  phaseNumber: number;
  phaseName: string;
  items: ItemFormData[];
}

interface ItemFormData {
  serviceCode: string;
  price: number;
  sequenceNumber: number;
  quantity: number;
}

export default function CreateCustomPlanModal({
  open,
  onClose,
  patientCode,
  onSuccess,
}: CreateCustomPlanModalProps) {
  const { user } = useAuth();
  const canCreate = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false; // ✅ BE: MANAGE_TREATMENT_PLAN covers create/update/delete
  const canViewServices = user?.permissions?.includes('VIEW_SERVICE') || false;

  // Check if user is employee (hide discount and price for employee role)
  const isEmployee = user?.baseRole === 'employee';

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(0);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Data
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedSearch = useDebounce(serviceSearch, 300);

  // Step 0: Patient Selection
  const [selectedPatientCode, setSelectedPatientCode] = useState<string>(patientCode || '');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const debouncedPatientSearch = useDebounce(patientSearch, 300);

  // Step 1: Plan Info
  const [planName, setPlanName] = useState('');
  const [doctorEmployeeCode, setDoctorEmployeeCode] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.FULL);
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [expectedEndDate, setExpectedEndDate] = useState<string>('');

  // Template selection (V21: API 5.8 integration)
  const [creationMode, setCreationMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateDetail, setTemplateDetail] = useState<TemplateDetailResponse | null>(null);
  // V21.4: Track original template data to detect changes
  const [originalTemplateData, setOriginalTemplateData] = useState<{
    phases: PhaseFormData[];
    planName: string;
  } | null>(null);

  // V21: API 6.6 - Load templates from API
  const [availableTemplates, setAvailableTemplates] = useState<Array<{ code: string; name: string; description?: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Step 2 & 3: Phases & Items
  const [phases, setPhases] = useState<PhaseFormData[]>([
    {
      phaseNumber: 1,
      phaseName: '',
      items: [],
    },
  ]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phaseErrors, setPhaseErrors] = useState<Record<number, Record<string, string>>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, Record<string, string>>>({});

  // Initialize patientCode from props if provided
  useEffect(() => {
    if (open && patientCode) {
      setSelectedPatientCode(patientCode);
      // Try to load patient data if code is provided
      loadPatientByCode(patientCode);
      // If patientCode is provided, can skip to step 1
      setCurrentStep(1);
    } else if (open && !patientCode) {
      // Reset if no patientCode provided - start from step 0
      setSelectedPatientCode('');
      setSelectedPatient(null);
      setPatientSearch('');
      setCurrentStep(0);
    }
  }, [open, patientCode]);

  // Load doctors and services when moving to step 1
  useEffect(() => {
    if (open && canCreate && currentStep >= 1 && selectedPatientCode) {
      // Only load doctors list if user is admin/manager (not doctor)
      // If user is doctor, auto-fill their employeeCode
      const isDoctor = user?.baseRole === 'employee' &&
        (user?.roles?.some(r => r.toUpperCase().includes('DENTIST')) ||
          user?.permissions?.includes('MANAGE_TREATMENT_PLAN')); // ✅ BE: MANAGE_TREATMENT_PLAN

      if (isDoctor && user?.employeeCode) {
        // Auto-fill current doctor
        setDoctorEmployeeCode(user.employeeCode);
        console.log(' Auto-filled doctor:', user.employeeCode);
      } else {
        // Load doctors list for admin/manager to select
        loadDoctors();
      }

      loadServices();
    }
  }, [open, canCreate, currentStep, selectedPatientCode, user]);

  // V21: API 6.6 - Load templates when modal opens and creation mode is template
  useEffect(() => {
    if (open && canCreate && creationMode === 'template') {
      loadTemplates();
    }
  }, [open, canCreate, creationMode]);

  // Load template detail when template is selected (ONLY ONCE - don't reload when step changes)
  // Fix: Issue 3 - Template items re-appear after removal
  // Solution: Only load template once when selected, don't reload when currentStep changes
  useEffect(() => {
    if (open && creationMode === 'template' && selectedTemplateCode && !templateDetail) {
      // Only load if templateDetail is null (not loaded yet)
      // Don't reload when currentStep changes to preserve user's customizations
      loadTemplateDetail(selectedTemplateCode);
    }
    // Note: templateDetail is intentionally NOT in dependencies to prevent reload
    // When user changes template, selectedTemplateCode changes → setTemplateDetail(null) is called
    // → useEffect triggers → templateDetail is null → load new template
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, creationMode, selectedTemplateCode]); // Removed currentStep and templateDetail from dependencies

  // Load initial patients list when modal opens at step 0
  useEffect(() => {
    if (open && currentStep === 0 && !selectedPatientCode) {
      // Load initial list when modal opens at step 0
      loadPatientsList();
    }
  }, [open, currentStep, selectedPatientCode]);

  // Search patients when search term changes
  useEffect(() => {
    if (open && currentStep === 0) {
      if (debouncedPatientSearch.length >= 2) {
        searchPatients(debouncedPatientSearch);
      } else if (debouncedPatientSearch.length === 0 && !selectedPatientCode) {
        // Load initial list when search is cleared
        loadPatientsList();
      }
    }
  }, [debouncedPatientSearch, open, currentStep, selectedPatientCode]);

  // Reload services when doctor is selected/changed (to filter by doctor's specializations)
  useEffect(() => {
    if (open && canViewServices && doctorEmployeeCode && doctors.length > 0) {
      console.log(' Doctor selected, reloading services with specialization filter...', doctorEmployeeCode);
      loadServices(debouncedSearch);
    }
  }, [doctorEmployeeCode, doctors, open, canViewServices]);

  // Filter services by search term
  useEffect(() => {
    if (open && canViewServices) {
      if (debouncedSearch) {
        loadServices(debouncedSearch);
      } else {
        loadServices();
      }
    }
  }, [debouncedSearch, open, canViewServices]);

  // Load patient by code
  const loadPatientByCode = async (code: string) => {
    try {
      const patient = await patientService.getPatientByCode(code);
      setSelectedPatient(patient);
      setSelectedPatientCode(code);
      setPatientSearch(patient.fullName || code);
    } catch (error: any) {
      console.error('Error loading patient:', error);
      // Don't show error toast - just log it
    }
  };

  // Load patients list (default list without search)
  const loadPatientsList = async () => {
    setLoadingPatients(true);
    try {
      const results = await patientService.getPatients({
        page: 0,
        size: 50,
        isActive: true,
      });
      setPatientSearchResults(results.content);
    } catch (error: any) {
      console.error('Failed to load patients list:', error);
      toast.error('Không thể tải danh sách bệnh nhân');
      setPatientSearchResults([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Search patients
  const searchPatients = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      loadPatientsList();
      return;
    }

    setSearchingPatients(true);
    try {
      const results = await patientService.getPatients({
        page: 0,
        size: 20,
        search: searchTerm,
        isActive: true,
      });
      setPatientSearchResults(results.content);
    } catch (error: any) {
      console.error('Failed to search patients:', error);
      toast.error('Không thể tìm kiếm bệnh nhân');
      setPatientSearchResults([]);
    } finally {
      setSearchingPatients(false);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientCode(patient.patientCode);
    setSelectedPatient(patient);
    setPatientSearch(patient.fullName || patient.patientCode);
    setPatientSearchResults([]);
  };

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const employeeService = new EmployeeService();
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true,
      });

      // Filter to only ROLE_DENTIST (case-insensitive)
      const dentists = response.content.filter(
        (emp) =>
          emp.roleName?.toUpperCase() === 'ROLE_DENTIST' ||
          emp.roleName?.toUpperCase().includes('DENTIST')
      );
      setDoctors(dentists);

      if (dentists.length === 0) {
        console.warn('No dentists found in employee list');
      }
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      toast.error('Không thể tải danh sách bác sĩ', {
        description: error.response?.data?.message || error.message,
      });
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadServices = async (keyword?: string) => {
    if (!canViewServices) {
      console.warn('Cannot load services: User does not have VIEW_SERVICE permission');
      return;
    }

    setLoadingServices(true);
    try {
      // V21.4: Filter services based on selected doctor's specializations
      // Priority 1: If doctorEmployeeCode is selected, filter by that doctor's specializations
      // Priority 2: If current user is a doctor, use /my-specializations endpoint
      // Priority 3: Otherwise, load all services

      let response;
      let allServices: Service[] = [];

      // Check if a doctor is selected in the form
      const selectedDoctor = doctorEmployeeCode
        ? doctors.find(d => d.employeeCode === doctorEmployeeCode)
        : null;

      const selectedDoctorSpecializations = selectedDoctor?.specializations || [];
      const selectedDoctorSpecializationIds = selectedDoctorSpecializations
        .map(s => {
          // Handle both string and number types
          const id = typeof s.specializationId === 'string'
            ? parseInt(s.specializationId)
            : s.specializationId;
          return id;
        })
        .filter(id => !isNaN(id) && id > 0);

      console.log('Loading services - selectedDoctor:', selectedDoctor?.fullName,
        'specializations:', selectedDoctorSpecializationIds.length,
        'doctorEmployeeCode:', doctorEmployeeCode);

      // If doctor is selected, we need to filter by their specializations
      if (selectedDoctor && selectedDoctorSpecializationIds.length > 0) {
        // Load all services first, then filter client-side by specializations
        response = await ServiceService.getServices({
          isActive: 'true',
          keyword,
          page: 0,
          size: 1000, // Load more to ensure we get all services
          sortBy: 'serviceName',
          sortDirection: 'ASC',
        });
        allServices = response.content || [];

        // Filter services that match ANY of the selected doctor's specializations
        const filteredServices = allServices.filter(service => {
          // Service matches if:
          // 1. Service has no specializationId (general service, available to all doctors)
          // 2. OR service has a specializationId that matches one of the doctor's specializations
          return !service.specializationId || selectedDoctorSpecializationIds.includes(service.specializationId);
        });

        console.log(` Filtered services for doctor ${selectedDoctor.fullName}: ${filteredServices.length}/${allServices.length} services match specializations`);
        setServices(filteredServices);
        return;
      }

      // If no doctor selected, check if current user is a doctor
      const isCurrentUserDoctor = (user?.roles?.some(r => r.toUpperCase().includes('DENTIST')) || false)
        && !!user?.employeeId;

      if (isCurrentUserDoctor) {
        try {
          // Use new endpoint that automatically filters by current doctor's specializations
          response = await ServiceService.getServicesForCurrentDoctor({
            isActive: 'true',
            keyword,
            page: 0,
            size: 100,
            sortBy: 'serviceName',
            sortDirection: 'ASC',
          });
          console.log(' Loaded services from /my-specializations (current user is doctor):', response.content?.length || 0);
          setServices(response.content || []);
          return;
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
        // For non-doctors (admin, manager) or when no doctor selected, use regular endpoint
        response = await ServiceService.getServices({
          isActive: 'true',
          keyword,
          page: 0,
          size: 100,
          sortBy: 'serviceName',
          sortDirection: 'ASC',
        });
        console.log(' Loaded services from /services (no doctor selected or non-doctor user):', response.content?.length || 0);
      }
      setServices(response.content || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xem danh sách dịch vụ', {
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
          toast.error('Không thể tải danh sách dịch vụ');
          setServices([]);
        }
      } else {
        toast.error('Không thể tải danh sách dịch vụ', {
          description: error.response?.data?.message || error.message,
        });
        setServices([]);
      }
    } finally {
      setLoadingServices(false);
    }
  };

  // V21: API 6.6 - Load templates list
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      console.log('📋 CreateCustomPlanModal.loadTemplates - Starting...');
      const response = await TreatmentPlanService.listTemplates({
        isActive: true,
        page: 0,
        size: 50, // Load all active templates
        sort: 'templateName,asc',
      });
      
      console.log('📋 CreateCustomPlanModal.loadTemplates - Response received:', response);
      console.log('📋 CreateCustomPlanModal.loadTemplates - Response.content:', response?.content);
      console.log('📋 CreateCustomPlanModal.loadTemplates - Is array?', Array.isArray(response?.content));
      console.log('📋 CreateCustomPlanModal.loadTemplates - Content length:', response?.content?.length);
      
      const templates = Array.isArray(response?.content) 
        ? response.content.map((t: TemplateSummaryDTO) => ({
            code: t.templateCode,
            name: t.templateName,
            description: t.description,
          }))
        : [];
      
      console.log('📋 CreateCustomPlanModal.loadTemplates - Mapped templates:', templates);
      console.log('📋 CreateCustomPlanModal.loadTemplates - Templates count:', templates.length);
      
      setAvailableTemplates(templates);
    } catch (error: any) {
      console.error('❌ CreateCustomPlanModal.loadTemplates - Error loading templates:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Không thể tải danh sách gói mẫu', {
        description: error.response?.data?.message || error.message,
      });
      setAvailableTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // V21: Load template detail (API 5.8)
  const loadTemplateDetail = async (templateCode: string) => {
    setLoadingTemplate(true);
    try {
      const detail = await TreatmentPlanService.getTemplateDetail(templateCode);
      setTemplateDetail(detail);

      console.log('📋 CreateCustomPlanModal.loadTemplateDetail - Detail received:', detail);
      console.log('📋 CreateCustomPlanModal.loadTemplateDetail - Detail.phases:', detail?.phases);
      console.log('📋 CreateCustomPlanModal.loadTemplateDetail - Is phases array?', Array.isArray(detail?.phases));

      // Populate plan name from template
      if (!planName && detail?.templateName) {
        setPlanName(detail.templateName);
      }

      // Populate phases and items from template
      const populatedPhases: PhaseFormData[] = Array.isArray(detail?.phases)
        ? detail.phases.map((phase: TemplatePhaseDTO, index: number) => ({
            phaseNumber: index + 1,
            phaseName: phase.phaseName,
            items: Array.isArray(phase.itemsInPhase)
              ? phase.itemsInPhase.map((item: TemplateServiceDTO, itemIndex: number) => ({
                  serviceCode: item.serviceCode,
                  price: item.price,
                  sequenceNumber: item.sequenceNumber,
                  quantity: item.quantity,
                }))
              : [],
          }))
        : [];
      
      console.log('📋 CreateCustomPlanModal.loadTemplateDetail - Populated phases:', populatedPhases);
      console.log('📋 CreateCustomPlanModal.loadTemplateDetail - Phases count:', populatedPhases.length);

      setPhases(populatedPhases);

      // V21.4: Save original template data for change detection
      setOriginalTemplateData({
        phases: populatedPhases,
        planName: detail.templateName,
      });

      toast.success('Đã tải cấu trúc gói mẫu', {
        description: `${detail.summary.totalPhases} giai đoạn, ${detail.summary.totalItemsInTemplate} loại dịch vụ`,
      });
    } catch (error: any) {
      console.error('Error loading template detail:', error);
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy gói mẫu', {
          description: 'Mã gói mẫu không tồn tại. Vui lòng chọn gói khác.',
        });
      } else if (error.response?.status === 410) {
        toast.error('Gói mẫu đã ngừng sử dụng', {
          description: 'Gói mẫu này đã bị vô hiệu hóa. Vui lòng chọn gói khác.',
        });
      } else {
        toast.error('Không thể tải chi tiết gói mẫu', {
          description: error.response?.data?.message || error.message,
        });
      }
      setTemplateDetail(null);
      setSelectedTemplateCode('');
      setOriginalTemplateData(null); // Reset original data on error
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Handle creation mode change
  const handleCreationModeChange = (mode: 'custom' | 'template') => {
    setCreationMode(mode);
    if (mode === 'custom') {
      // Reset template-related state
      setSelectedTemplateCode('');
      setTemplateDetail(null);
      setOriginalTemplateData(null); // V21.4: Reset when switching to custom mode
      // Reset to default phase
      setPhases([
        {
          phaseNumber: 1,
          phaseName: '',
          items: [],
        },
      ]);
    }
  };

  // Get service by code
  const getServiceByCode = (serviceCode: string): Service | undefined => {
    return services.find((s) => s.serviceCode === serviceCode);
  };

  // Validate Step 0: Patient Selection
  const validateStep0 = (): boolean => {
    if (!selectedPatientCode) {
      toast.error('Vui lòng chọn bệnh nhân');
      return false;
    }
    return true;
  };

  // Validate Step 1: Plan Info
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!planName.trim()) {
      newErrors.planName = 'Tên lộ trình điều trị là bắt buộc';
    }

    if (!doctorEmployeeCode) {
      newErrors.doctorEmployeeCode = 'Vui lòng chọn bác sĩ';
    }

    // V21: Validate template selection if template mode
    if (creationMode === 'template' && !selectedTemplateCode) {
      newErrors.templateCode = 'Vui lòng chọn gói mẫu';
    }

    if (creationMode === 'template' && selectedTemplateCode && !templateDetail) {
      newErrors.templateCode = 'Đang tải cấu trúc gói mẫu, vui lòng đợi...';
    }

    if (discountAmount !== '' && discountAmount < 0) {
      newErrors.discountAmount = 'Số tiền giảm giá không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2: Phases
  const validateStep2 = (): boolean => {
    const newPhaseErrors: Record<number, Record<string, string>> = {};

    phases.forEach((phase) => {
      const phaseErrors: Record<string, string> = {};

      if (!phase.phaseName.trim()) {
        phaseErrors.phaseName = 'Tên giai đoạn là bắt buộc';
      }


      if (Object.keys(phaseErrors).length > 0) {
        newPhaseErrors[phase.phaseNumber] = phaseErrors;
      }
    });

    setPhaseErrors(newPhaseErrors);

    if (phases.length === 0) {
      toast.error('Vui lòng thêm ít nhất một giai đoạn');
      return false;
    }

    return Object.keys(newPhaseErrors).length === 0;
  };

  // Validate Step 3: Items
  const validateStep3 = (): boolean => {
    const newItemErrors: Record<string, Record<string, string>> = {};

    let hasItems = false;

    // Pre-validate doctor specialization compatibility (prevent BE error)
    if (doctorEmployeeCode) {
      const selectedDoctor = doctors.find(d => d.employeeCode === doctorEmployeeCode);
      if (selectedDoctor && selectedDoctor.specializations) {
        // Convert specializationId to number for comparison (BE returns as string in Employee, number in Service)
        const doctorSpecializationIds = selectedDoctor.specializations.map(s => Number(s.specializationId));

        phases.forEach((phase) => {
          phase.items.forEach((item, itemIndex) => {
            if (item.serviceCode) {
              const service = services.find(s => s.serviceCode === item.serviceCode);
              if (service && service.specializationId != null) {
                // Service requires a specific specialization
                if (!doctorSpecializationIds.includes(service.specializationId)) {
                  const itemKey = `${phase.phaseNumber}-${itemIndex}`;
                  if (!newItemErrors[itemKey]) {
                    newItemErrors[itemKey] = {};
                  }
                  newItemErrors[itemKey].serviceCode =
                    `Dịch vụ "${service.serviceName}" yêu cầu chuyên môn "${service.specializationName || 'chưa xác định'}". Bác sĩ "${selectedDoctor.fullName}" không có chuyên môn này.`;
                }
              }
            }
          });
        });
      }
    }

    phases.forEach((phase) => {
      phase.items.forEach((item, itemIndex) => {
        const itemKey = `${phase.phaseNumber}-${itemIndex}`;
        const itemErrors: Record<string, string> = {};

        if (!item.serviceCode) {
          itemErrors.serviceCode = 'Vui lòng chọn dịch vụ';
        }

        // V21.4: Price validation removed - backend auto-fills from service default
        // Price field is read-only for doctors

        if (item.quantity < 1 || item.quantity > 100) {
          itemErrors.quantity = 'Số lượng phải từ 1 đến 100';
        }

        // Merge with specialization errors if any
        if (newItemErrors[itemKey]) {
          Object.assign(itemErrors, newItemErrors[itemKey]);
        }

        if (Object.keys(itemErrors).length > 0) {
          newItemErrors[itemKey] = itemErrors;
        }

        hasItems = true;
      });

      if (phase.items.length === 0) {
        newItemErrors[`phase-${phase.phaseNumber}`] = {
          general: 'Giai đoạn phải có ít nhất một hạng mục',
        };
      }
    });

    setItemErrors(newItemErrors);

    if (!hasItems) {
      toast.error('Vui lòng thêm ít nhất một hạng mục vào các giai đoạn');
      return false;
    }

    // Show toast if specialization mismatch errors found
    const hasSpecializationErrors = Object.values(newItemErrors).some(errors =>
      errors.serviceCode && errors.serviceCode.includes('yêu cầu chuyên môn')
    );
    if (hasSpecializationErrors) {
      toast.error('Một số dịch vụ không phù hợp với chuyên môn của bác sĩ đã chọn', {
        duration: 6000,
      });
    }

    return Object.keys(newItemErrors).length === 0;
  };

  // Calculate total cost
  const calculateTotalCost = (): number => {
    let total = 0;
    phases.forEach((phase) => {
      phase.items.forEach((item) => {
        total += item.price * item.quantity;
      });
    });
    return total;
  };

  // Calculate final cost
  const calculateFinalCost = (): number => {
    const total = calculateTotalCost();
    const discount = discountAmount === '' ? 0 : discountAmount;
    return Math.max(0, total - discount);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateStep0()) {
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        return;
      }
      setCurrentStep(4);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  // Add phase
  const handleAddPhase = () => {
    const newPhaseNumber = phases.length + 1;
    setPhases([
      ...phases,
      {
        phaseNumber: newPhaseNumber,
        phaseName: '',
        items: [],
      },
    ]);
  };

  // Remove phase
  const handleRemovePhase = (phaseNumber: number) => {
    if (phases.length <= 1) {
      toast.error('Phải có ít nhất một giai đoạn');
      return;
    }

    const updatedPhases = phases
      .filter((p) => p.phaseNumber !== phaseNumber)
      .map((p, index) => ({
        ...p,
        phaseNumber: index + 1,
      }));
    setPhases(updatedPhases);
  };

  // Update phase
  const handleUpdatePhase = (phaseNumber: number, field: keyof PhaseFormData, value: any) => {
    setPhases(
      phases.map((phase) =>
        phase.phaseNumber === phaseNumber ? { ...phase, [field]: value } : phase
      )
    );
  };

  // Add item to phase
  const handleAddItem = (phaseNumber: number) => {
    const phase = phases.find((p) => p.phaseNumber === phaseNumber);
    if (!phase) return;

    const newSequenceNumber = phase.items.length + 1;
    const updatedPhases = phases.map((p) =>
      p.phaseNumber === phaseNumber
        ? {
          ...p,
          items: [
            ...p.items,
            {
              serviceCode: '',
              price: 0,
              sequenceNumber: newSequenceNumber,
              quantity: 1,
            },
          ],
        }
        : p
    );
    setPhases(updatedPhases);
  };

  // Remove item from phase
  const handleRemoveItem = (phaseNumber: number, itemIndex: number) => {
    const updatedPhases = phases.map((phase) => {
      if (phase.phaseNumber === phaseNumber) {
        const updatedItems = phase.items
          .filter((_, idx) => idx !== itemIndex)
          .map((item, idx) => ({
            ...item,
            sequenceNumber: idx + 1,
          }));
        return { ...phase, items: updatedItems };
      }
      return phase;
    });
    setPhases(updatedPhases);
  };

  // Update item
  const handleUpdateItem = (
    phaseNumber: number,
    itemIndex: number,
    field: keyof ItemFormData,
    value: any
  ) => {
    const updatedPhases = phases.map((phase) => {
      if (phase.phaseNumber === phaseNumber) {
        const updatedItems = phase.items.map((item, idx) => {
          if (idx === itemIndex) {
            const updatedItem = { ...item, [field]: value };

            // Auto-fill price when service is selected
            if (field === 'serviceCode' && value) {
              const service = getServiceByCode(value);
              if (service) {
                updatedItem.price = service.price;
              }
            }

            return updatedItem;
          }
          return item;
        });
        return { ...phase, items: updatedItems };
      }
      return phase;
    });
    setPhases(updatedPhases);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedPatientCode) {
      toast.error('Vui lòng chọn bệnh nhân');
      setCurrentStep(0);
      return;
    }

    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    setLoading(true);

    // Always use API 5.4: Create Custom Plan (DRAFT, needs approval)
    // Build request payload - ensure no undefined values are sent
    const request: CreateCustomPlanRequest = {
      planName: planName.trim(),
      doctorEmployeeCode,
      paymentType,
      //  FIX: BE requires @NotNull, so send 0 instead of undefined
      // For employee role, always send 0 (discount field is hidden)
      discountAmount: isEmployee ? 0 : (discountAmount === '' ? 0 : Number(discountAmount)),
      // Temporarily disabled - BE will handle dates automatically
      // startDate: startDate && startDate.trim() ? startDate.trim() : null,
      // expectedEndDate: expectedEndDate && expectedEndDate.trim() ? expectedEndDate.trim() : null,
      phases: phases.map((phase) => {
        const phaseRequest: CreateCustomPlanPhaseRequest = {
          phaseNumber: phase.phaseNumber,
          phaseName: phase.phaseName.trim(),
          items: phase.items.map((item) => {
            const itemRequest: CreateCustomPlanItemRequest = {
              serviceCode: item.serviceCode,
              sequenceNumber: item.sequenceNumber,
              quantity: item.quantity,
            };
            // V21.4: price is optional - only include if explicitly set
            // Backend will auto-fill from service default if omitted
            // Note: FE auto-fills price from service when user selects service,
            // so price is usually present. BE will validate and use it if provided.
            if (item.price != null && item.price > 0) {
              itemRequest.price = item.price;
            }
            return itemRequest;
          }),
        };
        return phaseRequest;
      }),
    };

    // Log request payload with full details for debugging
    console.log('Creating custom plan (API 5.4):', JSON.stringify(request, null, 2));
    console.log('Request details:', {
      patientCode: selectedPatientCode,
      planName: request.planName,
      doctorCode: request.doctorEmployeeCode,
      phasesCount: request.phases.length,
      totalItems: request.phases.reduce((sum, p) => sum + p.items.length, 0),
    });

    try {
      const createdPlan = await TreatmentPlanService.createCustomTreatmentPlan(selectedPatientCode, request);

      toast.success('Tạo lộ trình điều trị thành công', {
        description: `Lộ trình "${createdPlan.planName}" đã được tạo với trạng thái DRAFT, cần được quản lý duyệt.`,
      });

      // Reset form
      handleClose();

      // Refresh list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error(' Error creating treatment plan:', error);
      console.error('� Request payload:', JSON.stringify(request, null, 2));
      console.error('� Error response:', error.response?.data);
      console.error(' Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.response?.data?.errorCode || error.response?.data?.error,
        message: error.response?.data?.message,
        detail: error.response?.data?.detail,
        data: error.response?.data?.data,
        fullResponse: error.response?.data,
      });
      console.error(' Request URL:', `/patients/${selectedPatientCode}/treatment-plans/custom`);
      console.error('� Phases details:', request.phases.map((p, idx) => ({
        phaseIndex: idx,
        phaseNumber: p.phaseNumber,
        phaseName: p.phaseName,
        itemsCount: p.items.length,
        items: p.items.map((item, itemIdx) => ({
          itemIndex: itemIdx,
          serviceCode: item.serviceCode,
          sequenceNumber: item.sequenceNumber,
          quantity: item.quantity,
          price: item.price,
        })),
      })));
      console.error('� Error stack:', error.stack);

      // V21.4: Handle specialization validation errors
      // BE returns error code as 'error.doctorSpecializationMismatch' or 'doctorSpecializationMismatch'
      const errorCode = error.response?.data?.errorCode || error.response?.data?.code || error.response?.data?.error;
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;

      // Handle validation errors (400 Bad Request)
      if (error.response?.status === 400) {
        // Check for specialization mismatch error (BE may return 'error.doctorSpecializationMismatch' or 'doctorSpecializationMismatch')
        if (errorCode === 'doctorSpecializationMismatch' ||
          errorCode === 'error.doctorSpecializationMismatch' ||
          (typeof errorCode === 'string' && errorCode.includes('doctorSpecializationMismatch'))) {
          // Specialization validation error - show detailed message from BE
          toast.error('Không thể tạo lộ trình điều trị', {
            description: errorDetail || 'Bác sĩ không có chuyên môn phù hợp với các dịch vụ đã chọn. Vui lòng chọn lại dịch vụ hoặc liên hệ quản trị viên để cập nhật chuyên môn.',
            duration: 8000, // Show longer for important errors
          });
        } else {
          // Other validation errors - show detailed message
          const validationErrors = error.response?.data?.errors || error.response?.data?.validationErrors;
          let errorMessage = errorDetail || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';

          if (validationErrors && Array.isArray(validationErrors)) {
            errorMessage = validationErrors.map((err: any) => err.message || err).join(', ');
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          toast.error('Lỗi khi tạo lộ trình điều trị', {
            description: errorMessage,
            duration: 6000,
          });
        }
      } else {
        // Other errors (500, network, etc.)
        const errorMessage = errorDetail || 'Không thể tạo lộ trình điều trị. Vui lòng thử lại sau.';
        toast.error('Lỗi khi tạo lộ trình điều trị', {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    // Reset form
    setCurrentStep(0);
    setSelectedPatientCode(patientCode || '');
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientSearchResults([]);
    setPlanName('');
    setDoctorEmployeeCode('');
    setPaymentType(PaymentType.FULL);
    setDiscountAmount('');
    setStartDate('');
    setExpectedEndDate('');
    setPhases([
      {
        phaseNumber: 1,
        phaseName: '',
        items: [],
      },
    ]);
    setErrors({});
    setPhaseErrors({});
    setItemErrors({});
    setServiceSearch('');
    // V21: Reset template-related state
    setCreationMode('custom');
    setSelectedTemplateCode('');
    setTemplateDetail(null);
    setOriginalTemplateData(null); // V21.4: Reset original template data
    onClose();
  };

  // Check if can proceed to next step
  const canProceed = (): boolean => {
    if (currentStep === 0) {
      return selectedPatientCode !== '';
    }
    if (currentStep === 1) {
      const basicValid = planName?.trim() !== '' && doctorEmployeeCode !== '';
      // V21: If template mode, also need template selected and loaded
      if (creationMode === 'template') {
        return basicValid && selectedTemplateCode !== '' && templateDetail !== null;
      }
      return basicValid;
    }
    if (currentStep === 2) {
      return phases.every((p) => p.phaseName.trim() !== '');
    }
    if (currentStep === 3) {
      return phases.every((p) => p.items.length > 0);
    }
    return false;
  };

  if (!canCreate) {
    return null;
  }

  const totalCost = calculateTotalCost();
  const finalCost = calculateFinalCost();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo lộ trình điều trị</DialogTitle>
          <DialogDescription>
            Tạo lộ trình điều trị mới từ đầu. Lộ trình sẽ ở trạng thái DRAFT và cần được quản lý duyệt.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[0, 1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step === currentStep
                    ? 'bg-primary text-primary-foreground border-primary'
                    : step < currentStep
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                  }`}
              >
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step === 0 ? 'BN' : step}
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Patient Selection */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientSearch" className="mb-2">
                Chọn bệnh nhân <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="patientSearch"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (e.target.value.length === 0) {
                      setSelectedPatientCode('');
                      setSelectedPatient(null);
                    }
                  }}
                  placeholder="Tìm kiếm theo tên hoặc mã bệnh nhân..."
                  className="pr-10"
                />
                {(loadingPatients || searchingPatients) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {selectedPatientCode && selectedPatient && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">
                        {selectedPatient.fullName}
                      </p>
                      <p className="text-sm text-green-700">
                        Mã: {selectedPatient.patientCode}
                        {selectedPatient.phone && ` • ${selectedPatient.phone}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPatientCode('');
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Patient Search Results */}
            {!selectedPatientCode && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {loadingPatients || searchingPatients ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>
                      {loadingPatients ? 'Đang tải danh sách...' : 'Đang tìm kiếm...'}
                    </span>
                  </div>
                ) : patientSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {patientSearch.length >= 2
                      ? 'Không tìm thấy bệnh nhân'
                      : 'Chưa có danh sách bệnh nhân'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {patientSearchResults.map((patient) => (
                      <button
                        key={patient.patientCode}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-sm text-gray-500">
                          {patient.patientCode}
                          {patient.phone && ` • ${patient.phone}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {patientSearch.length === 0 && !selectedPatientCode && patientSearchResults.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Chọn bệnh nhân từ danh sách hoặc nhập ít nhất 2 ký tự để tìm kiếm
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Plan Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* V21: Creation Mode Selection */}
            <div>
              <Label className="mb-2">
                Cách tạo lộ trình <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Card
                  className={`p-4 cursor-pointer border-2 transition-colors ${creationMode === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => handleCreationModeChange('custom')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={creationMode === 'custom'}
                      onChange={() => handleCreationModeChange('custom')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">Tạo tùy chỉnh</p>
                      <p className="text-xs text-gray-500">Tạo từ đầu, tự chọn dịch vụ</p>
                    </div>
                  </div>
                </Card>
                <Card
                  className={`p-4 cursor-pointer border-2 transition-colors ${creationMode === 'template'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => handleCreationModeChange('template')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={creationMode === 'template'}
                      onChange={() => handleCreationModeChange('template')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">Tạo từ gói mẫu</p>
                      <p className="text-xs text-gray-500">Dựa trên template, có thể tùy chỉnh</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Template Selection (if template mode) */}
            {creationMode === 'template' && (
              <div>
                <Label htmlFor="templateCode" className="mb-2">
                  Chọn gói mẫu <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedTemplateCode}
                  onValueChange={(value) => {
                    setSelectedTemplateCode(value);
                    // V21.4: Reset original data when template changes
                    setOriginalTemplateData(null);
                    setTemplateDetail(null);
                    setPhases([
                      {
                        phaseNumber: 1,
                        phaseName: '',
                        items: [],
                      },
                    ]);
                  }}
                  disabled={loadingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói mẫu..." />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {loadingTemplates ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Đang tải danh sách gói mẫu...</span>
                      </div>
                    ) : availableTemplates.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        Không có gói mẫu nào
                      </div>
                    ) : (
                      availableTemplates.map((template) => (
                        <SelectItem key={template.code} value={template.code}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loadingTemplate && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải cấu trúc gói mẫu...</span>
                  </div>
                )}
                {templateDetail && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Đã tải:</strong> {templateDetail.templateName}
                    </p>
                    {templateDetail.description && (
                      <p className="text-xs text-green-700 mt-1">{templateDetail.description}</p>
                    )}
                    <p className="text-xs text-green-700 mt-1">
                      {templateDetail.summary.totalPhases} giai đoạn, {templateDetail.summary.totalItemsInTemplate} loại dịch vụ
                    </p>
                  </div>
                )}
                {errors.templateCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.templateCode}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="planName" className="mb-2">
                Tên lộ trình điều trị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Ví dụ: Lộ trình niềng răng 6 tháng"
                className={errors.planName ? 'border-red-500' : ''}
              />
              {errors.planName && (
                <p className="text-sm text-red-500 mt-1">{errors.planName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="doctorEmployeeCode" className="mb-2">
                Bác sĩ phụ trách <span className="text-red-500">*</span>
              </Label>
              {(() => {
                // Check if current user is a doctor
                const isCurrentUserDoctor = user?.baseRole === 'employee' &&
                  (user?.roles?.some(r => r.toUpperCase().includes('DENTIST')) ||
                    user?.permissions?.includes('CREATE_TREATMENT_PLAN')) &&
                  user?.employeeCode;

                if (isCurrentUserDoctor && user.employeeCode) {
                  // Display current doctor (read-only for doctors)
                  return (
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.username} ({user.employeeCode})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bác sĩ hiện tại (tự động chọn)
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Show dropdown for admin/manager to select doctor
                  return (
                    <>
                      <Select
                        value={doctorEmployeeCode}
                        onValueChange={setDoctorEmployeeCode}
                        disabled={loadingDoctors}
                      >
                        <SelectTrigger className={errors.doctorEmployeeCode ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Chọn bác sĩ" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {loadingDoctors ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span>Đang tải...</span>
                            </div>
                          ) : doctors.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              Không tìm thấy bác sĩ
                            </div>
                          ) : (
                            doctors.map((doctor) => (
                              <SelectItem key={doctor.employeeCode} value={doctor.employeeCode}>
                                {doctor.fullName} ({doctor.employeeCode})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.doctorEmployeeCode && (
                        <p className="text-sm text-red-500 mt-1">{errors.doctorEmployeeCode}</p>
                      )}
                    </>
                  );
                }
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentType" className="mb-2">
                  Hình thức thanh toán <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paymentType}
                  onValueChange={(value) => setPaymentType(value as PaymentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentType.FULL}>Trả một lần</SelectItem>
                    <SelectItem value={PaymentType.PHASED}>Trả theo giai đoạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hide discount field for employee role */}
              {!isEmployee && (
                <div>
                  <Label htmlFor="discountAmount" className="mb-2">Giảm giá (VND)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDiscountAmount(value === '' ? '' : Number(value));
                    }}
                    placeholder="0"
                    className={errors.discountAmount ? 'border-red-500' : ''}
                  />
                  {errors.discountAmount && (
                    <p className="text-sm text-red-500 mt-1">{errors.discountAmount}</p>
                  )}
                </div>
              )}
            </div>

            {/* Temporarily hidden - BE will handle dates automatically */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="mb-2">Ngày bắt đầu (tùy chọn)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu chưa xác định (DRAFT status)
                </p>
              </div>

              <div>
                <Label htmlFor="expectedEndDate" className="mb-2">Ngày kết thúc dự kiến (tùy chọn)</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div> */}
          </div>
        )}

        {/* Step 2: Phases Management */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quản lý Giai đoạn</h3>
              <Button type="button" onClick={handleAddPhase} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Thêm giai đoạn
              </Button>
            </div>

            {phases.map((phase) => (
              <Card key={phase.phaseNumber} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Giai đoạn {phase.phaseNumber}</Badge>
                    {phases.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePhase(phase.phaseNumber)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-2">
                      Tên giai đoạn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={phase.phaseName}
                      onChange={(e) =>
                        handleUpdatePhase(phase.phaseNumber, 'phaseName', e.target.value)
                      }
                      placeholder="Ví dụ: Giai đoạn 1: Khám và Chuẩn bị"
                      className={
                        phaseErrors[phase.phaseNumber]?.phaseName ? 'border-red-500' : ''
                      }
                    />
                    {phaseErrors[phase.phaseNumber]?.phaseName && (
                      <p className="text-sm text-red-500 mt-1">
                        {phaseErrors[phase.phaseNumber].phaseName}
                      </p>
                    )}
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Items Management */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quản lý Hạng mục</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-64"
                />
                {loadingServices && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            {phases.map((phase) => (
              <Card key={phase.phaseNumber} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Giai đoạn {phase.phaseNumber}: {phase.phaseName || 'Chưa đặt tên'}</Badge>
                    <span className="text-sm text-gray-500">
                      ({phase.items.length} hạng mục)
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAddItem(phase.phaseNumber)}
                    size="sm"
                    disabled={!canViewServices}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm hạng mục
                  </Button>
                </div>

                {!canViewServices && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">
                        Bạn không có quyền xem danh sách dịch vụ. Vui lòng liên hệ quản trị viên.
                      </span>
                    </div>
                  </div>
                )}

                {itemErrors[`phase-${phase.phaseNumber}`]?.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">
                      {itemErrors[`phase-${phase.phaseNumber}`].general}
                    </p>
                  </div>
                )}

                {phase.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có hạng mục nào. Nhấn "Thêm hạng mục" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phase.items.map((item, itemIndex) => {
                      const itemKey = `${phase.phaseNumber}-${itemIndex}`;
                      const service = item.serviceCode ? getServiceByCode(item.serviceCode) : undefined;
                      const itemError = itemErrors[itemKey] || {};

                      return (
                        <Card key={itemIndex} className="p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="secondary">Hạng mục {item.sequenceNumber}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(phase.phaseNumber, itemIndex)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="mb-2">
                                Dịch vụ <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={item.serviceCode}
                                onValueChange={(value) =>
                                  handleUpdateItem(phase.phaseNumber, itemIndex, 'serviceCode', value)
                                }
                                disabled={!canViewServices || loadingServices}
                              >
                                <SelectTrigger
                                  className={itemError.serviceCode ? 'border-red-500' : ''}
                                >
                                  <SelectValue placeholder="Chọn dịch vụ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingServices ? (
                                    <div className="flex items-center justify-center p-4">
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      <span>Đang tải...</span>
                                    </div>
                                  ) : services.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                      {canViewServices
                                        ? 'Không tìm thấy dịch vụ'
                                        : 'Không có quyền xem dịch vụ'}
                                    </div>
                                  ) : (
                                    services.map((svc) => (
                                      <SelectItem key={svc.serviceCode} value={svc.serviceCode}>
                                        {svc.serviceName}{!isEmployee && ` (${svc.price.toLocaleString('vi-VN')} VND)`}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {itemError.serviceCode && (
                                <p className="text-sm text-red-500 mt-1">{itemError.serviceCode}</p>
                              )}
                              {service && !isEmployee && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Giá mặc định: {service.price.toLocaleString('vi-VN')} VND
                                </p>
                              )}
                            </div>

                            {/* V21.4: Price field read-only, auto-filled from service */}
                            {/* Hide price field for employee role */}
                            {!isEmployee && (
                              <div>
                                <Label className="mb-2">
                                  Giá (VND)
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={service?.price || 0}
                                  readOnly
                                  disabled
                                  className="bg-gray-100"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Giá mặc định từ dịch vụ. Kế toán sẽ điều chỉnh nếu cần.
                                </p>
                              </div>
                            )}

                            <div>
                              <Label className="mb-2">
                                Số lượng <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  handleUpdateItem(phase.phaseNumber, itemIndex, 'quantity', value);
                                }}
                                className={itemError.quantity ? 'border-red-500' : ''}
                              />
                              {itemError.quantity && (
                                <p className="text-sm text-red-500 mt-1">{itemError.quantity}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Số lượng {item.quantity} = {item.quantity} hạng mục riêng biệt
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Xem lại và xác nhận</h3>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Thông tin lộ trình</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bệnh nhân:</span>
                  <span className="font-medium">
                    {selectedPatient?.fullName || selectedPatientCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên lộ trình:</span>
                  <span className="font-medium">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bác sĩ phụ trách:</span>
                  <span className="font-medium">
                    {doctors.find((d) => d.employeeCode === doctorEmployeeCode)?.fullName || doctorEmployeeCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hình thức thanh toán:</span>
                  <span className="font-medium">
                    {paymentType === PaymentType.FULL
                      ? 'Trả một lần'
                      : paymentType === PaymentType.PHASED
                        ? 'Trả theo giai đoạn'
                        : 'Trả góp'}
                  </span>
                </div>
                {!isEmployee && discountAmount !== '' && discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-green-600">
                      -{Number(discountAmount).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Các Giai đoạn</h4>
              <div className="space-y-3">
                {phases.map((phase) => (
                  <div key={phase.phaseNumber} className="border-l-2 border-primary pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Giai đoạn {phase.phaseNumber}</Badge>
                      <span className="font-medium">{phase.phaseName}</span>
                    </div>
                    <div className="space-y-1">
                      {phase.items.map((item, idx) => {
                        const service = getServiceByCode(item.serviceCode);
                        return (
                          <div key={idx} className="text-sm text-gray-700">
                            • {service?.serviceName || item.serviceCode}
                            {!isEmployee && item.price != null && item.price > 0 && (
                              <> - {item.price.toLocaleString('vi-VN')} VND × {item.quantity} ={' '}
                                {(item.price * item.quantity).toLocaleString('vi-VN')} VND</>
                            )}
                            {isEmployee && item.quantity > 1 && (
                              <> × {item.quantity}</>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Hide price summary for employee role */}
            {!isEmployee && (
              <Card className="p-4 bg-blue-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Tổng chi phí:</span>
                    <span className="font-bold">{totalCost.toLocaleString('vi-VN')} VND</span>
                  </div>
                  {discountAmount !== '' && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Giảm giá:</span>
                      <span>-{Number(discountAmount).toLocaleString('vi-VN')} VND</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span className="font-semibold">Thành tiền:</span>
                    <span className="font-bold text-primary">
                      {finalCost.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Lộ trình sẽ được tạo với trạng thái <strong>DRAFT</strong></li>
                    <li>Cần được quản lý duyệt trước khi có thể sử dụng</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? handleClose : handlePrevious}
              disabled={loading}
            >
              {currentStep === 0 ? 'Hủy' : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </>
              )}
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || !canProceed()}
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác nhận tạo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

