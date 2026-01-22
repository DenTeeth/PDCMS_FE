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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Import types and services
import { Role } from '@/types/employee';
import { Permission } from '@/types/admin';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';

// Helper function: Format role name to Vietnamese
const formatRoleName = (roleName: string): string => {
  const roleNameMap: Record<string, string> = {
    'ROLE_ADMIN': 'quản trị viên',
    'ROLE_MANAGER': 'quản lý',
    'ROLE_EMPLOYEE': 'nhân viên',
    'ROLE_DOCTOR': 'bác sĩ',
    'ROLE_DENTIST': 'nha sĩ',
    'ROLE_NURSE': 'y tá',
    'ROLE_RECEPTIONIST': 'lễ tân',
    'ROLE_ACCOUNTANT': 'kế toán',
    'ROLE_DENTIST_INTERN': 'thực tập sinh',
    'ROLE_PATIENT': 'bệnh nhân',
  };

  return roleNameMap[roleName] || roleName;
};

// ==================== MAIN COMPONENT ====================
export default function RolesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Permission checks - Updated to match BE naming
  const canCreate = user?.permissions?.includes('MANAGE_ROLE') || false;
  const canUpdate = user?.permissions?.includes('MANAGE_ROLE') || false;
  const canDelete = user?.permissions?.includes('MANAGE_ROLE') || false;
  const canView = user?.permissions?.includes('VIEW_ROLE') || false;

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
    baseRoleId: '',
    requiresSpecialization: false,
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
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionFilterAction, setPermissionFilterAction] = useState<string>('ALL');

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ==================== LOCK BODY SCROLL WHEN MODAL OPEN ====================
  useEffect(() => {
    if (showCreateModal || showEditModal || showAssignModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal, showAssignModal, showDeleteModal]);

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
      toast.error(error.response?.data?.message || 'Không thể tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREATE ROLE ====================
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roleId || !formData.roleName || !formData.description || !formData.baseRoleId) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    // Map roleId string to baseRoleId number
    const baseRoleIdMap: { [key: string]: number } = {
      'ROLE_ADMIN': 1,
      'ROLE_EMPLOYEE': 2,
      'ROLE_PATIENT': 3,
    };

    const baseRoleId = baseRoleIdMap[formData.baseRoleId];
    if (!baseRoleId) {
      toast.error('Vai trò cơ bản không hợp lệ');
      return;
    }

    try {
      setCreating(true);
      await roleService.createRole({
        roleId: formData.roleId,
        roleName: formData.roleName,
        description: formData.description,
        baseRoleId: baseRoleId,
        requiresSpecialization: formData.requiresSpecialization,
      });
      toast.success('Role created successfully');
      setShowCreateModal(false);
      setFormData({ roleId: '', roleName: '', description: '', baseRoleId: '', requiresSpecialization: false });
      fetchRoles(); // Refresh list
    } catch (error: any) {
      console.error('Failed to create role:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo vai trò');
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
      toast.error('Vui lòng điền đầy đủ tất cả các trường');
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
      toast.error(error.response?.data?.message || 'Không thể cập nhật vai trò');
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
      toast.error('Không thể tải danh sách quyền');
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
      toast.success('Gán quyền thành công');
      setShowAssignModal(false);
      setAssigningRole(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      console.error('Failed to assign permissions:', error);
      toast.error(error.response?.data?.message || 'Không thể gán quyền');
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
      toast.error(error.response?.data?.message || 'Không thể vô hiệu hóa vai trò');
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
          <p className="text-gray-600">Đang tải vai trò...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['VIEW_ROLE']}
    >
      <div className="space-y-6 p-6">
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý vai trò</h1>
            <p className="text-gray-600">Xem và quản lý vai trò hệ thống</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreate}
            title={!canCreate ? "Bạn không có quyền tạo vai trò" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo vai trò
          </Button>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số vai trò</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          {/* Active */}
          <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">Hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <p className="text-3xl font-bold text-green-800">{stats.active}</p>
            </div>
          </div>

          {/* Inactive */}
          <div className="bg-gray-50 rounded-xl border border-gray-300 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Không hoạt động</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-gray-700" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.inactive}</p>
            </div>
          </div>
        </div>

        {/* ==================== SEARCH ==================== */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Tìm theo tên vai trò, mô tả, hoặc ID..."
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
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map((role) => (
                      <tr key={role.roleId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {role.roleName}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                {role.roleId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate">
                            {role.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={role.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}>
                            {role.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/roles/${role.roleId}`)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(role);
                              }}
                              disabled={!canUpdate}
                              title={!canUpdate ? 'Bạn không có quyền chỉnh sửa vai trò' : 'Edit'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal(role);
                              }}
                              disabled={!canUpdate}
                              title={!canUpdate ? 'Bạn không có quyền phân quyền' : 'Permissions'}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(role);
                              }}
                              disabled={!canDelete}
                              title={!canDelete ? 'Bạn không có quyền xóa vai trò' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Tạo vai trò mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleId">
                      Mã vai trò <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="roleId"
                      placeholder="VD: ROLE_CUSTOM"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      disabled={creating}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chỉ sử dụng chữ hoa, gạch dưới và số
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleName">
                      Tên vai trò <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="roleName"
                      placeholder="VD: Vai trò tùy chỉnh"
                      value={formData.roleName}
                      onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                      disabled={creating}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Mô tả <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="description"
                      placeholder="Mô tả mục đích và trách nhiệm của vai trò..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={creating}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseRoleId">
                      Vai trò cơ sở <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="baseRoleId"
                      value={formData.baseRoleId}
                      onChange={(e) => setFormData({ ...formData, baseRoleId: e.target.value })}
                      disabled={creating}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="">Chọn vai trò cơ sở</option>
                      <option value="ROLE_ADMIN">Quản trị viên (ROLE_ADMIN)</option>
                      <option value="ROLE_EMPLOYEE">Nhân viên (ROLE_EMPLOYEE)</option>
                      <option value="ROLE_PATIENT">Bệnh nhân (ROLE_PATIENT)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Chọn vai trò cơ sở để kế thừa quyền hạn
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requiresSpecialization"
                        checked={formData.requiresSpecialization}
                        onChange={(e) => setFormData({ ...formData, requiresSpecialization: e.target.checked })}
                        disabled={creating}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="requiresSpecialization" className="cursor-pointer">
                        Yêu cầu chuyên môn
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Đánh dấu nếu vai trò này yêu cầu chuyên môn (VD: bác sĩ)
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({ roleId: '', roleName: '', description: '', baseRoleId: '', requiresSpecialization: false });
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
                          Tạo vai trò
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateRole} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role ID</Label>
                    <Input
                      value={editingRole.roleId}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">Role ID cannot be changed</p>
                  </div>

                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="editDescription">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="editDescription"
                      placeholder="Mô tả mục đích và trách nhiệm của vai trò..."
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      disabled={updating}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          Đang cập nhật...
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Phân quyền cho {formatRoleName(assigningRole.roleName)}
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto relative">
                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Đang tải quyền hạn...</span>
                  </div>
                ) : (
                  <div className="space-y-3 px-6">
                    {/* Sticky Header with Search and Filters */}
                    <div className="flex flex-col gap-4 py-4 border-b sticky top-0 bg-white z-10">
                      {/* Title and Counter */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-gray-800">
                            Chọn quyền hạn cho vai trò này
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedPermissions.length} / {allPermissions.length} quyền đã chọn
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (expandedModules.length > 0) {
                                setExpandedModules([]);
                              } else {
                                const allModules = Object.keys(
                                  allPermissions.reduce((acc, p) => {
                                    acc[p.module] = true;
                                    return acc;
                                  }, {} as Record<string, boolean>)
                                );
                                setExpandedModules(allModules);
                              }
                            }}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300"
                          >
                            {expandedModules.length > 0 ? 'Đóng tất cả' : 'Mở tất cả'}
                          </Button>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedPermissions.length > 0) {
                                setSelectedPermissions([]);
                              } else {
                                setSelectedPermissions(allPermissions.map((p) => p.permissionId));
                              }
                            }}
                            className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-300"
                          >
                            {selectedPermissions.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                          </Button>
                        </div>
                      </div>

                      {/* Search and Filter */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Tìm kiếm quyền theo tên..."
                            value={permissionSearchTerm}
                            onChange={(e) => setPermissionSearchTerm(e.target.value)}
                            className="pl-10 text-sm"
                          />
                        </div>
                        <select
                          value={permissionFilterAction}
                          onChange={(e) => setPermissionFilterAction(e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
                        >
                          <option value="ALL">Tất cả chức năng</option>
                          <option value="VIEW">VIEW - Xem</option>
                          <option value="CREATE">CREATE - Tạo</option>
                          <option value="UPDATE">UPDATE - Cập nhật</option>
                          <option value="DELETE">DELETE - Xóa</option>
                          <option value="MANAGE">MANAGE - Quản lý</option>
                          <option value="APPROVE">APPROVE - Phê duyệt</option>
                          <option value="REJECT">REJECT - Từ chối</option>
                        </select>
                        {(permissionSearchTerm || permissionFilterAction !== 'ALL') && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPermissionSearchTerm('');
                              setPermissionFilterAction('ALL');
                            }}
                            className="text-xs whitespace-nowrap"
                          >
                            Xóa filter
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Group permissions by module - Dropdown Accordion */}
                    {Object.entries(
                      allPermissions
                        .filter(permission => {
                          // Filter by search term
                          const matchesSearch = permissionSearchTerm === '' ||
                            permission.permissionName.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                            permission.permissionId.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                            (permission.description && permission.description.toLowerCase().includes(permissionSearchTerm.toLowerCase()));

                          // Filter by action type
                          const matchesAction = permissionFilterAction === 'ALL' ||
                            permission.permissionName.toUpperCase().startsWith(permissionFilterAction);

                          return matchesSearch && matchesAction;
                        })
                        .reduce((acc, permission) => {
                          if (!acc[permission.module]) {
                            acc[permission.module] = [];
                          }
                          acc[permission.module].push(permission);
                          return acc;
                        }, {} as Record<string, Permission[]>)
                    )
                      .sort(([moduleA], [moduleB]) => moduleA.localeCompare(moduleB)) // Sort modules alphabetically
                      .map(([module, permissions]) => {
                        const isExpanded = expandedModules.includes(module);
                        const modulePermissionsSelected = permissions.filter(p => selectedPermissions.includes(p.permissionId)).length;

                        return (
                          <div key={module} className="border rounded-lg overflow-hidden">
                            {/* Module Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedModules(prev =>
                                    prev.includes(module)
                                      ? prev.filter(m => m !== module)
                                      : [...prev, module]
                                  );
                                }}
                                className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-600" />
                                )}
                                <h3 className="font-semibold text-lg">{module}</h3>
                                <Badge variant="outline">
                                  {modulePermissionsSelected}/{permissions.length}
                                </Badge>
                              </button>

                              {/* Group Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const modulePermissionIds = permissions.map(p => p.permissionId);
                                    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));

                                    if (allSelected) {
                                      // Xóa hết
                                      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
                                    } else {
                                      // Chọn hết
                                      setSelectedPermissions(prev => {
                                        const filtered = prev.filter(id => !modulePermissionIds.includes(id));
                                        return [...filtered, ...modulePermissionIds];
                                      });
                                    }
                                  }}
                                  className="text-xs px-2 py-1 h-7 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300"
                                >
                                  {permissions.every(p => selectedPermissions.includes(p.permissionId)) ? 'Xóa hết' : 'Chọn hết'}
                                </Button>
                              </div>
                            </div>

                            {/* Module Content - Collapsible - Table Format */}
                            {isExpanded && (
                              <div className="bg-white">
                                <table className="w-full">
                                  <thead className="bg-gray-100 border-y">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Tên quyền
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Mô tả
                                      </th>
                                      <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                        Permission ID
                                      </th>
                                      <th className="w-12 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                        Chọn
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {permissions
                                      .sort((a, b) => a.permissionName.localeCompare(b.permissionName))
                                      .map((permission) => (
                                        <tr
                                          key={permission.permissionId}
                                          className={`hover:bg-gray-50 cursor-pointer transition ${selectedPermissions.includes(permission.permissionId)
                                            ? 'bg-blue-50'
                                            : ''
                                            }`}
                                          onClick={() => handlePermissionToggle(permission.permissionId)}
                                        >
                                          <td className="px-4 py-3">
                                            <div className="font-medium text-sm text-gray-900">
                                              {permission.permissionName}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-sm text-gray-600">
                                              {permission.description || '-'}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                              {permission.permissionId}
                                            </code>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <input
                                              type="checkbox"
                                              checked={selectedPermissions.includes(permission.permissionId)}
                                              onChange={() => handlePermissionToggle(permission.permissionId)}
                                              onClick={(e) => e.stopPropagation()}
                                              className="cursor-pointer w-4 h-4"
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Sticky Action Buttons - Inside Modal */}
              <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 flex gap-3 justify-end z-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningRole(null);
                    setSelectedPermissions([]);
                    setExpandedModules([]);
                    setPermissionSearchTerm('');
                    setPermissionFilterAction('ALL');
                  }}
                  disabled={assigning}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAssignPermissions}
                  disabled={assigning || loadingPermissions}
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Lưu quyền hạn
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
        {showDeleteModal && deletingRole && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
    </ProtectedRoute >
  );
}
