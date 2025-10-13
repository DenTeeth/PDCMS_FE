'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Key,
  Lock,
  Trash2,
} from 'lucide-react';
import { Role, Permission } from '@/types/employee';
import { roleService } from '@/services/roleService';
import { toast } from 'sonner';

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.roleId as string;

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    roleName: '',
    description: '',
  });

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (roleId) {
      fetchRoleDetails();
      fetchRolePermissions();
    }
  }, [roleId]);

  const fetchRoleDetails = async () => {
    try {
      setLoading(true);
      const data = await roleService.getRoleById(roleId);
      setRole(data);
    } catch (error: any) {
      console.error('Failed to fetch role details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch role details');
      router.push('/admin/roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      setLoadingPermissions(true);
      const data = await roleService.getRolePermissions(roleId);
      setPermissions(data || []);
    } catch (error: any) {
      console.error('Failed to fetch role permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // ==================== EDIT ROLE ====================
  const openEditModal = () => {
    if (!role) return;
    setEditFormData({
      roleName: role.roleName,
      description: role.description,
    });
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role || !editFormData.roleName || !editFormData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setUpdating(true);
      await roleService.updateRole(role.roleId, editFormData);
      toast.success('Role updated successfully');
      setShowEditModal(false);
      fetchRoleDetails(); // Refresh role data
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  // ==================== DELETE ROLE ====================
  const handleDeleteRole = async () => {
    if (!role) return;

    try {
      setDeleting(true);
      await roleService.deleteRole(role.roleId);
      toast.success(`Role "${role.roleName}" deactivated successfully`);
      router.push('/admin/roles'); // Navigate back to list
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate role');
    } finally {
      setDeleting(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Role not found</p>
          <Button onClick={() => router.push('/admin/roles')} className="mt-4">
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/roles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Details</h1>
            <p className="text-gray-600">View detailed information about role</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditModal}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Role Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{role.roleName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{role.roleId}</p>
              </div>
            </div>
            <Badge
              variant={role.isActive ? 'default' : 'secondary'}
              className={
                role.isActive
                  ? 'bg-green-100 text-green-700 px-4 py-2 text-base'
                  : 'bg-red-100 text-red-700 px-4 py-2 text-base'
              }
            >
              {role.isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Role ID</Label>
              <p className="font-medium text-lg">{role.roleId}</p>
            </div>
            <div>
              <Label className="text-gray-600">Role Name</Label>
              <p className="font-medium">{role.roleName}</p>
            </div>
            <div>
              <Label className="text-gray-600">Description</Label>
              <p className="font-medium text-sm">{role.description}</p>
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
              <Badge
                variant={role.isActive ? 'default' : 'secondary'}
                className={
                  role.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {role.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-600">Created At</Label>
              <p className="font-medium">
                {role.createdAt
                  ? new Date(role.createdAt).toLocaleString('en-US')
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permission Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Permission Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPermissions ? (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading permissions...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                      <p className="text-2xl font-bold text-purple-600">{permissions.length}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 mb-2">Resources</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(groupedPermissions).length > 0 ? (
                      Object.keys(groupedPermissions).map((resource) => (
                        <Badge key={resource} variant="outline" className="text-sm">
                          {resource} ({groupedPermissions[resource].length})
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No permissions assigned</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPermissions ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading permissions...</p>
            </div>
          ) : permissions.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {resource}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((permission) => (
                      <div
                        key={permission.permissionId}
                        className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {permission.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-1">
                          {permission.resource}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions</h3>
              <p className="text-gray-500">This role has no permissions assigned</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== EDIT ROLE MODAL ==================== */}
      {showEditModal && role && (
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
                    value={role.roleId}
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

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && role && (
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
                  <strong>Note:</strong> This will soft delete the role "{role.roleName}". 
                  The role will be marked as inactive (isActive = false) and cannot be assigned to new employees.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Role ID:</strong> <span className="font-mono">{role.roleId}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Role Name:</strong> {role.roleName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Description:</strong> {role.description}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to deactivate this role? You will be redirected to the roles list.
              </p>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
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
