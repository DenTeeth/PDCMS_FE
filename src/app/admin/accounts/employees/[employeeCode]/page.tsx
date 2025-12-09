'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { Employee, UpdateEmployeeRequest, EmploymentType } from '@/types/employee';
import { Role } from '@/types/employee';
import { employeeService } from '@/services/employeeService';
import { roleService } from '@/services/roleService';
import { Specialization } from '@/types/specialization';
import { specializationService } from '@/services/specializationService';
import { toast } from 'sonner';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeCode = params.employeeCode as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateEmployeeRequest>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    roleId: '',
    specializationIds: [],
  });

  useEffect(() => {
    if (employeeCode) {
      fetchEmployeeDetails();
      fetchRoles();
      fetchSpecializations();
    }
  }, [employeeCode]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeByCode(employeeCode);
      setEmployee(data);
    } catch (error: any) {
      console.error('Failed to fetch employee details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch employee details');
      router.push('/admin/accounts/employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    }
  };

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

  const openEditModal = () => {
    if (employee) {
      setEditFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth || '',
        address: employee.address || '',
        roleId: employee.roleId || '',
        specializationIds: employee.specializations?.map((s: any) => s.specializationId) || [],
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      setUpdating(true);

      // Build partial update payload
      const payload: UpdateEmployeeRequest = {};

      if (editFormData.firstName && editFormData.firstName !== employee.firstName) {
        payload.firstName = editFormData.firstName;
      }
      if (editFormData.lastName && editFormData.lastName !== employee.lastName) {
        payload.lastName = editFormData.lastName;
      }
      if (editFormData.phone && editFormData.phone !== employee.phone) {
        payload.phone = editFormData.phone;
      }
      if (editFormData.dateOfBirth && editFormData.dateOfBirth !== employee.dateOfBirth) {
        payload.dateOfBirth = editFormData.dateOfBirth;
      }
      if (editFormData.address && editFormData.address !== employee.address) {
        payload.address = editFormData.address;
      }
      if (editFormData.roleId && editFormData.roleId !== employee.roleId) {
        payload.roleId = editFormData.roleId;
      }

      // Check if specializations changed (for Doctor/Nurse)
      const currentSpecIds = employee.specializations?.map((s: any) => s.specializationId).sort() || [];
      const newSpecIds = editFormData.specializationIds?.sort() || [];
      const specializationsChanged = JSON.stringify(currentSpecIds) !== JSON.stringify(newSpecIds);

      if (specializationsChanged && editFormData.specializationIds) {
        payload.specializationIds = editFormData.specializationIds;
      }

      // Only update if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info('No changes to update');
        setShowEditModal(false);
        return;
      }

      await employeeService.updateEmployee(employee.employeeCode, payload);
      toast.success('Employee updated successfully');
      setShowEditModal(false);

      // Refresh employee details
      await fetchEmployeeDetails();
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await employeeService.deleteEmployee(employeeCode);
      toast.success('Xóa nhân viên thành công');
      router.push('/admin/accounts/employees');
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải chi tiết nhân viên...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Employee not found</p>
          <Button onClick={() => router.push('/admin/accounts/employees')} className="mt-4">
            Back to Employees
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
            onClick={() => router.push('/admin/accounts/employees')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết nhân viên</h1>
            <p className="text-gray-600">Xem thông tin chi tiết về nhân viên</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditModal}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Employee Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{employee.fullName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {employee.employeeCode} • {employee.roleName} •
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${employee.employeeType === EmploymentType.FULL_TIME
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {employee.employeeType === EmploymentType.FULL_TIME ? 'Toàn thời gian' : 'Bán thời gian'}
                  </span>
                </p>
              </div>
            </div>
            <Badge
              variant={employee.isActive ? 'default' : 'secondary'}
              className={
                employee.isActive
                  ? 'bg-green-100 text-green-700 px-4 py-2 text-base'
                  : 'bg-red-100 text-red-700 px-4 py-2 text-base'
              }
            >
              {employee.isActive ? (
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
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Mã nhân viên</Label>
              <p className="font-medium text-lg">{employee.employeeCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Tên</Label>
                <p className="font-medium">{employee.firstName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Họ</Label>
                <p className="font-medium">{employee.lastName}</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Họ và tên</Label>
              <p className="font-medium">{employee.fullName}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <div>
                <Label className="text-gray-600">Ngày sinh</Label>
                <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Thông tin liên hệ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Số điện thoại</Label>
                <p className="font-medium">{employee.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Email</Label>
                <p className="font-medium break-all">
                  {employee.account?.email || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Address</Label>
                <p className="font-medium">{employee.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.account ? (
              <>
                <div>
                  <Label className="text-gray-600">ID tài khoản</Label>
                  <p className="font-medium text-sm break-all">{employee.account.accountId}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Tên đăng nhập</Label>
                  <p className="font-medium">{employee.account.username}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium break-all">{employee.account.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Trạng thái tài khoản</Label>
                  <Badge
                    variant={employee.account.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={
                      employee.account.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {employee.account.status}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Không có thông tin tài khoản</p>
            )}
          </CardContent>
        </Card>

        {/* Role & Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Vai trò & Chuyên khoa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">ID vai trò</Label>
              <p className="font-medium">{employee.roleId}</p>
            </div>
            <div>
              <Label className="text-gray-600">Tên vai trò</Label>
              <Badge variant="outline" className="text-base px-3 py-1">
                {employee.roleName}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-600">Loại hình lao động</Label>
              <Badge
                variant="outline"
                className={`text-base px-3 py-1 ${employee.employeeType === EmploymentType.FULL_TIME
                  ? 'border-blue-200 text-blue-800'
                  : 'border-orange-200 text-orange-800'
                  }`}
              >
                {employee.employeeType === EmploymentType.FULL_TIME ? 'Toàn thời gian' : 'Bán thời gian'}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-600">Chuyên khoa</Label>
              {employee.specializations && employee.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {employee.specializations.map((spec: any) => (
                    <Badge key={spec.specializationId} variant="default">
                      {spec.name || spec.specializationName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-1">Không có chuyên khoa</p>
              )}
            </div>
            <div>
              <Label className="text-gray-600">Trạng thái</Label>
              <Badge
                variant={employee.isActive ? 'default' : 'secondary'}
                className={
                  employee.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {employee.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-600">Employee ID</Label>
              <p className="font-medium text-sm break-all">{employee.employeeId}</p>
            </div>
            <div>
              <Label className="text-gray-600">Created At</Label>
              <p className="font-medium">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleString('en-US')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Last Updated</Label>
              <p className="font-medium">
                {employee.updatedAt
                  ? new Date(employee.updatedAt).toLocaleString('en-US')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Employee Modal */}
      {showEditModal && employee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle>Chỉnh sửa nhân viên</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-6">
              <form onSubmit={handleUpdateEmployee} className="space-y-6">
                {/* Employee Info */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee Code</p>
                      <p className="font-semibold">{employee.employeeCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Role</p>
                      <Badge>{employee.roleName}</Badge>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Vai trò</Label>
                  <Select
                    value={editFormData.roleId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, roleId: value })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Thay đổi vai trò nhân viên nếu cần
                  </p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        placeholder="Nhập tên"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Last Name</Label>
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
                    <Input
                      id="edit-address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                {/* Specializations - Only for Doctor/Nurse */}
                {(employee.roleName === 'ROLE_DOCTOR' || employee.roleName === 'ROLE_NURSE') && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Chuyên khoa</h3>
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
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
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

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditFormData({
                        firstName: '',
                        lastName: '',
                        phone: '',
                        dateOfBirth: '',
                        address: '',
                        roleId: '',
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete employee <strong>{employee.fullName}</strong> ({employee.employeeCode})?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will set the employee status to inactive. This action can be reversed later.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
