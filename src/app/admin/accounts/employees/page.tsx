﻿'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import {
  Search,
  Eye,
  Users,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Grid3x3,
  List,
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
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Role } from '@/types/employee';
import { employeeService } from '@/services/employeeService';
import { roleService } from '@/services/roleService';
import { Specialization } from '@/types/specialization';
import { specializationService } from '@/services/specializationService';

// ==================== MAIN COMPONENT ====================
export default function EmployeesPage() {
  const router = useRouter();
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
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
    specializationIds: [],
  });

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
      const response = await roleService.getRoles();
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
        size: 12, // Items per page (BE handles filtering, so this is exact)
        sortBy: 'employeeCode' as const,
        sortDirection: 'ASC' as const,
      };

      // Add search if present (use debounced value) - BE filter
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      // Add role filter if not 'all' - BE filter
      if (filterRole && filterRole !== 'all') {
        params.roleId = filterRole;
      }

      // Add status filter if not 'all' - BE filter
      if (filterStatus && filterStatus !== 'all') {
        params.isActive = filterStatus === 'active';
      }
      
      console.log('Fetching employees with params:', params);
      const response = await employeeService.getEmployees(params);
      console.log('Received employees:', response.content.length, 'items');

      setEmployees(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
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
    
    // Prepare payload based on role
    const isDoctorOrNurse = formData.roleId === 'ROLE_DOCTOR' || formData.roleId === 'ROLE_NURSE';
    
    // Validation - All roles need basic fields + account credentials
    if (!formData.roleId || !formData.firstName || !formData.lastName ||
        !formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Additional validation for Doctor/Nurse: must have specializations
    if (isDoctorOrNurse) {
      if (!formData.specializationIds || formData.specializationIds.length === 0) {
        toast.error('Please select at least one specialization for Doctor/Nurse');
        return;
      }
    }

    try {
      setCreating(true);
      
      let payload: any;
      
      if (isDoctorOrNurse) {
        // For DOCTOR/NURSE: include all fields + specializationIds
        payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          firstName: formData.firstName,
          lastName: formData.lastName,
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
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
        };
      }

      console.log('📤 Creating employee with payload:', payload);
      
      await employeeService.createEmployee(payload);
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
        phone: '',
        dateOfBirth: '',
        address: '',
        specializationIds: [],
      });
      fetchEmployees(); // Refresh list
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setFormData({ ...formData, roleId });
  };

  const isDoctorOrNurse = formData.roleId === 'ROLE_DOCTOR' || formData.roleId === 'ROLE_NURSE';

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
    active: (employees || []).filter(e => e.isActive).length,
    inactive: (employees || []).filter(e => !e.isActive).length,
  };

  // ==================== LOADING STATE ====================
  if (loading && page === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">View and manage employee information</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Employee
        </Button>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
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
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== SEARCH & FILTERS ==================== */}
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
                  {(filterRole !== 'all' || filterStatus !== 'all') && (
                    <Badge variant="secondary" className="ml-1">
                      {(filterRole !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
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
                  <Label>Role</Label>
                  <select
                    value={filterRole}
                    onChange={(e) => {
                      setFilterRole(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
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
                      Clear Filters
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
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Card key={employee.employeeCode} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        {employee.fullName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2">{employee.roleName}</p>
                      <p className="text-xs text-gray-500 mt-1">Code: {employee.employeeCode}</p>
                    </div>
                    <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{employee.account.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>@{employee.account.username}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/accounts/employees/${employee.employeeCode}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(employee);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
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
                        <div className="text-sm text-gray-900">{employee.roleName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.account.email}</div>
                        {employee.phone && (
                          <div className="text-sm text-gray-500">{employee.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/accounts/employees/${employee.employeeCode}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(employee);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
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

      {/* ==================== CREATE EMPLOYEE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-5xl my-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Create New Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                {/* Role Selection - Always shown first */}
                <div>
                  <Label htmlFor="roleId">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="roleId"
                    value={formData.roleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={creating}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Fields based on Role */}
                {formData.roleId && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-4">
                    {/* LEFT COLUMN: Account & Personal Information */}
                    <div className="space-y-6">
                      {/* Account Information - Always shown */}
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Account Information</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="username">
                              Username <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="username"
                              placeholder="e.g., john.doe"
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              disabled={creating}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">
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
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum 6 characters
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3 text-lg">Personal Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="firstName">
                                First Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="firstName"
                                placeholder="e.g., John"
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
                                placeholder="e.g., Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                disabled={creating}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              placeholder="e.g., 0123456789"
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
                            <Label htmlFor="address">Address</Label>
                            <textarea
                              id="address"
                              placeholder="Enter full address"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              disabled={creating}
                              rows={3}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Specialization (Only for Doctor/Nurse) */}
                    {isDoctorOrNurse && (
                      <div className="lg:border-l lg:pl-6">
                        <h3 className="font-semibold mb-3 text-lg">Specialization</h3>
                        {loadingSpecializations ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading specializations...</span>
                          </div>
                        ) : specializations.length === 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              ⚠️ <strong>Note:</strong> No active specializations available.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <Label>
                                Select Specializations <span className="text-red-500">*</span>
                              </Label>
                              <p className="text-xs text-gray-500 mt-1">
                                Choose one or more specializations for this employee
                              </p>
                            </div>

                            {/* Selected Specializations Badges */}
                            {formData.specializationIds && formData.specializationIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                {formData.specializationIds.map((specId) => {
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
                                          setFormData({
                                            ...formData,
                                            specializationIds: formData.specializationIds?.filter(id => id !== specId)
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

                            {/* Validation message */}
                            {formData.specializationIds?.length === 0 && (
                              <p className="text-xs text-red-500">
                                Please select at least one specialization
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
                        phone: '',
                        dateOfBirth: '',
                        address: '',
                        specializationIds: [],
                      });
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating || !formData.roleId}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Employee
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmployee} className="space-y-6">
                {/* Employee Info */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee Code</p>
                      <p className="font-semibold">{editingEmployee.employeeCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Role</p>
                      <Badge>{editingEmployee.roleName}</Badge>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Change Role</Label>
                  <Select
                    options={roles.map((role) => ({
                      value: role.roleId,
                      label: role.roleName,
                      description: role.description,
                    }))}
                    value={editFormData.roleId}
                    onChange={(value) => setEditFormData({ ...editFormData, roleId: value })}
                    placeholder="Select a role"
                  />
                  <p className="text-sm text-muted-foreground">
                    Update employee role if needed
                  </p>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName">First Name</Label>
                        <Input
                          id="edit-firstName"
                          value={editFormData.firstName}
                          onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                          placeholder="Enter first name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName">Last Name</Label>
                        <Input
                          id="edit-lastName"
                          value={editFormData.lastName}
                          onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={editFormData.dateOfBirth}
                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <textarea
                        id="edit-address"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="Enter address"
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Specializations (Only for Doctor/Nurse) */}
                  {(editingEmployee.roleName === 'ROLE_DOCTOR' || editingEmployee.roleName === 'ROLE_NURSE') && (
                    <div className="lg:border-l lg:pl-6">
                      <h3 className="text-lg font-semibold mb-4">Specializations</h3>
                      {loadingSpecializations ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading specializations...</span>
                        </div>
                      ) : specializations.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ No active specializations available.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label>Update Specializations</Label>
                            <p className="text-xs text-gray-500 mt-1">
                              Modify employee specializations
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
                        Update Employee
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
