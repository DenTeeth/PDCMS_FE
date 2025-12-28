'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomSelect from '@/components/ui/custom-select';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Search,
  Eye,
  Users,
  User,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  Loader2,
  Filter,
  X,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Import types and services
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Role, EmploymentType } from '@/types/employee';
import { employeeService } from '@/services/employeeService';
import { roleService } from '@/services/roleService';
import { Specialization } from '@/types/specialization';
import { specializationService } from '@/services/specializationService';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/utils/roleFormatter';

// ==================== MAIN COMPONENT ====================
export default function EmployeesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Permission checks - Updated to match BE naming
  const canCreate = user?.permissions?.includes('MANAGE_EMPLOYEE') || false;
  const canUpdate = user?.permissions?.includes('MANAGE_EMPLOYEE') || false;
  const canDelete = user?.permissions?.includes('DELETE_EMPLOYEE') || false;
  const canView = user?.permissions?.includes('VIEW_EMPLOYEE') || false;

  console.log('🔐 User permissions:', {
    canCreate,
    canUpdate,
    canDelete,
    canView,
    allPermissions: user?.permissions
  });

  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Removed viewMode - only using table view now
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);

  // Roles list
  const [roles, setRoles] = useState<Role[]>([]);

  // Specializations list
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);

  // Create employee modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    username: '',
    email: '',
    password: '',
    roleId: '',
    firstName: '',
    lastName: '',
    employeeType: EmploymentType.FULL_TIME, // Default to FULL_TIME
    phone: '',
    dateOfBirth: '',
    address: '',
    specializationIds: [],
  });

  // Edit employee modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateEmployeeRequest>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    employeeType: EmploymentType.FULL_TIME,
    specializationIds: [],
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

  // ==================== FETCH ROLES ====================
  useEffect(() => {
    fetchRoles();
    fetchSpecializations();
  }, []);

  const fetchRoles = async () => {
    try {
      // Use employee-assignable endpoint to exclude ROLE_PATIENT
      const response = await roleService.getEmployeeAssignableRoles();
      setRoles(response || []);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
    }
  };

  // ==================== FETCH SPECIALIZATIONS ====================
  const fetchSpecializations = async () => {
    try {
      setLoadingSpecializations(true);
      const data = await specializationService.getAll();
      // Filter only active specializations
      const activeSpecializations = (data || []).filter(s => s.isActive);
      setSpecializations(activeSpecializations);
    } catch (error: any) {
      console.error('Failed to fetch specializations:', error);
      toast.error('Failed to load specializations');
    } finally {
      setLoadingSpecializations(false);
    }
  };

  // ==================== FETCH EMPLOYEES ====================
  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedSearchTerm, filterRole, filterStatus]); // Re-fetch when filters change

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      // Build query params - BE supports pagination and filters
      const params: any = {
        page,
        size: 12, // Items per page
        sortBy: 'employeeCode' as const,
        sortDirection: 'ASC' as const,
      };

      // Add search if present (use debounced value)
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      // Add role filter if not 'all'
      if (filterRole && filterRole !== 'all') {
        params.roleId = filterRole;
      }

      // Add status filter
      if (filterStatus === 'active') {
        params.isActive = true;
      } else if (filterStatus === 'inactive') {
        params.isActive = false;
      }

      console.log('Fetching employees with params:', params);
      const response = await employeeService.getEmployees(params);
      console.log('Received employees:', response.content.length, 'items');

      setEmployees(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);

      // Fetch ALL employees (no filter) to calculate accurate stats
      const allEmployeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 10000, // Get all
        sortBy: 'employeeCode' as const,
        sortDirection: 'ASC' as const,
        // No isActive filter - get both active and inactive
      });

      const allEmployees = allEmployeesResponse.content || [];
      const activeCount = allEmployees.filter(e => e.isActive === true).length;
      const inactiveCount = allEmployees.filter(e => e.isActive === false || e.isActive === null || e.isActive === undefined).length;

      console.log('📊 Stats calculated:', {
        total: allEmployees.length,
        active: activeCount,
        inactive: inactiveCount,
        nullOrUndefined: allEmployees.filter(e => e.isActive === null || e.isActive === undefined).length,
        sample: allEmployees.slice(0, 3).map(e => ({ code: e.employeeCode, isActive: e.isActive }))
      });

      setTotalActive(activeCount);
      setTotalInactive(inactiveCount);

    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREATE EMPLOYEE ====================
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Starting employee creation...');
    console.log('📝 Form data:', formData);

    // Check if selected role requires specialization
    const selectedRoleForValidation = roles.find(role => role.roleId === formData.roleId);
    const requiresSpecializationForValidation = selectedRoleForValidation?.requiresSpecialization === true;
    console.log('👔 Selected role:', selectedRoleForValidation);
    console.log('🔧 Requires specialization:', requiresSpecializationForValidation);

    // Validation - All roles need basic fields + account credentials
    if (!formData.roleId || !formData.firstName || !formData.lastName ||
      !formData.username || !formData.email || !formData.password) {
      console.error('❌ Validation failed: Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    // Additional validation for roles that require specialization
    if (requiresSpecializationForValidation) {
      if (!formData.specializationIds || formData.specializationIds.length === 0) {
        console.error('❌ Validation failed: Missing specialization for required role');
        toast.error('Please select at least one specialization for this role');
        return;
      }
    }

    try {
      setCreating(true);

      let payload: any;

      if (requiresSpecializationForValidation) {
        // For roles requiring specialization: include all fields + specializationIds
        payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          employeeType: formData.employeeType,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          specializationIds: formData.specializationIds || [],
        };
      } else {
        // For other roles: include all fields (no specializationIds)
        payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          employeeType: formData.employeeType,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
        };
      }

      console.log('📤 Creating employee with payload:', payload);

      await employeeService.createEmployee(payload);
      console.log('✅ Employee created successfully!');
      toast.success('Employee created successfully');
      setShowCreateModal(false);
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        roleId: '',
        firstName: '',
        lastName: '',
        employeeType: EmploymentType.FULL_TIME,
        phone: '',
        dateOfBirth: '',
        address: '',
        specializationIds: [],
      });
      fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error('❌ Failed to create employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setFormData({ ...formData, roleId });
  };

  // Check if selected role requires specialization
  const selectedRole = roles.find(role => role.roleId === formData.roleId);
  const requiresSpecialization = selectedRole?.requiresSpecialization === true;

  // ==================== EDIT EMPLOYEE ====================
  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      phone: employee.phone || '',
      dateOfBirth: employee.dateOfBirth || '',
      address: employee.address || '',
      roleId: employee.roleId || '',
      employeeType: employee.employeeType || EmploymentType.FULL_TIME,
      specializationIds: employee.specializations?.map(s => s.specializationId) || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEmployee) return;

    try {
      setUpdating(true);

      // Only include fields that have values (partial update)
      const payload: UpdateEmployeeRequest = {};
      if (editFormData.firstName) payload.firstName = editFormData.firstName;
      if (editFormData.lastName) payload.lastName = editFormData.lastName;
      if (editFormData.phone) payload.phone = editFormData.phone;
      if (editFormData.dateOfBirth) payload.dateOfBirth = editFormData.dateOfBirth;
      if (editFormData.address) payload.address = editFormData.address;
      if (editFormData.roleId) payload.roleId = editFormData.roleId;
      if (editFormData.employeeType) payload.employeeType = editFormData.employeeType;
      if (editFormData.specializationIds && editFormData.specializationIds.length > 0) {
        payload.specializationIds = editFormData.specializationIds;
      }

      await employeeService.updateEmployee(editingEmployee.employeeCode, payload);
      toast.success('Employee updated successfully');
      setShowEditModal(false);
      setEditingEmployee(null);
      fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setUpdating(false);
    }
  };

  // ==================== STATS ====================
  const stats = {
    total: totalElements,
    active: totalActive,
    inactive: totalInactive,
  };

  // ==================== LOADING STATE ====================
  if (loading && page === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải nhân viên...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['VIEW_EMPLOYEE']}
    >
      <div className="space-y-6 p-6">
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
            <p className="text-gray-600">Xem và quản lý thông tin nhân viên</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreate}
            title={!canCreate ? "Bạn không có quyền tạo nhân viên mới" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nhân viên mới
          </Button>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Employees */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('all')}
          >
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng nhân viên</p>
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

        {/* ==================== SEARCH & FILTERS ==================== */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Tìm kiếm theo tên, số điện thoại hoặc code..."
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
                    {(filterRole !== 'all' || filterStatus !== 'all') && (
                      <Badge variant="secondary" className="ml-1">
                        {(filterRole !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <select
                      value={filterRole}
                      onChange={(e) => {
                        setFilterRole(e.target.value);
                        setPage(0);
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả vai trò</option>
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
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

                  {(filterRole !== 'all' || filterStatus !== 'all') && (
                    <div className="md:col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilterRole('all');
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

        {/* ==================== EMPLOYEE LIST ==================== */}
        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Không tìm thấy nhân viên</p>
                <p className="text-sm mt-1">Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        NHÂN VIÊN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VỊ TRÍ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LOẠI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LIÊN HỆ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TRẠNG THÁI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        HÀNH ĐỘNG
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.employeeCode} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.employeeCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getRoleDisplayName(employee.roleName)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${employee.employeeType === EmploymentType.FULL_TIME
                            ? 'bg-blue-100 text-blue-800'
                            : employee.employeeType === EmploymentType.PART_TIME_FIXED
                              ? 'bg-green-100 text-green-800'
                              : employee.employeeType === EmploymentType.PART_TIME_FLEX
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {employee.employeeType === EmploymentType.FULL_TIME
                              ? 'Toàn thời gian'
                              : employee.employeeType === EmploymentType.PART_TIME_FIXED
                                ? 'Bán thời gian - Cố định'
                                : employee.employeeType === EmploymentType.PART_TIME_FLEX
                                  ? 'Bán thời gian - Linh hoạt'
                                  : 'Bán thời gian'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.account.email}</div>
                          {employee.phone && (
                            <div className="text-sm text-gray-500">{employee.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={employee.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}>
                            {employee.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/accounts/employees/${employee.employeeCode}`)}
                              disabled={!canView}
                              title={!canView ? "Bạn không có quyền xem chi tiết nhân viên" : ""}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(employee);
                              }}
                              disabled={!canUpdate}
                              title={!canUpdate ? "Bạn không có quyền chỉnh sửa nhân viên" : ""}
                            >
                              <Edit className="h-4 w-4 mr-1" />
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
                    Tiếp theo
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

        {/* ==================== CREATE EMPLOYEE MODAL ==================== */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-5xl my-8 max-h-[90vh] flex flex-col">
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5 text-blue-600" />
                    Tạo nhân viên mới
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 p-6">
                <form onSubmit={handleCreateEmployee} className="space-y-5">
                  {/* Role Selection - Always shown first */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label htmlFor="roleId" className="text-sm font-medium">
                      Vai trò <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="roleId"
                      value={formData.roleId}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={creating}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 text-sm"
                    >
                      <option value="">Chọn một vai trò</option>
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Type Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label htmlFor="employeeType" className="text-sm font-medium">
                      Loại hình lao động <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="employeeType"
                      value={formData.employeeType}
                      onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as EmploymentType })}
                      disabled={creating}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 text-sm"
                    >
                      <option value={EmploymentType.FULL_TIME}>Toàn thời gian</option>
                      <option value={EmploymentType.PART_TIME_FIXED}>Bán thời gian - Cố định</option>
                      <option value={EmploymentType.PART_TIME_FLEX}>Bán thời gian - Linh hoạt</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Toàn thời gian:</strong> Làm việc toàn thời gian, Admin gán lịch cố định<br />
                      <strong>Bán thời gian - Cố định:</strong> Part-time với lịch cố định (Admin gán)<br />
                      <strong>Bán thời gian - Linh hoạt:</strong> Part-time linh hoạt (Tự đăng ký ca từ các slot có sẵn)
                    </p>
                  </div>

                  {/* Conditional Fields based on Role */}
                  {formData.roleId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-5 mt-5">
                      {/* LEFT COLUMN: Account & Personal Information */}
                      <div className="space-y-5">
                        {/* Account Information - Always shown */}
                        <div>
                          <h3 className="font-semibold mb-3 text-base">Thông tin tài khoản</h3>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="username" className="mb-1.5 block text-sm">
                                Tên đăng nhập <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="username"
                                placeholder="e.g., john.doe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                disabled={creating}
                                required
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="mb-1.5 block text-sm">
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="e.g., john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={creating}
                                required
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="password" className="mb-1.5 block text-sm">
                                Mật khẩu <span className="text-red-500">*</span>
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
                              <p className="text-xs text-gray-500 mt-1">
                                Tối thiểu 6 ký tự
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Personal Information */}
                        <div className="border-t pt-5 mt-5">
                          <h3 className="font-semibold mb-3 text-base">Thông tin cá nhân</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="firstName" className="mb-1.5 block text-sm">
                                  Họ <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="firstName"
                                  placeholder="e.g., John"
                                  value={formData.firstName}
                                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                  disabled={creating}
                                  required
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor="lastName" className="mb-1.5 block text-sm">
                                  Tên <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="lastName"
                                  placeholder="e.g., Doe"
                                  value={formData.lastName}
                                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                  disabled={creating}
                                  required
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="phone" className="mb-1.5 block text-sm">Số điện thoại</Label>
                              <Input
                                id="phone"
                                placeholder="e.g., 0123456789"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={creating}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="dateOfBirth" className="mb-1.5 block text-sm">Ngày tháng năm sinh</Label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                disabled={creating}
                              />
                            </div>
                            <div>
                              <Label htmlFor="address" className="mb-1.5 block text-sm">Địa chỉ</Label>
                              <textarea
                                id="address"
                                placeholder="Enter full address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={creating}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Specialization (Only for roles that require specialization) */}
                      {requiresSpecialization && (
                        <div className="lg:border-l lg:pl-6">
                          <h3 className="font-semibold mb-3 text-base">Chuyên khoa</h3>
                          {loadingSpecializations ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Đang tải chuyên khoa...</span>
                            </div>
                          ) : specializations.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-800">
                                <strong>Lưu ý:</strong> Không có chuyên khoa đang hoạt động.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm mb-1.5 block">
                                  Chọn chuyên khoa <span className="text-red-500">*</span>
                                </Label>

                                {/* Selected badges at top */}
                                {formData.specializationIds && formData.specializationIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    {formData.specializationIds.map((specId) => {
                                      const spec = specializations.find(s => s.specializationId === specId);
                                      return spec ? (
                                        <Badge
                                          key={specId}
                                          className="bg-blue-600 text-white text-xs px-2 py-1 flex items-center gap-1.5"
                                        >
                                          <span>{spec.specializationCode}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setFormData({
                                                ...formData,
                                                specializationIds: formData.specializationIds?.filter(id => id !== specId)
                                              });
                                            }}
                                            className="hover:bg-blue-700 rounded-full p-0.5"
                                            disabled={creating}
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                )}

                                {/* Compact checkbox list */}
                                <div className="border rounded-md bg-white">
                                  {specializations.map((spec) => (
                                    <label
                                      key={spec.specializationId}
                                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.specializationIds?.includes(spec.specializationId) || false}
                                        onChange={(e) => {
                                          const currentIds = formData.specializationIds || [];
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              specializationIds: [...currentIds, spec.specializationId]
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              specializationIds: currentIds.filter(id => id !== spec.specializationId)
                                            });
                                          }
                                        }}
                                        disabled={creating}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900">
                                          {spec.specializationCode} - {spec.specializationName}
                                        </div>
                                        {spec.description && (
                                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                                            {spec.description}
                                          </div>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  Đã chọn: {formData.specializationIds?.length || 0} chuyên khoa
                                </p>
                              </div>

                              {/* Validation message */}
                              {formData.specializationIds?.length === 0 && (
                                <p className="text-xs text-red-500">
                                  Vui lòng chọn ít nhất một chuyên khoa
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          username: '',
                          email: '',
                          password: '',
                          roleId: '',
                          firstName: '',
                          lastName: '',
                          employeeType: EmploymentType.FULL_TIME,
                          phone: '',
                          dateOfBirth: '',
                          address: '',
                          specializationIds: [],
                        });
                      }}
                      disabled={creating}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={creating || !formData.roleId}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo nhân viên
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Employee Modal */}
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Chỉnh sửa nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateEmployee} className="space-y-6">
                  {/* Employee Info */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã nhân viên</p>
                        <p className="font-semibold">{editingEmployee.employeeCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vai trò hiện tại</p>
                        <Badge>{getRoleDisplayName(editingEmployee.roleName)}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Change Role</Label>
                    <CustomSelect
                      options={roles.map((role) => ({
                        value: role.roleId,
                        label: role.roleName,
                        description: role.description,
                      }))}
                      value={editFormData.roleId}
                      onChange={(value: string) => setEditFormData({ ...editFormData, roleId: value })}
                      placeholder="Select a role"
                    />
                    <p className="text-sm text-muted-foreground">
                      Cập nhật vai trò nhân viên nếu cần
                    </p>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <Label htmlFor="editEmployeeType">Loại hình lao động</Label>
                    <select
                      id="editEmployeeType"
                      value={editFormData.employeeType}
                      onChange={(e) => setEditFormData({ ...editFormData, employeeType: e.target.value as EmploymentType })}
                      disabled={updating}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={EmploymentType.FULL_TIME}>Toàn thời gian</option>
                      <option value={EmploymentType.PART_TIME_FIXED}>Bán thời gian - Cố định</option>
                      <option value={EmploymentType.PART_TIME_FLEX}>Bán thời gian - Linh hoạt</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật loại hình lao động nếu cần
                    </p>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName">Họ</Label>
                          <Input
                            id="edit-firstName"
                            value={editFormData.firstName}
                            onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                            placeholder="Nhập tên"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName">Tên</Label>
                          <Input
                            id="edit-lastName"
                            value={editFormData.lastName}
                            onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                            placeholder="Nhập họ"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Số điện thoại</Label>
                        <Input
                          id="edit-phone"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-dateOfBirth">Ngày tháng năm sinh</Label>
                        <Input
                          id="edit-dateOfBirth"
                          type="date"
                          value={editFormData.dateOfBirth}
                          onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-address">Địa chỉ</Label>
                        <textarea
                          id="edit-address"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          placeholder="Nhập địa chỉ"
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Specializations (Only for roles that require specialization) */}
                    {(() => {
                      const editingRole = roles.find(role => role.roleId === editingEmployee.roleId);
                      return editingRole?.requiresSpecialization === true;
                    })() && (
                        <div className="lg:border-l lg:pl-6">
                          <h3 className="text-lg font-semibold mb-4">Chuyên khoa</h3>
                          {loadingSpecializations ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Đang tải chuyên khoa...</span>
                            </div>
                          ) : specializations.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-800">
                                Không có chuyên khoa đang hoạt động.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <Label>Cập nhật chuyên khoa</Label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Thay đổi chuyên khoa của nhân viên
                                </p>
                              </div>

                              {/* Selected Specializations Badges */}
                              {editFormData.specializationIds && editFormData.specializationIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  {editFormData.specializationIds.map((specId) => {
                                    const spec = specializations.find(s => s.specializationId === specId);
                                    return spec ? (
                                      <Badge
                                        key={specId}
                                        className="bg-blue-600 text-white px-3 py-1 flex items-center gap-2"
                                      >
                                        <span>{spec.specializationCode}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditFormData({
                                              ...editFormData,
                                              specializationIds: editFormData.specializationIds?.filter(id => id !== specId)
                                            });
                                          }}
                                          className="hover:bg-blue-700 rounded-full p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              )}

                              {/* Checkbox List */}
                              <div className="border rounded-lg max-h-96 overflow-y-auto">
                                {specializations.map((spec) => (
                                  <label
                                    key={spec.specializationId}
                                    className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editFormData.specializationIds?.includes(spec.specializationId) || false}
                                      onChange={(e) => {
                                        const currentIds = editFormData.specializationIds || [];
                                        if (e.target.checked) {
                                          setEditFormData({
                                            ...editFormData,
                                            specializationIds: [...currentIds, spec.specializationId]
                                          });
                                        } else {
                                          setEditFormData({
                                            ...editFormData,
                                            specializationIds: currentIds.filter(id => id !== spec.specializationId)
                                          });
                                        }
                                      }}
                                      disabled={updating}
                                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900">
                                        {spec.specializationCode}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {spec.specializationName}
                                      </div>
                                      {spec.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {spec.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingEmployee(null);
                        setEditFormData({
                          firstName: '',
                          lastName: '',
                          phone: '',
                          dateOfBirth: '',
                          address: '',
                          specializationIds: [],
                        });
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={updating || !canUpdate}
                      title={!canUpdate ? "Bạn không có quyền cập nhật nhân viên" : ""}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Cập nhật nhân viên
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
    </ProtectedRoute>
  );
}
