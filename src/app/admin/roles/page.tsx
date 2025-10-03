'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Shield,
  Users,
  Settings,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  MoreHorizontal,
  UserPlus,
  Save,
  AlertTriangle,
  ChevronRight,
  User,
  Calendar,
  DollarSign,
  Package,
  FileText,
  BarChart3
} from 'lucide-react';
import { roles, permissions } from '@/data/admin-data';
import { Role, Permission } from '@/types/admin';

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  
  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionByModule = (module: string) => {
    return permissions.filter(permission => permission.module === module);
  };

  const getRolePermissions = (rolePermissions: string[]) => {
    return permissions.filter(permission => rolePermissions.includes(permission.id));
  };

  const modules = [
    { name: 'dashboard', label: 'TRANG CHỦ', icon: BarChart3 },
    { name: 'users', label: 'QUẢN LÝ NGƯỜI DÙNG', icon: Users },
    { name: 'employees', label: 'QUẢN LÝ NHÂN VIÊN', icon: User },
    { name: 'patients', label: 'QUẢN LÝ BỆNH NHÂN', icon: Users },
    { name: 'appointments', label: 'QUẢN LÝ LỊCH HẸN', icon: Calendar },
    { name: 'treatments', label: 'QUẢN LÝ ĐIỀU TRỊ', icon: Shield },
    { name: 'inventory', label: 'QUẢN LÝ KHO', icon: Package },
    { name: 'billing', label: 'QUẢN LÝ THU/CHI', icon: DollarSign },
    { name: 'blogs', label: 'QUẢN LÝ BLOG', icon: FileText },
    { name: 'services', label: 'QUẢN LÝ DỊCH VỤ', icon: Settings },
    { name: 'roles', label: 'QUẢN LÝ VAI TRÒ', icon: Shield },
    { name: 'settings', label: 'CÀI ĐẶT HỆ THỐNG', icon: Settings },
    { name: 'analytics', label: 'BÁO CÁO & THỐNG KÊ', icon: BarChart3 }
  ];

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setIsActive(true);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!roleName.trim()) {
      errors.name = 'Role name is required';
    } else if (roleName.length < 3) {
      errors.name = 'Role name must be at least 3 characters';
    }
    
    if (!roleDescription.trim()) {
      errors.description = 'Role description is required';
    } else if (roleDescription.length < 10) {
      errors.description = 'Role description must be at least 10 characters';
    }
    
    if (selectedPermissions.length === 0) {
      errors.permissions = 'At least one permission must be selected';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRole = () => {
    if (validateForm()) {
      console.log('Creating role:', {
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        isActive
      });
      
      resetForm();
      setShowAddModal(false);
    }
  };

  const handleEditRole = () => {
    if (validateForm() && editingRole) {
      console.log('Updating role:', {
        id: editingRole.id,
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        isActive
      });
      
      resetForm();
      setShowEditModal(false);
      setEditingRole(null);
    }
  };

  const handleDeleteRole = () => {
    if (roleToDelete) {
      console.log('Deleting role:', roleToDelete.id);
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions([...role.permissions]);
    setIsActive(role.isActive);
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllPermissions = (module: string) => {
    const modulePermissions = getPermissionByModule(module);
    const modulePermissionIds = modulePermissions.map(p => p.id);
    
    setSelectedPermissions(prev => {
      const hasAllModulePermissions = modulePermissionIds.every(id => prev.includes(id));
      
      if (hasAllModulePermissions) {
        return prev.filter(id => !modulePermissionIds.includes(id));
      } else {
        return [...new Set([...prev, ...modulePermissionIds])];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-gray-600">Manage system roles and access permissions</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowAddModal(true);
        }} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">S</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Super Admin</p>
                <p className="text-2xl font-bold">{roles.find(r => r.name === 'Super Admin')?.userCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout with integrated search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Roles with integrated search */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-800">Roles</CardTitle>
            </CardHeader>
            
            {/* Search integrated into the card */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredRoles.map((role, index) => (
                  <div
                    key={role.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                         <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                           <span>{role.userCount} users</span>
                           <span>{role.permissions.length} permissions</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(role);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(role);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Functions/Permissions */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-800">Functions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedRole ? (
                <div className="space-y-0">
                  {modules.map((module) => {
                    const modulePermissions = getPermissionByModule(module.name);
                    const rolePermissions = getRolePermissions(selectedRole.permissions);
                    const moduleRolePermissions = rolePermissions.filter(p => p.module === module.name);
                    const IconComponent = module.icon;
                    
                    return (
                      <div key={module.name} className="border-b border-gray-200 last:border-b-0">
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                              <div>
                                <h3 className="font-medium text-gray-900">{module.label}</h3>
                                 <p className="text-sm text-gray-500">
                                   {moduleRolePermissions.length} / {modulePermissions.length} permissions granted
                                 </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                          
                          {/* Permission details - Dropdown */}
                          <div className="mt-3">
                            <Select>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select permissions to view details" />
                              </SelectTrigger>
                              <SelectContent>
                                {modulePermissions.map((permission) => {
                                  const hasPermission = selectedRole.permissions.includes(permission.id);
                                  return (
                                    <SelectItem key={permission.id} value={permission.id}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          hasPermission ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                        <span className={hasPermission ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                          {permission.name}
                                        </span>
                                        {hasPermission && (
                                          <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            
                            {/* Permission summary */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {moduleRolePermissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                >
                                  {permission.name}
                                </span>
                              ))}
                              {moduleRolePermissions.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  +{moduleRolePermissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                   <p>Select a role to view permission details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Role</h2>
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Role Name *</Label>
                  <Input
                    id="roleName"
                    value={roleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleName(e.target.value)}
                    placeholder="Enter role name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="roleDescription">Description *</Label>
                  <Textarea
                    id="roleDescription"
                    value={roleDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoleDescription(e.target.value)}
                    placeholder="Enter role description"
                    rows={3}
                    className={formErrors.description ? 'border-red-500' : ''}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked: boolean) => setIsActive(checked)}
                  />
                    <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label className="text-base font-medium">Permissions *</Label>
                {formErrors.permissions && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.permissions}</p>
                )}
                
                <div className="mt-4 space-y-6">
                  {modules.map((module) => {
                    const modulePermissions = getPermissionByModule(module.name);
                    const modulePermissionIds = modulePermissions.map(p => p.id);
                    const hasAllModulePermissions = modulePermissionIds.every(id => selectedPermissions.includes(id));
                    const IconComponent = module.icon;
                    
                    return (
                      <Card key={module.name}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                              <CardTitle className="text-lg">{module.label}</CardTitle>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllPermissions(module.name)}
                            >
                                {hasAllModulePermissions ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <CardDescription>
                              {modulePermissions.filter(p => selectedPermissions.includes(p.id)).length} / {modulePermissions.length} permissions selected
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {modulePermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={permission.id} className="font-medium text-sm cursor-pointer">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole}>
                <Save className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Role: {editingRole.name}</h2>
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editRoleName">Tên vai trò *</Label>
                  <Input
                    id="editRoleName"
                    value={roleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleName(e.target.value)}
                    placeholder="Nhập tên vai trò"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="editRoleDescription">Mô tả *</Label>
                  <Textarea
                    id="editRoleDescription"
                    value={roleDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoleDescription(e.target.value)}
                    placeholder="Nhập mô tả vai trò"
                    rows={3}
                    className={formErrors.description ? 'border-red-500' : ''}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editIsActive"
                    checked={isActive}
                    onCheckedChange={(checked: boolean) => setIsActive(checked)}
                  />
                  <Label htmlFor="editIsActive">Kích hoạt</Label>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label className="text-base font-medium">Permissions *</Label>
                {formErrors.permissions && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.permissions}</p>
                )}
                
                <div className="mt-4 space-y-6">
                  {modules.map((module) => {
                    const modulePermissions = getPermissionByModule(module.name);
                    const modulePermissionIds = modulePermissions.map(p => p.id);
                    const hasAllModulePermissions = modulePermissionIds.every(id => selectedPermissions.includes(id));
                    const IconComponent = module.icon;
                    
                    return (
                      <Card key={module.name}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                              <CardTitle className="text-lg">{module.label}</CardTitle>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllPermissions(module.name)}
                            >
                                {hasAllModulePermissions ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <CardDescription>
                              {modulePermissions.filter(p => selectedPermissions.includes(p.id)).length} / {modulePermissions.length} permissions selected
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {modulePermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                              >
                                <Checkbox
                                  id={`edit-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`edit-${permission.id}`} className="font-medium text-sm cursor-pointer">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRole}>
                <Save className="h-4 w-4 mr-2" />
                Update Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
              <h2 className="text-xl font-bold">Delete Role</h2>
              <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete the role <strong>"{roleToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This role is currently assigned to {roleToDelete.userCount} user(s). 
                Deleting this role will remove it from all users.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRole}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try changing search keywords'
                : 'Start creating your first role'
              }
            </p>
            <Button onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Role
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}