'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Grid3x3,
  List,
  Filter,
  X,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
} from 'lucide-react';
import { Patient, CreatePatientWithAccountRequest, UpdatePatientRequest } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface PatientStats {
  total: number;
  active: number;
  male: number;
  female: number;
}

// ==================== MAIN COMPONENT ====================
export default function PatientsPage() {
  const router = useRouter();
  
  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Create patient modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreatePatientWithAccountRequest>({
    username: '',
    password: '',
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

  // Edit patient modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [updating, setUpdating] = useState(false);
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
  });

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
      // DEMO: size=1 to see pagination clearly
      const params: any = {
        page,
        size: 10, // DEMO: 1 item per page to see BE pagination + FE filtering
        sortBy: 'patientCode' as const,
        sortDirection: 'ASC' as const,
      };

      // Note: If your BE supports these filters, uncomment:
      // if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      // if (filterStatus !== 'all') params.isActive = filterStatus === 'active';
      // if (filterGender !== 'all') params.gender = filterGender;
      
      console.log('Fetching patients with params:', params);
      const response = await patientService.getPatients(params);
      console.log('Received patients:', response.content.length, 'items, totalPages:', response.totalPages);
      
      setPatients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
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
    
    // Validation
    if (!formData.username || !formData.password || !formData.email || 
        !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Prepare payload - only include fields that have values
      const payload: CreatePatientWithAccountRequest = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Add optional fields if they have values
      if (formData.phone) payload.phone = formData.phone;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.address) payload.address = formData.address;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.medicalHistory) payload.medicalHistory = formData.medicalHistory;
      if (formData.allergies) payload.allergies = formData.allergies;
      if (formData.emergencyContactName) payload.emergencyContactName = formData.emergencyContactName;
      if (formData.emergencyContactPhone) payload.emergencyContactPhone = formData.emergencyContactPhone;
      
      await patientService.createPatient(payload);
      toast.success('Patient created successfully');
      setShowCreateModal(false);
      // Reset form
      setFormData({
        username: '',
        password: '',
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
      console.error('Failed to create patient:', error);
      toast.error(error.response?.data?.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  // ==================== EDIT PATIENT ====================
  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
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
      isActive: patient.isActive,
    });
    setShowEditModal(true);
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
      if (editFormData.isActive !== undefined && editFormData.isActive !== editingPatient.isActive) {
        payload.isActive = editFormData.isActive;
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
  const stats: PatientStats = {
    total: totalElements, // Total from BE (all pages)
    active: patients.filter((p) => p.isActive).length, // Current page only
    male: patients.filter((p) => p.gender === 'MALE').length, // Current page only
    female: patients.filter((p) => p.gender === 'FEMALE').length, // Current page only
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
    <div className="space-y-6 p-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600">View and manage patient information</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Patient
        </Button>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Male</p>
                <p className="text-2xl font-bold">{stats.male}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Female</p>
                <p className="text-2xl font-bold">{stats.female}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="search">Search</Label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone, or code..."
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
                  Filter
                  {(filterGender !== 'all' || filterStatus !== 'all') && (
                    <Badge variant="secondary" className="ml-1">
                      {(filterGender !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Genders</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                      Clear Filters
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
              <p className="text-lg font-medium">No patients found on this page</p>
              <p className="text-sm mt-1">
                {patients.length > 0 
                  ? 'Try adjusting your filters or navigate to another page'
                  : 'No patients available'}
              </p>
              {patients.length > 0 && filteredPatients.length === 0 && (
                <p className="text-xs mt-2 text-gray-400">
                  Showing page {page + 1} of {totalPages} • {patients.length} patients loaded, 0 match filters
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.patientId}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                    <p className="text-sm text-gray-500">Code: {patient.patientCode}</p>
                  </div>
                  <Badge
                    variant={patient.isActive ? 'default' : 'secondary'}
                    className={
                      patient.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {patient.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{getGenderLabel(patient.gender)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(patient.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{patient.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{patient.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(patient);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/accounts/users/${patient.patientCode}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date of Birth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                        <Badge
                          variant={patient.isActive ? 'default' : 'secondary'}
                          className={
                            patient.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(patient)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/accounts/users/${patient.patientCode}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
                  title="First page"
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
                  Previous
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
                          className={`h-9 w-9 p-0 ${
                            i === page 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
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
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                {/* Last page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1 || loading}
                  className="h-9 w-9 p-0"
                  title="Last page"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Create New Patient</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={handleCreatePatient} className="space-y-4">
                {/* Account Information */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="username">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="username"
                        placeholder="e.g., minh.nguyen"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={creating}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={creating}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email">
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
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
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
                      <Label htmlFor="lastName">
                        Last Name <span className="text-red-500">*</span>
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
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="e.g., 0912345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={creating}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        disabled={creating}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="text-sm">Gender</Label>
                      <select
                        id="gender"
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' | undefined })}
                        disabled={creating}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address" className="text-sm">Address</Label>
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
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="medicalHistory" className="text-sm">Medical History</Label>
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
                      <Label htmlFor="allergies" className="text-sm">Allergies</Label>
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

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="emergencyContactName">Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        placeholder="e.g., Tran Thi Hoa"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        disabled={creating}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        placeholder="e.g., 0987654321"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        disabled={creating}
                      />
                    </div>
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
                        password: '',
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
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Patient
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Patient - {editingPatient?.patientCode}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePatient} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editFormData.firstName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, firstName: e.target.value })
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editFormData.lastName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, lastName: e.target.value })
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
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
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
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
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, email: e.target.value })
                        }
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Input
                        id="edit-address"
                        value={editFormData.address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, address: e.target.value })
                        }
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Medical Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-medicalHistory">Medical History</Label>
                      <textarea
                        id="edit-medicalHistory"
                        value={editFormData.medicalHistory}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, medicalHistory: e.target.value })
                        }
                        placeholder="Enter medical history"
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-allergies">Allergies</Label>
                      <textarea
                        id="edit-allergies"
                        value={editFormData.allergies}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, allergies: e.target.value })
                        }
                        placeholder="Enter allergies"
                        rows={2}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContactName">Contact Name</Label>
                      <Input
                        id="edit-emergencyContactName"
                        value={editFormData.emergencyContactName}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            emergencyContactName: e.target.value,
                          })
                        }
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContactPhone">Contact Phone</Label>
                      <Input
                        id="edit-emergencyContactPhone"
                        value={editFormData.emergencyContactPhone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                        placeholder="Enter emergency contact phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Status</h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isActive">Active Status</Label>
                    <select
                      id="edit-isActive"
                      value={editFormData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
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
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Patient
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
