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
  CheckCircle,
  XCircle,
  Loader2,
  Grid3x3,
  List,
  Filter,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

// Import types and services
import { Employee, CreateEmployeeRequest, Role } from '@/types/employee';
import { employeeService } from '@/services/employeeService';
import { roleService } from '@/services/roleService';

// ==================== MAIN COMPONENT ====================
export default function EmployeesPage() {
  const router = useRouter();
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Roles list
  const [roles, setRoles] = useState<Role[]>([]);

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

  // ==================== FETCH ROLES ====================
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles();
      setRoles(response || []);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
    }
  };

  // ==================== FETCH EMPLOYEES ====================
  useEffect(() => {
    fetchEmployees();
  }, [page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 100, // Fetch nhiều hơn để filter trên FE
        sortBy: 'employeeCode' as const,
        sortDirection: 'ASC' as const,
        // Không filter theo role/status ở BE nữa
      };
      
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
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || 
        !formData.roleId || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Prepare payload based on role
      const isDoctorOrNurse = formData.roleId === 'ROLE_DOCTOR' || formData.roleId === 'ROLE_NURSE';
      
      let payload: CreateEmployeeRequest;
      
      if (isDoctorOrNurse) {
        // For DOCTOR/NURSE: exclude username, email, password
        payload = {
          roleId: formData.roleId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          specializationIds: formData.specializationIds || [],
        } as any; // Cast because CreateEmployeeRequest requires username/email/password
      } else {
        // For other roles: include username, email, password (no specializationIds)
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

  // ==================== FILTER EMPLOYEES (ALL ON FE) ====================
  const filteredEmployees = (employees || []).filter(emp => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
                         emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (emp.phone && emp.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by role on FE
    const matchesRole = filterRole === 'all' || emp.roleId === filterRole;
    
    // Filter by status on FE
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && emp.isActive) ||
                         (filterStatus === 'inactive' && !emp.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
      {filteredEmployees.length === 0 ? (
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
            {filteredEmployees.map((employee) => (
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
                  {filteredEmployees.map((employee) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/accounts/employees/${employee.employeeCode}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
      {filteredEmployees.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages} ({totalElements} total)
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== CREATE EMPLOYEE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
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
                  <>
                    {/* Account Information - Only for non-Doctor/Nurse roles */}
                    {!isDoctorOrNurse && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div className="md:col-span-2">
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
                    )}

                    {/* Personal Information - Always shown */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="md:col-span-2">
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

                    {/* Specialization - Only for Doctor/Nurse */}
                    {isDoctorOrNurse && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Specialization</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Note:</strong> Specialization API is not yet available. 
                            This field will be enabled once the API is ready.
                          </p>
                          {/* TODO: Add specialization selection when API is available */}
                          {/* <div>
                            <Label htmlFor="specializationIds">
                              Specializations <span className="text-red-500">*</span>
                            </Label>
                            <select
                              id="specializationIds"
                              multiple
                              value={formData.specializationIds || []}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData({ ...formData, specializationIds: selected });
                              }}
                              disabled={creating}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="SPEC001">Nha khoa tổng quát</option>
                            </select>
                          </div> */}
                        </div>
                      </div>
                    )}
                  </>
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
    </div>
  );
}
