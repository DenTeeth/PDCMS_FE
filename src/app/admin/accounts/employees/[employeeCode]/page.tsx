'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { Employee } from '@/types/employee';
import { employeeService } from '@/services/employeeService';
import { toast } from 'sonner';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeCode = params.employeeCode as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (employeeCode) {
      fetchEmployeeDetails();
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await employeeService.deleteEmployee(employeeCode);
      toast.success('Employee deleted successfully');
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
          <p className="text-gray-600">Loading employee details...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
            <p className="text-gray-600">View detailed information about employee</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Edit feature coming soon')}>
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
                  {employee.employeeCode} • {employee.roleName}
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
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Employee Code</Label>
              <p className="font-medium text-lg">{employee.employeeCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">First Name</Label>
                <p className="font-medium">{employee.firstName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Last Name</Label>
                <p className="font-medium">{employee.lastName}</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Full Name</Label>
              <p className="font-medium">{employee.fullName}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <div>
                <Label className="text-gray-600">Date of Birth</Label>
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
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Phone Number</Label>
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
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.account ? (
              <>
                <div>
                  <Label className="text-gray-600">Account ID</Label>
                  <p className="font-medium text-sm break-all">{employee.account.accountId}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Username</Label>
                  <p className="font-medium">{employee.account.username}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium break-all">{employee.account.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Account Status</Label>
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
              <p className="text-gray-500">No account information available</p>
            )}
          </CardContent>
        </Card>

        {/* Role & Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role & Specializations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Role ID</Label>
              <p className="font-medium">{employee.roleId}</p>
            </div>
            <div>
              <Label className="text-gray-600">Role Name</Label>
              <Badge variant="outline" className="text-base px-3 py-1">
                {employee.roleName}
              </Badge>
            </div>
            <div>
              <Label className="text-gray-600">Specializations</Label>
              {employee.specializations && employee.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {employee.specializations.map((spec) => (
                    <Badge key={spec.specializationId} variant="secondary">
                      {spec.specializationName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-1">No specializations</p>
              )}
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
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
