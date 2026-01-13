'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Eye,
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  UserCheck,
  Filter,
  X,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Ban,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { Patient, CreatePatientWithAccountRequest, UpdatePatientRequest } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { authenticationService } from '@/services/authenticationService';
import { toast } from 'sonner';
import {
  getBookingBlockReasonLabel,
  isTemporaryBlock,
  BOOKING_BLOCK_REASON_OPTIONS
} from '@/types/patientBlockReason';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { validatePatientDateOfBirth, requiresEmergencyContact, calculateAge } from '@/utils/patientValidation';

// ==================== TYPES ====================

interface PatientStats {
  total: number;
  active: number;
  inactive: number;
}

// ==================== MAIN COMPONENT ====================
export default function PatientsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  // Permission checks - Updated to match BE naming
  const canCreate = hasPermission('MANAGE_PATIENT');
  const canUpdate = hasPermission('MANAGE_PATIENT');
  const canDelete = hasPermission('DELETE_PATIENT');
  const canView = hasPermission('VIEW_PATIENT');

  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Removed viewMode - only using table view now
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0); // Total from filtered query (for pagination)
  const [totalPatients, setTotalPatients] = useState(0); // Total actual patients (all, no filter)
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);

  // Create patient modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Delete patient states
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<CreatePatientWithAccountRequest>({
    username: '', // Optional - BE auto-generates from email if not provided
    email: '', // Required - BE uses this to create account and send password setup email
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: undefined,
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '', // Mối quan hệ với bệnh nhân
  });

  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [showOtherRelationshipEdit, setShowOtherRelationshipEdit] = useState(false);

  // Edit patient modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [updating, setUpdating] = useState(false);

  // Resend email states
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePatientRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: undefined,
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isActive: true,
    isBookingBlocked: false,
    bookingBlockReason: undefined,
    bookingBlockNotes: '',
  });

  // ==================== LOCK BODY SCROLL WHEN MODAL OPEN ====================
  useEffect(() => {
    if (showCreateModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal]);

  // ==================== DEBOUNCE SEARCH ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page when search changes
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ==================== FETCH PATIENTS ====================
  useEffect(() => {
    fetchPatients();
  }, [page]); // Only re-fetch when page changes (filters are FE-only for now)

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Build query params - BE only supports page, size, sortBy, sortDirection
      // Note: Search, status, gender filters will be applied on FE
      const params: any = {
        page,
        size: 10, // Items per page
        sortBy: 'createdAt' as const, // ✅ Sort by creation date instead of code
        sortDirection: 'DESC' as const, // ✅ Newest patients first
      };

      // Note: If your BE supports these filters, uncomment:
      // if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      // if (filterStatus !== 'all') params.isActive = filterStatus === 'active';
      // if (filterGender !== 'all') params.gender = filterGender;

      // Strategy: Try stats API first (efficient), fallback to fetch all pages if API unavailable
      let statsCalculated = false;
      
      // Step 1: Try to use dedicated stats API endpoint (preferred - single API call)
      try {
        const stats = await patientService.getPatientStats();
        console.log('✅ Patient stats from API:', stats);
        
        // Update stats states from API response
        setTotalPatients(stats.totalPatients);
        setTotalActive(stats.activePatients);
        setTotalInactive(stats.inactivePatients);
        statsCalculated = true;
      } catch (statsError: any) {
        const status = statsError.response?.status;
        const errorData = statsError.response?.data;
        
        console.warn('⚠️ Stats API unavailable, falling back to fetch all pages method:', {
          status,
          statusText: statsError.response?.statusText,
          error: errorData,
          message: statsError.message,
        });
        
        // Step 2: Fallback - Fetch all pages and calculate stats manually (less efficient but reliable)
        try {
          console.log('📊 Fetching all patients to calculate stats manually...');
          let allPatients: Patient[] = [];
          let currentPage = 0;
          let hasMorePages = true;
          
          while (hasMorePages) {
            const pageResponse = await patientService.getPatients({
              page: currentPage,
              size: 100, // Use reasonable page size (BE may limit max size)
              sortBy: 'patientCode' as const,
              sortDirection: 'ASC' as const,
              // IMPORTANT: Do NOT include any filters
              // This ensures we get the true total count of all patients
            });
            
            allPatients = [...allPatients, ...(pageResponse.content || [])];
            
            // Check if there are more pages
            hasMorePages = !pageResponse.last && currentPage < pageResponse.totalPages - 1;
            currentPage++;
            
            // Safety limit to prevent infinite loop
            if (currentPage > 100) {
              console.warn('⚠️ Reached safety limit while fetching all patients');
              break;
            }
          }
          
          console.log('📊 Fetched all patients for stats (fallback):', {
            totalPages: currentPage,
            totalPatients: allPatients.length,
          });
          
          // Calculate stats from ALL patients data
          const totalCount = allPatients.length;
          const activeCount = allPatients.filter(p => p.isActive === true).length;
          const inactiveCount = allPatients.filter(p => {
            return p.isActive === false || p.isActive === null || p.isActive === undefined;
          }).length;
          
          // Validation: total should equal active + inactive
          if (totalCount !== activeCount + inactiveCount) {
            console.warn('⚠️ Stats calculation mismatch:', {
              total: totalCount,
              active: activeCount,
              inactive: inactiveCount,
              sum: activeCount + inactiveCount,
            });
          }
          
          // Update stats states from calculated values
          setTotalPatients(totalCount);
          setTotalActive(activeCount);
          setTotalInactive(inactiveCount);
          statsCalculated = true;
          
          console.log('✅ Stats calculated from all patients (fallback method):', {
            total: totalCount,
            active: activeCount,
            inactive: inactiveCount,
          });
        } catch (fallbackError: any) {
          console.error('❌ Fallback method also failed:', fallbackError);
          // Last resort: Set default values
          setTotalPatients(0);
          setTotalActive(0);
          setTotalInactive(0);
          toast.error('Không thể tải thống kê bệnh nhân. Vui lòng thử lại sau.');
        }
      }

      // Now fetch filtered patients for display (with current filters applied)
      console.log('Fetching patients with params:', params);
      const response = await patientService.getPatients(params);
      console.log('✅ Received filtered patients:', {
        total: response.content.length,
        active: response.content.filter(p => p.isActive === true).length,
        inactive: response.content.filter(p => p.isActive !== true).length,
        items: response.content.map(p => ({ code: p.patientCode, name: p.fullName, isActive: p.isActive }))
      });
      console.log('🔍 First patient block status:', response.content[0] && {
        patientCode: response.content[0].patientCode,
        isBookingBlocked: response.content[0].isBookingBlocked,
        bookingBlockReason: response.content[0].bookingBlockReason,
      });

      setPatients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements); // Total from filtered query (for pagination)
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREATE PATIENT ====================
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - email, firstName, lastName are required
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc (Email, Họ, Tên)');
      return;
    }

    // Validate date of birth and emergency contact
    if (formData.dateOfBirth) {
      const dobError = validatePatientDateOfBirth(
        formData.dateOfBirth,
        formData.emergencyContactPhone
      );
      if (dobError) {
        toast.error(dobError, {
          duration: 5000,
        });
        return;
      }
    }

    try {
      setCreating(true);

      // Prepare payload - only include fields that have values
      const payload: CreatePatientWithAccountRequest = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Add optional username if provided (BE auto-generates from email if not provided)
      if (formData.username && formData.username.trim()) {
        payload.username = formData.username.trim();
      }

      // Add optional fields if they have values
      if (formData.phone) payload.phone = formData.phone;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.address) payload.address = formData.address;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.medicalHistory) payload.medicalHistory = formData.medicalHistory;
      if (formData.allergies) payload.allergies = formData.allergies;
      if (formData.emergencyContactName) payload.emergencyContactName = formData.emergencyContactName;
      if (formData.emergencyContactPhone) payload.emergencyContactPhone = formData.emergencyContactPhone;
      if (formData.emergencyContactRelationship) payload.emergencyContactRelationship = formData.emergencyContactRelationship;

      // Debug logging
      console.log('� Creating patient with payload:', payload);
      console.log('� API Endpoint: POST /api/v1/patients');
      console.log('⏰ Timestamp:', new Date().toISOString());

      const result = await patientService.createPatient(payload);

      //  Note: BE may fail to send email but patient still created (graceful degradation)
      // Account status will be PENDING_VERIFICATION until password is set via email
      console.log(' Patient created:', result);
      console.log(' Account Info Check:', {
        hasAccount: result.hasAccount,
        accountStatus: result.accountStatus,
        email: result.email,
        note: result.hasAccount === undefined ? ' BE không trả về hasAccount - cần fix BE' : ' OK',
        accountStatusNote: result.accountStatus === undefined ? ' BE không trả về accountStatus - cần fix BE' : ' OK',
      });

      // Show success message with account status info
      if (result.hasAccount) {
        toast.success('Patient created successfully!', {
          description: result.accountStatus === 'PENDING_VERIFICATION'
            ? 'Account created. Patient will receive a password setup email shortly.'
            : 'Account created and activated.',
          duration: 5000,
        });
      } else {
        toast.success('Patient created successfully!', {
          description: 'Patient record created without account.',
          duration: 5000,
        });
      }

      setShowCreateModal(false);
      // Reset form
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        gender: undefined,
        medicalHistory: '',
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      fetchPatients(); // Refresh list
    } catch (error: any) {
      console.error('� Failed to create patient:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to create patient';
      let errorDescription = '';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        console.error('Error Response:', {
          status,
          data,
          headers: error.response.headers,
        });

        if (status === 500) {
          errorMessage = 'Server Error (500)';
          errorDescription = data?.message || 'Internal server error occurred. This might be due to:\n' +
            '• Email service configuration issue\n' +
            '• Database connection problem\n' +
            '• Account verification token creation failure\n\n' +
            'Please check BE logs for details.';
        } else if (status === 400) {
          errorMessage = 'Validation Error';
          errorDescription = data?.message || 'Please check your input:\n' +
            '• Username might already exist\n' +
            '• Email might already exist\n' +
            '• Invalid field format';
        } else if (status === 403) {
          errorMessage = 'Permission Denied';
          errorDescription = 'You do not have permission to create patients';
        } else {
          errorMessage = `Error ${status}`;
          errorDescription = data?.message || error.message;
        }
      } else if (error.request) {
        errorMessage = 'Network Error';
        errorDescription = 'Cannot reach the server. Please check your connection.';
      } else {
        errorMessage = 'Request Error';
        errorDescription = error.message;
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
      });
      toast.error(error.response?.data?.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  // ==================== RESEND PASSWORD SETUP EMAIL ====================
  const handleResendPasswordSetupEmail = async (patient: Patient) => {
    if (!patient.email) {
      toast.error('Patient does not have an email address');
      return;
    }

    if (patient.accountStatus !== 'PENDING_VERIFICATION') {
      toast.info('Patient account is not in pending verification status');
      return;
    }

    try {
      setResendingEmail(patient.patientCode);
      await authenticationService.resendPasswordSetupEmail(patient.email);
      toast.success('Password setup email sent successfully!', {
        description: `Email sent to ${patient.email}. Patient can now set their password.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Failed to resend password setup email:', error);
      toast.error('Failed to resend password setup email', {
        description: error.response?.data?.message || error.message || 'Please try again later.',
        duration: 5000,
      });
    } finally {
      setResendingEmail(null);
    }
  };

  // ==================== EDIT PATIENT ====================
  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    const relationship = patient.emergencyContactRelationship || '';
    setShowOtherRelationshipEdit(relationship !== '' && relationship !== 'PARENT' && relationship !== 'SPOUSE' && relationship !== 'CHILD' && relationship !== 'SIBLING' && relationship !== 'RELATIVE' && relationship !== 'FRIEND');
    setEditFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '',
      address: patient.address || '',
      gender: patient.gender,
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      emergencyContactRelationship: relationship,
      isActive: patient.isActive,
      isBookingBlocked: patient.isBookingBlocked || false,
      bookingBlockReason: patient.bookingBlockReason || undefined,
      bookingBlockNotes: patient.bookingBlockNotes || '',
    });
    setShowEditModal(true);
  };

  // ==================== DELETE PATIENT ====================
  const handleDeletePatient = async () => {
    if (!deletingPatient) return;

    try {
      setDeleting(true);
      await patientService.deletePatient(deletingPatient.patientCode);
      toast.success('Xóa bệnh nhân thành công');
      setShowDeleteConfirm(false);
      setDeletingPatient(null);
      fetchPatients(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete patient:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa bệnh nhân');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPatient) return;

    try {
      setUpdating(true);

      // Build partial update payload (only send fields that have values)
      const payload: UpdatePatientRequest = {};

      if (editFormData.firstName && editFormData.firstName !== editingPatient.firstName) {
        payload.firstName = editFormData.firstName;
      }
      if (editFormData.lastName && editFormData.lastName !== editingPatient.lastName) {
        payload.lastName = editFormData.lastName;
      }
      if (editFormData.email && editFormData.email !== editingPatient.email) {
        payload.email = editFormData.email;
      }
      if (editFormData.phone && editFormData.phone !== editingPatient.phone) {
        payload.phone = editFormData.phone;
      }
      if (editFormData.dateOfBirth && editFormData.dateOfBirth !== editingPatient.dateOfBirth) {
        payload.dateOfBirth = editFormData.dateOfBirth;
      }
      if (editFormData.address && editFormData.address !== editingPatient.address) {
        payload.address = editFormData.address;
      }
      if (editFormData.gender && editFormData.gender !== editingPatient.gender) {
        payload.gender = editFormData.gender;
      }
      if (editFormData.medicalHistory && editFormData.medicalHistory !== editingPatient.medicalHistory) {
        payload.medicalHistory = editFormData.medicalHistory;
      }
      if (editFormData.allergies && editFormData.allergies !== editingPatient.allergies) {
        payload.allergies = editFormData.allergies;
      }
      if (editFormData.emergencyContactName && editFormData.emergencyContactName !== editingPatient.emergencyContactName) {
        payload.emergencyContactName = editFormData.emergencyContactName;
      }
      if (editFormData.emergencyContactPhone && editFormData.emergencyContactPhone !== editingPatient.emergencyContactPhone) {
        payload.emergencyContactPhone = editFormData.emergencyContactPhone;
      }
      if (editFormData.emergencyContactRelationship && editFormData.emergencyContactRelationship !== editingPatient.emergencyContactRelationship) {
        payload.emergencyContactRelationship = editFormData.emergencyContactRelationship;
      }
      if (editFormData.isActive !== undefined && editFormData.isActive !== editingPatient.isActive) {
        payload.isActive = editFormData.isActive;
      }
      if (editFormData.isBookingBlocked !== undefined && editFormData.isBookingBlocked !== editingPatient.isBookingBlocked) {
        payload.isBookingBlocked = editFormData.isBookingBlocked;
      }
      if (editFormData.bookingBlockReason && editFormData.bookingBlockReason !== editingPatient.bookingBlockReason) {
        payload.bookingBlockReason = editFormData.bookingBlockReason;
      }
      if (editFormData.bookingBlockNotes && editFormData.bookingBlockNotes !== editingPatient.bookingBlockNotes) {
        payload.bookingBlockNotes = editFormData.bookingBlockNotes;
      }

      // Only update if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info('No changes to update');
        setShowEditModal(false);
        return;
      }

      await patientService.updatePatient(editingPatient.patientCode, payload);
      toast.success('Patient updated successfully');
      setShowEditModal(false);
      setEditingPatient(null);
      fetchPatients(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient');
    } finally {
      setUpdating(false);
    }
  };

  // ==================== FILTERING (All filters on FE until BE supports them) ====================
  const filteredPatients = patients.filter((patient) => {
    // Search filter (FE)
    const matchesSearch = !debouncedSearchTerm ||
      patient.fullName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      patient.phone?.includes(debouncedSearchTerm) ||
      patient.patientCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    // Gender filter (FE)
    const matchesGender = filterGender === 'all' || patient.gender === filterGender;

    // Status filter (FE)
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && patient.isActive) ||
      (filterStatus === 'inactive' && !patient.isActive);

    return matchesSearch && matchesGender && matchesStatus;
  });

  // ==================== STATS ====================
  // Use totalPatients (from all patients query) instead of patients.length (from filtered query)
  // This ensures stats show the true total count regardless of current filters
  const stats: PatientStats = {
    total: totalPatients, // Total actual patients (all, no filter)
    active: totalActive,
    inactive: totalInactive,
  };

  // ==================== HANDLERS ====================
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      case 'OTHER':
        return 'Khác';
      default:
        return gender || 'N/A';
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredBaseRole="admin" requiredPermissions={['VIEW_PATIENT']}>
      <div className="space-y-6 p-6">
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý bệnh nhân</h1>
            <p className="text-gray-600">Xem và quản lý thông tin bệnh nhân</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreate}
            title={!canCreate ? 'Bạn không có quyền tạo bệnh nhân' : ''}
          >
            <Plus className="h-4 w-4 mr-2" />
            Bệnh nhân mới
          </Button>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Patients */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('all')}
          >
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng bệnh nhân</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          {/* Active */}
          <div
            className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('active')}
          >
            <p className="text-sm font-semibold text-green-800 mb-2">Hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-6 w-6 text-green-700" />
              </div>
              <p className="text-3xl font-bold text-green-800">{stats.active}</p>
            </div>
          </div>

          {/* Inactive */}
          <div
            className="bg-gray-50 rounded-xl border border-gray-300 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('inactive')}
          >
            <p className="text-sm font-semibold text-gray-800 mb-2">Không hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-gray-700" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.inactive}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Tìm kiếm theo tên, email, điện thoại hoặc code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                    {(filterGender !== 'all' || filterStatus !== 'all') && (
                      <Badge variant="secondary" className="ml-1">
                        {(filterGender !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Giới tính</Label>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(0);
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                  </div>

                  {(filterGender !== 'all' || filterStatus !== 'all') && (
                    <div className="md:col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilterGender('all');
                          setFilterStatus('all');
                        }}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Xóa bộ lọc
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ==================== PATIENT LIST ==================== */}
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Không tìm thấy bệnh nhân nào trên trang này</p>
                <p className="text-sm mt-1">
                  {patients.length > 0
                    ? 'Thử điều chỉnh bộ lọc hoặc chuyển đến trang khác'
                    : 'Không có bệnh nhân nào'}
                </p>
                {patients.length > 0 && filteredPatients.length === 0 && (
                  <p className="text-xs mt-2 text-gray-400">
                    Hiển thị trang {page + 1} trong {totalPages} • {patients.length} bệnh nhân đã tải, 0 phù hợp với bộ lọc
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Table View */
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giới tính
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.patientId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.patientCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getGenderLabel(patient.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(patient.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.isBookingBlocked ? (
                        isTemporaryBlock(patient.bookingBlockReason) ? (
                          <Badge className="bg-orange-600 text-white">
                            Tạm chặn
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white">
                            Chặn
                          </Badge>
                        )
                      ) : (
                        <Badge className={patient.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}>
                          {patient.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/accounts/users/${patient.patientCode}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(patient)}
                            disabled={!canUpdate}
                            title={!canUpdate ? 'Bạn không có quyền chỉnh sửa bệnh nhân' : ''}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingPatient(patient);
                              setShowDeleteConfirm(true);
                            }}
                            disabled={!canDelete}
                            title={!canDelete ? "Bạn không có quyền xóa bệnh nhân" : ""}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                        {patient.hasAccount && patient.accountStatus === 'PENDING_VERIFICATION' && patient.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendPasswordSetupEmail(patient)}
                            disabled={resendingEmail === patient.patientCode}
                            className="w-full text-xs"
                          >
                            {resendingEmail === patient.patientCode ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Đang gửi...
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                Gửi lại email thiết lập
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              {/* Centered Pagination controls */}
              <div className="flex justify-center items-center">
                <div className="flex items-center gap-2">
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(0)}
                    disabled={page === 0 || loading}
                    className="h-9 w-9 p-0"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                    className="h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pageNumbers = [];
                      const maxVisible = 5;
                      let startPage = Math.max(0, page - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(0, endPage - maxVisible + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(
                          <Button
                            key={i}
                            variant={i === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(i)}
                            disabled={loading}
                            className={`h-9 w-9 p-0 ${i === page
                              ? 'bg-[#8b5fbf] text-white hover:bg-[#7a4fa8]'
                              : 'hover:bg-gray-100'
                              }`}
                          >
                            {i + 1}
                          </Button>
                        );
                      }
                      return pageNumbers;
                    })()}
                  </div>

                  {/* Next page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    className="h-9 px-3"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>

                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1 || loading}
                    className="h-9 w-9 p-0"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== CREATE PATIENT MODAL ==================== */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold">Tạo bệnh nhân mới</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Hãy điền thông tin phía dưới để tạo bệnh nhân mới.
                </p>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 pt-6">
                <form onSubmit={handleCreatePatient} className="space-y-4">
                  {/* Account Information */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Thông tin tài khoản
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="username" className="mb-2 block">
                          Tên đăng nhập
                        </Label>
                        <Input
                          id="username"
                          placeholder="VD: minh.nguyen (tự động tạo từ email nếu để trống)"
                          value={formData.username || ''}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value || undefined })}
                          disabled={creating}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email" className="mb-2 block">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="e.g., minh.nguyen@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={creating}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Bệnh nhân sẽ nhận được email thiết lập mật khẩu tại địa chỉ này
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                      <User className="h-4 w-4 text-blue-600" />
                      Thông tin cá nhân
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="mb-2 block">
                          Họ <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="e.g., Minh"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={creating}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="mb-2 block">
                          Tên <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="e.g., Nguyen"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={creating}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-2 block">Số điện thoại</Label>
                        <Input
                          id="phone"
                          placeholder="e.g., 0912345678"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={creating}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth" className="mb-2 block">
                          Ngày sinh
                          {formData.dateOfBirth && requiresEmergencyContact(formData.dateOfBirth) && (
                            <span className="ml-1 text-xs text-orange-600 font-medium">
                              (Dưới 16 tuổi - cần SĐT người giám hộ)
                            </span>
                          )}
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          disabled={creating}
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Bệnh nhân phải từ 6 tháng tuổi trở lên
                        </p>
                        {formData.dateOfBirth && (() => {
                          const age = calculateAge(formData.dateOfBirth);
                          return (
                            <p className="text-xs text-blue-600 mt-1">
                              Tuổi hiện tại: {age} tuổi
                            </p>
                          );
                        })()}
                      </div>
                      <div>
                        <Label htmlFor="gender" className="text-sm mb-2 block">Giới tính</Label>
                        <select
                          id="gender"
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' | undefined })}
                          disabled={creating}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-sm mb-2 block">Địa chỉ</Label>
                        <textarea
                          id="address"
                          placeholder="e.g., 123 Đường Lê Lợi, Quận 1, TP.HCM"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          disabled={creating}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Thông tin y tế
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="medicalHistory" className="text-sm mb-2 block">Tiền sử bệnh</Label>
                        <textarea
                          id="medicalHistory"
                          placeholder="e.g., Đã điều trị viêm lợi năm 2020"
                          value={formData.medicalHistory}
                          onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                          disabled={creating}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="allergies" className="text-sm mb-2 block">Dị ứng</Label>
                        <textarea
                          id="allergies"
                          placeholder="e.g., Dị ứng thuốc tê lidocaine"
                          value={formData.allergies}
                          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                          disabled={creating}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Liên hệ khẩn cấp */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4 text-blue-600" />
                      Liên hệ khẩn cấp
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Bệnh nhân dưới 16 tuổi bắt buộc phải có thông tin người giám hộ
                        </div>
                      </div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="emergencyContactName">Tên người liên hệ khẩn cấp</Label>
                        <Input
                          id="emergencyContactName"
                          placeholder="VD: Trần Thị Hoa"
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          disabled={creating}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="emergencyContactPhone">
                          SĐT liên hệ khẩn cấp
                          {formData.dateOfBirth && requiresEmergencyContact(formData.dateOfBirth) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          id="emergencyContactPhone"
                          placeholder="VD: 0987654321"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          disabled={creating}
                          required={formData.dateOfBirth ? requiresEmergencyContact(formData.dateOfBirth) : false}
                          className={formData.dateOfBirth && requiresEmergencyContact(formData.dateOfBirth) && !formData.emergencyContactPhone ? 'border-red-300' : ''}
                        />
                        {formData.dateOfBirth && requiresEmergencyContact(formData.dateOfBirth) && !formData.emergencyContactPhone && (
                          <p className="text-xs text-red-600 mt-1">
                            Bắt buộc cho bệnh nhân dưới 16 tuổi
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="emergencyContactRelationship">Mối quan hệ với bệnh nhân</Label>
                        <select
                          id="emergencyContactRelationship"
                          value={formData.emergencyContactRelationship}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, emergencyContactRelationship: value });
                            setShowOtherRelationship(value === 'OTHER');
                          }}
                          disabled={creating}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                          <option value="">Chọn mối quan hệ</option>
                          <option value="PARENT">Bố/Mẹ</option>
                          <option value="SPOUSE">Vợ/Chồng</option>
                          <option value="CHILD">Con</option>
                          <option value="SIBLING">Anh/Chị/Em</option>
                          <option value="RELATIVE">Họ hàng</option>
                          <option value="FRIEND">Bạn bè</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      {showOtherRelationship && (
                        <div className="space-y-1">
                          <Label htmlFor="emergencyContactRelationshipOther">Ghi rõ mối quan hệ</Label>
                          <Input
                            id="emergencyContactRelationshipOther"
                            placeholder="Nhập mối quan hệ cụ thể"
                            value={formData.emergencyContactRelationship === 'OTHER' ? '' : formData.emergencyContactRelationship}
                            onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                            disabled={creating}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          username: '',
                          email: '',
                          firstName: '',
                          lastName: '',
                          phone: '',
                          dateOfBirth: '',
                          address: '',
                          gender: undefined,
                          medicalHistory: '',
                          allergies: '',
                          emergencyContactName: '',
                          emergencyContactPhone: '',
                          emergencyContactRelationship: '',
                        });
                        setShowOtherRelationship(false);
                      }}
                      disabled={creating}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo bệnh nhân
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== EDIT PATIENT MODAL ==================== */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
              <CardHeader className="border-b flex-shrink-0">
                <CardTitle>Chỉnh sửa bệnh nhân - {editingPatient?.patientCode}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 pt-6">
                <form onSubmit={handleUpdatePatient} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName" className="mb-2 block">Họ</Label>
                        <Input
                          id="edit-firstName"
                          value={editFormData.firstName}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, firstName: e.target.value })
                          }
                          placeholder="Nhập tên"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName" className="mb-2 block">Tên</Label>
                        <Input
                          id="edit-lastName"
                          value={editFormData.lastName}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, lastName: e.target.value })
                          }
                          placeholder="Nhập họ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-gender" className="mb-2 block">Giới tính</Label>
                        <select
                          id="edit-gender"
                          value={editFormData.gender || ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-dateOfBirth" className="mb-2 block">Ngày sinh</Label>
                        <Input
                          id="edit-dateOfBirth"
                          type="date"
                          value={editFormData.dateOfBirth}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Thông tin liên hệ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-email" className="mb-2 block">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, email: e.target.value })
                          }
                          placeholder="Nhập email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone" className="mb-2 block">Số điện thoại</Label>
                        <Input
                          id="edit-phone"
                          value={editFormData.phone}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, phone: e.target.value })
                          }
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-address">Địa chỉ</Label>
                        <Input
                          id="edit-address"
                          value={editFormData.address}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, address: e.target.value })
                          }
                          placeholder="Nhập địa chỉ"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Thông tin y tế</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-medicalHistory">Tiền sử bệnh lý</Label>
                        <textarea
                          id="edit-medicalHistory"
                          value={editFormData.medicalHistory}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, medicalHistory: e.target.value })
                          }
                          placeholder="Nhập tiền sử bệnh lý"
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-allergies">Dị ứng</Label>
                        <textarea
                          id="edit-allergies"
                          value={editFormData.allergies}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, allergies: e.target.value })
                          }
                          placeholder="Nhập dị ứng (nếu có)"
                          rows={2}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      Liên hệ khẩn cấp
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Bệnh nhân dưới 16 tuổi bắt buộc phải có thông tin người giám hộ
                        </div>
                      </div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-emergencyContactName">Tên người liên hệ khẩn cấp</Label>
                        <Input
                          id="edit-emergencyContactName"
                          value={editFormData.emergencyContactName}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              emergencyContactName: e.target.value,
                            })
                          }
                          placeholder="Nhập tên người liên hệ khẩn cấp"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-emergencyContactPhone">Số điện thoại liên hệ khẩn cấp</Label>
                        <Input
                          id="edit-emergencyContactPhone"
                          value={editFormData.emergencyContactPhone}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              emergencyContactPhone: e.target.value,
                            })
                          }
                          placeholder="Nhập số điện thoại khẩn cấp"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-emergencyContactRelationship">Mối quan hệ với bệnh nhân</Label>
                        <select
                          id="edit-emergencyContactRelationship"
                          value={showOtherRelationshipEdit ? 'OTHER' : (editFormData.emergencyContactRelationship || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'OTHER') {
                              setShowOtherRelationshipEdit(true);
                              setEditFormData({ ...editFormData, emergencyContactRelationship: '' });
                            } else {
                              setShowOtherRelationshipEdit(false);
                              setEditFormData({ ...editFormData, emergencyContactRelationship: value });
                            }
                          }}
                          disabled={updating}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                          <option value="">Chọn mối quan hệ</option>
                          <option value="PARENT">Bố/Mẹ</option>
                          <option value="SPOUSE">Vợ/Chồng</option>
                          <option value="CHILD">Con</option>
                          <option value="SIBLING">Anh/Chị/Em</option>
                          <option value="RELATIVE">Họ hàng</option>
                          <option value="FRIEND">Bạn bè</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      {showOtherRelationshipEdit && (
                        <div className="space-y-1">
                          <Label htmlFor="edit-emergencyContactRelationshipOther">Ghi rõ mối quan hệ</Label>
                          <Input
                            id="edit-emergencyContactRelationshipOther"
                            placeholder="Nhập mối quan hệ cụ thể"
                            value={editFormData.emergencyContactRelationship || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                            disabled={updating}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trạng thái chặn đặt lịch */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Trạng thái chặn đặt lịch</h3>
                    <div className="space-y-4">
                      {/* Trạng thái và Lý do chặn trên 1 hàng */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-isBookingBlocked">Trạng thái chặn đặt lịch</Label>
                          <select
                            id="edit-isBookingBlocked"
                            value={editFormData.isBookingBlocked ? 'true' : 'false'}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, isBookingBlocked: e.target.value === 'true' })
                            }
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          >
                            <option value="false">Không chặn</option>
                            <option value="true">Bị chặn</option>
                          </select>
                        </div>

                        {editFormData.isBookingBlocked && (
                          <div className="space-y-2">
                            <Label htmlFor="edit-bookingBlockReason">
                              Lý do chặn <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={editFormData.bookingBlockReason || ''}
                              onValueChange={(value) =>
                                setEditFormData({ ...editFormData, bookingBlockReason: value })
                              }
                            >
                              <SelectTrigger id="edit-bookingBlockReason">
                                <SelectValue placeholder="Chọn lý do chặn">
                                  {editFormData.bookingBlockReason ? getBookingBlockReasonLabel(editFormData.bookingBlockReason) : 'Chọn lý do chặn'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectItem value="EXCESSIVE_NO_SHOWS">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">Bỏ hẹn quá nhiều</span>
                                    <span className="text-xs text-gray-500">Tạm chặn - Tự động mở khóa khi bệnh nhân đến khám</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="PAYMENT_ISSUES">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">Vấn đề thanh toán</span>
                                    <span className="text-xs text-gray-500">Nợ chi phí, từ chối thanh toán, tranh chấp thanh toán</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="STAFF_ABUSE">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">Bạo lực/Quấy rối nhân viên</span>
                                    <span className="text-xs text-gray-500">Bạo lực, quấy rối, gây rối với nhân viên</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="POLICY_VIOLATION">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">Vi phạm quy định</span>
                                    <span className="text-xs text-gray-500">Hủy hẹn quá nhiều, vi phạm quy định phòng khám lặp lại</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="OTHER_SERIOUS">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">Lý do nghiêm trọng khác</span>
                                    <span className="text-xs text-gray-500">Phá hoại tài sản, say xỉn, kiện tụng vô căn cứ, v.v.</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {editFormData.isBookingBlocked && (
                        <>

                          <div className="space-y-2">
                            <Label htmlFor="edit-bookingBlockNotes">Chi tiết</Label>
                            <Textarea
                              id="edit-bookingBlockNotes"
                              value={editFormData.bookingBlockNotes || ''}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, bookingBlockNotes: e.target.value })
                              }
                              placeholder="Nhập chi tiết lý do chặn (tùy chọn)"
                              rows={3}
                              maxLength={5000}
                            />
                            <p className="text-sm text-gray-500">
                              {(editFormData.bookingBlockNotes || '').length} / 5000 ký tự
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingPatient(null);
                      }}
                      disabled={updating}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Cập nhật bệnh nhân
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingPatient && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Xóa bệnh nhân
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Bạn có chắc chắn muốn xóa bệnh nhân <strong>{deletingPatient.fullName}</strong> ({deletingPatient.patientCode})?
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Hành động này sẽ đặt trạng thái bệnh nhân thành không hoạt động. Hành động này có thể được hoàn tác sau.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingPatient(null);
                    }}
                    disabled={deleting}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeletePatient}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
