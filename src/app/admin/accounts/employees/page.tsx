'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  UserPlus,
  Users,
  Shield,
  Settings,
  Calendar,
  DollarSign,
  Package,
  FileText,
  BarChart3,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { users, roles, permissions } from '@/data/admin-data';
import { User as UserType, Role, Permission } from '@/types/admin';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserType | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (roleName: string) => {
    return roles.find(role => role.name.toLowerCase().includes(roleName.toLowerCase())) || null;
  };

  const getRolePermissions = (rolePermissions: string[]) => {
    return permissions.filter(permission => rolePermissions.includes(permission.id));
  };

  const getPermissionByModule = (module: string) => {
    return permissions.filter(permission => permission.module === module);
  };

  const modules = [
    { name: 'dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { name: 'users', label: 'USER MANAGEMENT', icon: Users },
    { name: 'employees', label: 'EMPLOYEE MANAGEMENT', icon: User },
    { name: 'patients', label: 'PATIENT MANAGEMENT', icon: Users },
    { name: 'appointments', label: 'APPOINTMENT MANAGEMENT', icon: Calendar },
    { name: 'treatments', label: 'TREATMENT MANAGEMENT', icon: Shield },
    { name: 'inventory', label: 'INVENTORY MANAGEMENT', icon: Package },
    { name: 'billing', label: 'BILLING MANAGEMENT', icon: DollarSign },
    { name: 'blogs', label: 'BLOG MANAGEMENT', icon: FileText },
    { name: 'services', label: 'SERVICE MANAGEMENT', icon: Settings },
    { name: 'roles', label: 'ROLE MANAGEMENT', icon: Shield },
    { name: 'settings', label: 'SYSTEM SETTINGS', icon: Settings },
    { name: 'analytics', label: 'REPORTS & ANALYTICS', icon: BarChart3 }
  ];

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-green-100 text-green-800',
      technician: 'bg-purple-100 text-purple-800',
      receptionist: 'bg-orange-100 text-orange-800',
      manager: 'bg-red-100 text-red-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const openDetailsModal = (employee: UserType) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee information and permissions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doctors</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'doctor').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nurses</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'nurse').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="role" className="mb-2">Role</Label>
              <select
                id="role"
                value={filterRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="technician">Technician</option>
                <option value="receptionist">Receptionist</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((employee) => {
          const roleInfo = getRoleInfo(employee.role);
          const rolePermissions = roleInfo ? getRolePermissions(roleInfo.permissions) : [];
          
          return (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      {employee.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {employee.position} - {employee.department}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeColor(employee.status)}>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
        <CardContent>
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{employee.department}</span>
                    </div>
                  </div>

                  {/* Role Information */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Role:</span>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role}
                      </Badge>
                    </div>
                    
                    {roleInfo && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Role Description:</span>
                          <span className="text-xs text-gray-500">{roleInfo.description}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Permissions:</span>
                          <span className="font-medium text-blue-600">{roleInfo.permissions.length} permissions</span>
                        </div>
                        
                        {/* Permission Preview */}
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Granted Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {rolePermissions.slice(0, 3).map((permission) => (
                              <span
                                key={permission.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {permission.name}
                              </span>
                            ))}
                            {rolePermissions.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{rolePermissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDetailsModal(employee)}
                      >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Employee Details: {selectedEmployee.name}</h2>
              <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{selectedEmployee.name}</p>
                        <p className="text-sm text-gray-500">{selectedEmployee.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-600" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <span className="text-sm">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <span className="text-sm">Created: {selectedEmployee.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-600" />
                      <span className="text-sm">Last Login: {selectedEmployee.lastLogin}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Role Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Role Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const roleInfo = getRoleInfo(selectedEmployee.role);
                      if (!roleInfo) return <p className="text-gray-500">No role information available</p>;
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Role:</span>
                            <Badge className={getRoleBadgeColor(selectedEmployee.role)}>
                              {selectedEmployee.role}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                            <p className="text-sm text-gray-600">{roleInfo.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Permissions:</span>
                            <span className="font-medium text-blue-600">{roleInfo.permissions.length} permissions</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Permissions Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permission Details</CardTitle>
                    <CardDescription>
                      List of permissions granted to this employee
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const roleInfo = getRoleInfo(selectedEmployee.role);
                      if (!roleInfo) return <p className="text-gray-500">No permission information available</p>;
                      
                      const rolePermissions = getRolePermissions(roleInfo.permissions);
                      
                      return (
                        <div className="space-y-4">
                          {modules.map((module) => {
                            const modulePermissions = getPermissionByModule(module.name);
                            const moduleRolePermissions = rolePermissions.filter(p => p.module === module.name);
                            const IconComponent = module.icon;
                            
                            if (moduleRolePermissions.length === 0) return null;
                            
                            return (
                              <div key={module.name} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <IconComponent className="h-4 w-4 text-gray-600" />
                                  <h4 className="font-medium text-sm">{module.label}</h4>
                                  <span className="text-xs text-gray-500">
                                    ({moduleRolePermissions.length}/{modulePermissions.length})
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {moduleRolePermissions.map((permission) => (
                                    <div
                                      key={permission.id}
                                      className="flex items-center p-2 rounded bg-green-50 border border-green-200"
                                    >
                                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-green-800">{permission.name}</p>
                                        <p className="text-xs text-green-600">{permission.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowDetailsModal(false);
                // Navigate to edit employee
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Employee
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterRole !== 'all'
                ? 'Try changing search keywords or filters'
                : 'Start adding your first employee'
              }
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Employee
            </Button>
        </CardContent>
      </Card>
      )}
    </div>
  );
}