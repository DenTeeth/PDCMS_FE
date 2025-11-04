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
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Plus,
  Edit,
  Key,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// Import types and services
import { Role } from '@/types/employee';
import { Permission } from '@/types/admin';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';

// ==================== MAIN COMPONENT ====================
export default function RolesPage() {
  const router = useRouter();

  // State management
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    roleId: '',
    roleName: '',
    description: '',
  });

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    roleName: '',
    description: '',
  });

  // Assign permissions modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningRole, setAssigningRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ==================== FETCH ROLES ====================
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();
      setRoles(response || []);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREATE ROLE ====================
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roleId || !formData.roleName || !formData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setCreating(true);
      await roleService.createRole(formData);
      toast.success('Role created successfully');
      setShowCreateModal(false);
      setFormData({ roleId: '', roleName: '', description: '' });
      fetchRoles(); // Refresh list
    } catch (error: any) {
      console.error('Failed to create role:', error);
      toast.error(error.response?.data?.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  // ==================== EDIT ROLE ====================
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setEditFormData({
      roleName: role.roleName,
      description: role.description,
    });
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRole || !editFormData.roleName || !editFormData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setUpdating(true);
      await roleService.updateRole(editingRole.roleId, editFormData);
      toast.success('Role updated successfully');
      setShowEditModal(false);
      setEditingRole(null);
      fetchRoles(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  // ==================== ASSIGN PERMISSIONS ====================
  const openAssignModal = async (role: Role) => {
    setAssigningRole(role);
    setShowAssignModal(true);
    setLoadingPermissions(true);

    try {
      // Fetch all permissions
      const permissions = await permissionService.getPermissions();
      setAllPermissions(permissions);

      // Fetch current role permissions
      const rolePermissions = await roleService.getRolePermissions(role.roleId);
      const currentPermissionIds = rolePermissions.map((p) => p.permissionId);
      setSelectedPermissions(currentPermissionIds);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleAssignPermissions = async () => {
    if (!assigningRole) return;

    try {
      setAssigning(true);
      await roleService.assignPermissionsToRole(assigningRole.roleId, selectedPermissions);
      toast.success('Permissions assigned successfully');
      setShowAssignModal(false);
      setAssigningRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      console.error('Failed to assign permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to assign permissions');
    } finally {
      setAssigning(false);
    }
  };

  // ==================== DELETE ROLE ====================
  const openDeleteModal = (role: Role) => {
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setDeleting(true);
      await roleService.deleteRole(deletingRole.roleId);
      toast.success(`Role "${deletingRole.roleName}" deactivated successfully`);
      setShowDeleteModal(false);
      setDeletingRole(null);
      fetchRoles(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate role');
    } finally {
      setDeleting(false);
    }
  };

  // ==================== FILTER ROLES ====================
  const filteredRoles = (roles || []).filter(role => {
    const matchesSearch = role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ==================== STATS ====================
  const stats = {
    total: roles.length,
    active: roles.filter(r => r.isActive).length,
    inactive: roles.filter(r => !r.isActive).length,
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">View and manage system roles</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Roles */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Total Roles</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        {/* Active */}
        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Active</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <p className="text-3xl font-bold text-green-800">{stats.active}</p>
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Inactive</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="h-6 w-6 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-red-800">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* ==================== SEARCH ==================== */}
      <Card>
        <CardContent className="p-6">
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Search by role name, description, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== ROLES TABLE ==================== */}
      {filteredRoles.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.roleId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {role.roleName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {role.roleId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {role.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {role.createdAt ? new Date(role.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/roles/${role.roleId}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(role);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignModal(role);
                            }}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Permissions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(role);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try changing search keywords'
                : 'No roles available'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* ==================== CREATE ROLE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Create New Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <Label htmlFor="roleId">
                    Role ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="roleId"
                    placeholder="e.g., ROLE_CUSTOM"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    disabled={creating}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use uppercase letters, underscores, and numbers only
                  </p>
                </div>

                <div>
                  <Label htmlFor="roleName">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="roleName"
                    placeholder="e.g., Custom Role"
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    disabled={creating}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Describe the role's purpose and responsibilities..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={creating}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ roleId: '', roleName: '', description: '' });
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
                        Create Role
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== EDIT ROLE MODAL ==================== */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <Label>Role ID</Label>
                  <Input
                    value={editingRole.roleId}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role ID cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="editRoleName">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="editRoleName"
                    placeholder="e.g., Custom Role"
                    value={editFormData.roleName}
                    onChange={(e) => setEditFormData({ ...editFormData, roleName: e.target.value })}
                    disabled={updating}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editDescription">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="editDescription"
                    placeholder="Describe the role's purpose and responsibilities..."
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    disabled={updating}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRole(null);
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
                        Update Role
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== ASSIGN PERMISSIONS MODAL ==================== */}
      {showAssignModal && assigningRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Assign Permissions to {assigningRole.roleName}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading permissions...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <p className="text-sm text-gray-600">
                      Select permissions for this role ({selectedPermissions.length} selected)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPermissions(allPermissions.map((p) => p.permissionId))}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPermissions([])}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Group permissions by module */}
                  {Object.entries(
                    allPermissions.reduce((acc, permission) => {
                      if (!acc[permission.module]) {
                        acc[permission.module] = [];
                      }
                      acc[permission.module].push(permission);
                      return acc;
                    }, {} as Record<string, Permission[]>)
                  ).map(([module, permissions]) => (
                    <div key={module} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        {module}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <label
                            key={permission.permissionId}
                            className={`flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition ${selectedPermissions.includes(permission.permissionId)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.permissionId)}
                              onChange={() => handlePermissionToggle(permission.permissionId)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{permission.permissionName}</div>
                              <div className="text-xs text-gray-500 mt-1">{permission.description}</div>
                              <div className="text-xs text-gray-400 mt-1 font-mono">
                                {permission.permissionId}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6 mt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningRole(null);
                    setSelectedPermissions([]);
                  }}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignPermissions}
                  disabled={assigning || loadingPermissions}
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Assign Permissions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && deletingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will soft delete the role "{deletingRole.roleName}".
                  The role will be marked as inactive (isActive = false) and cannot be assigned to new employees.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Role ID:</strong> <span className="font-mono">{deletingRole.roleId}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Role Name:</strong> {deletingRole.roleName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Description:</strong> {deletingRole.description}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to deactivate this role?
              </p>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingRole(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteRole}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate Role
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
