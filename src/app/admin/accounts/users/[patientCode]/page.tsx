'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Users,
  Trash2,
  Image as ImageIcon,
  Hash,
  UserCircle,
  Clock,
  FileText,
  X,
} from 'lucide-react';
import { Patient, UpdatePatientRequest } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';

// Lazy load PatientImageManager để tối ưu performance - chỉ load khi cần
const PatientImageManager = lazy(() => import('@/components/clinical-records/PatientImageManager'));

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientCode = params.patientCode as string;
  const { user } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Unban modal states
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [unbanning, setUnbanning] = useState(false);
  const [showUnbanHistory, setShowUnbanHistory] = useState(false);
  const [unbanHistory, setUnbanHistory] = useState<any[]>([]);
  const [loadingUnbanHistory, setLoadingUnbanHistory] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdatePatientRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: undefined,
    medicalHistory: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isActive: true,
  });

  useEffect(() => {
    if (patientCode) {
      fetchPatientDetails();
    }
  }, [patientCode]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientByCode(patientCode);
      setPatient(data);
    } catch (error: any) {
      console.error('Failed to fetch patient details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch patient details');
      router.push('/admin/accounts/users');
    } finally {
      setLoading(false);
    }
  };

  const loadUnbanHistory = async () => {
    if (!patient?.patientId) return;
    try {
      setLoadingUnbanHistory(true);
      const response = await patientService.getUnbanHistory(patient.patientId, {
        page: 0,
        size: 10,
        sortBy: 'unbannedAt',
        sortDir: 'desc',
      });
      setUnbanHistory(response.content || []);
    } catch (error: any) {
      console.error('Failed to load unban history:', error);
      toast.error('Không thể tải lịch sử unban');
    } finally {
      setLoadingUnbanHistory(false);
    }
  };

  const handleUnban = async () => {
    if (!patient?.patientId) return;
    if (unbanReason.trim().length < 10) {
      toast.error('Lý do unban phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setUnbanning(true);
      await patientService.unbanPatient(patient.patientId, unbanReason.trim());
      toast.success('Đã unban bệnh nhân thành công');
      setShowUnbanModal(false);
      setUnbanReason('');
      // Refresh patient details
      await fetchPatientDetails();
    } catch (error: any) {
      console.error('Failed to unban patient:', error);
      toast.error(error.response?.data?.message || 'Không thể unban bệnh nhân');
    } finally {
      setUnbanning(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await patientService.deletePatient(patientCode);
      toast.success('Patient deleted successfully');
      router.push('/admin/accounts/users');
    } catch (error: any) {
      console.error('Failed to delete patient:', error);
      toast.error(error.response?.data?.message || 'Failed to delete patient');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ==================== EDIT PATIENT ====================
  const openEditModal = () => {
    if (!patient) return;

    setEditFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '',
      address: patient.address || '',
      gender: patient.gender,
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      isActive: patient.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient) return;

    try {
      setUpdating(true);

      // Build partial update payload (only send fields that have values and changed)
      const payload: UpdatePatientRequest = {};

      if (editFormData.firstName && editFormData.firstName !== patient.firstName) {
        payload.firstName = editFormData.firstName;
      }
      if (editFormData.lastName && editFormData.lastName !== patient.lastName) {
        payload.lastName = editFormData.lastName;
      }
      if (editFormData.email && editFormData.email !== patient.email) {
        payload.email = editFormData.email;
      }
      if (editFormData.phone && editFormData.phone !== patient.phone) {
        payload.phone = editFormData.phone;
      }
      if (editFormData.dateOfBirth && editFormData.dateOfBirth !== patient.dateOfBirth) {
        payload.dateOfBirth = editFormData.dateOfBirth;
      }
      if (editFormData.address && editFormData.address !== patient.address) {
        payload.address = editFormData.address;
      }
      if (editFormData.gender && editFormData.gender !== patient.gender) {
        payload.gender = editFormData.gender;
      }
      if (editFormData.medicalHistory && editFormData.medicalHistory !== patient.medicalHistory) {
        payload.medicalHistory = editFormData.medicalHistory;
      }
      if (editFormData.allergies && editFormData.allergies !== patient.allergies) {
        payload.allergies = editFormData.allergies;
      }
      if (editFormData.emergencyContactName && editFormData.emergencyContactName !== patient.emergencyContactName) {
        payload.emergencyContactName = editFormData.emergencyContactName;
      }
      if (editFormData.emergencyContactPhone && editFormData.emergencyContactPhone !== patient.emergencyContactPhone) {
        payload.emergencyContactPhone = editFormData.emergencyContactPhone;
      }
      if (editFormData.isActive !== undefined && editFormData.isActive !== patient.isActive) {
        payload.isActive = editFormData.isActive;
      }

      // Only update if there are changes
      if (Object.keys(payload).length === 0) {
        toast.info('No changes to update');
        setShowEditModal(false);
        return;
      }

      await patientService.updatePatient(patientCode, payload);
      toast.success('Patient updated successfully');
      setShowEditModal(false);
      fetchPatientDetails(); // Refresh patient details
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return gender || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Patient not found</p>
          <Button onClick={() => router.push('/admin/accounts/users')} className="mt-4">
            Back to Patients
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
            onClick={() => router.push('/admin/accounts/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết bệnh nhân</h1>
            <p className="text-gray-600">Xem thông tin chi tiết về bệnh nhân</p>
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

      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.fullName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {patient.patientCode} • {getGenderLabel(patient.gender)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {patient.isBlacklisted && (
                <Badge
                  variant="destructive"
                  className="bg-red-600 text-white px-4 py-2 text-base"
                >
                  ⛔ BLACKLISTED
                </Badge>
              )}
              <Badge
                variant={patient.isActive ? 'default' : 'secondary'}
                className={
                  patient.isActive
                    ? 'bg-green-100 text-green-700 px-4 py-2 text-base'
                    : 'bg-red-100 text-red-700 px-4 py-2 text-base'
                }
              >
                {patient.isActive ? (
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
          </div>
        </CardHeader>
      </Card>

      {/* Blacklist Status Section */}
      {patient.isBlacklisted && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Trạng thái Blacklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Trạng thái</Label>
                  <p className="font-medium text-red-700">BLACKLISTED</p>
                </div>
                <div>
                  <Label className="text-gray-600">Số lần no-show liên tiếp</Label>
                  <p className="font-medium">{patient.consecutiveNoShows || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Bị chặn đặt lịch</Label>
                  <p className="font-medium">{patient.isBookingBlocked ? 'Có' : 'Không'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnbanHistory(true);
                    loadUnbanHistory();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Xem lịch sử unban
                </Button>
                {user?.permissions?.includes('UNBAN_PATIENT') && (
                  <Button
                    variant="default"
                    onClick={() => setShowUnbanModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unban Patient
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consolidated Information Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Row 1: Basic Information (Left) + Contact Information (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information - Left */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Patient Code</Label>
                      <p className="font-medium text-lg">{patient.patientCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Trạng thái</Label>
                      <Badge
                        variant={patient.isActive ? 'default' : 'secondary'}
                        className={
                          patient.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {patient.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Tên</Label>
                      <p className="font-medium">{patient.firstName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Họ</Label>
                      <p className="font-medium">{patient.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Giới tính</Label>
                      <p className="font-medium">{getGenderLabel(patient.gender)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Ngày sinh</Label>
                      <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
                    </div>
                  </div>
                  {patient.isBlacklisted && (
                    <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div className="flex-1">
                        <Label className="text-gray-600">Trạng thái Blacklist</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="bg-red-600 text-white">
                            ⛔ BLACKLISTED
                          </Badge>
                          <span className="text-sm text-gray-600">
                            ({patient.consecutiveNoShows || 0} lần no-show liên tiếp)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information - Right */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Số điện thoại</Label>
                      <p className="font-medium">{patient.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Email</Label>
                      <p className="font-medium break-all">{patient.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Địa chỉ</Label>
                      <p className="font-medium">{patient.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Row 2: Medical Information (Left) + Emergency Contact (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Information - Left */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold">Thông tin y tế</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2 text-gray-700">
                    <FileText className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Tiền sử bệnh lý</Label>
                      <p className="font-medium text-sm whitespace-pre-wrap">
                        {patient.medicalHistory || 'Không có'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Dị ứng</Label>
                      <p className="font-medium text-sm whitespace-pre-wrap">
                        {patient.allergies || 'Không có'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact - Right */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Liên hệ khẩn cấp</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Tên người liên hệ</Label>
                      <p className="font-medium">
                        {patient.emergencyContactName || 'Chưa cung cấp'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <Label className="text-gray-600">Số điện thoại</Label>
                      <p className="font-medium">
                        {patient.emergencyContactPhone || 'Chưa cung cấp'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Images - Lazy loaded để tối ưu performance */}
      {patient.patientId && (() => {
        const patientIdNum = typeof patient.patientId === 'string' ? parseInt(patient.patientId, 10) : Number(patient.patientId);
        if (isNaN(patientIdNum)) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Hình Ảnh Bệnh Nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      Đang tải quản lý hình ảnh...
                    </span>
                  </div>
                }
              >
                <PatientImageManager
                  patientId={patientIdNum}
                  showFilters={true}
                />
              </Suspense>
            </CardContent>
          </Card>
        );
      })()}

      {/* Unban Patient Modal */}
      {showUnbanModal && patient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Unban Patient: {patient.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Patient Code:</strong> {patient.patientCode}</p>
                    <p><strong>Current Status:</strong> <span className="text-red-700 font-semibold">BLACKLISTED</span></p>
                    <p><strong>Consecutive No-Shows:</strong> {patient.consecutiveNoShows || 0}</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Warning:</strong> Unbanning will allow this patient to book appointments again.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unban-reason">
                    Lý do unban <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="unban-reason"
                    value={unbanReason}
                    onChange={(e) => setUnbanReason(e.target.value)}
                    placeholder="Nhập lý do unban (tối thiểu 10 ký tự)..."
                    rows={4}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">
                    Số ký tự: {unbanReason.length} / 10 (tối thiểu)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardContent className="flex justify-end gap-3 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnbanModal(false);
                  setUnbanReason('');
                }}
                disabled={unbanning}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUnban}
                disabled={unbanning || unbanReason.trim().length < 10}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {unbanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác nhận Unban
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unban History Modal */}
      {showUnbanHistory && patient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lịch sử Unban - {patient.fullName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnbanHistory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-6">
              {loadingUnbanHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
                </div>
              ) : unbanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Chưa có lịch sử unban</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unbanHistory.map((record) => (
                    <Card key={record.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-600">Ngày giờ</Label>
                            <p className="font-medium">
                              {new Date(record.unbannedAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Unbanned By</Label>
                            <p className="font-medium">
                              {record.unbannedBy?.fullName} ({record.unbannedBy?.employeeCode})
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Số lần no-show trước đó</Label>
                            <p className="font-medium">{record.previousNoShowCount}</p>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-gray-600">Lý do</Label>
                            <p className="font-medium text-sm whitespace-pre-wrap mt-1">
                              {record.reason}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                Delete Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete patient <strong>{patient.fullName}</strong> ({patient.patientCode})?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will set the patient status to inactive. This action can be reversed later.
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

      {/* ==================== EDIT PATIENT MODAL ==================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle>Chỉnh sửa bệnh nhân - {patient?.patientCode}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-6">
              <form onSubmit={handleUpdatePatient} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">Tên</Label>
                      <Input
                        id="edit-firstName"
                        value={editFormData.firstName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, firstName: e.target.value })
                        }
                        placeholder="Nhập tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Họ</Label>
                      <Input
                        id="edit-lastName"
                        value={editFormData.lastName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, lastName: e.target.value })
                        }
                        placeholder="Nhập họ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Giới tính</Label>
                      <select
                        id="edit-gender"
                        value={editFormData.gender || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dateOfBirth">Ngày sinh</Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={editFormData.dateOfBirth}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Thông tin liên hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, email: e.target.value })
                        }
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Số điện thoại</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-address">Địa chỉ</Label>
                      <Input
                        id="edit-address"
                        value={editFormData.address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, address: e.target.value })
                        }
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Thông tin y tế</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-medicalHistory">Tiền sử bệnh lý</Label>
                      <textarea
                        id="edit-medicalHistory"
                        value={editFormData.medicalHistory}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, medicalHistory: e.target.value })
                        }
                        placeholder="Nhập tiền sử bệnh lý"
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-allergies">Dị ứng</Label>
                      <textarea
                        id="edit-allergies"
                        value={editFormData.allergies}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, allergies: e.target.value })
                        }
                        placeholder="Nhập dị ứng (nếu có)"
                        rows={2}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Liên hệ khẩn cấp</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContactName">Tên người liên hệ</Label>
                      <Input
                        id="edit-emergencyContactName"
                        value={editFormData.emergencyContactName}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            emergencyContactName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên người liên hệ khẩn cấp"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContactPhone">Số điện thoại</Label>
                      <Input
                        id="edit-emergencyContactPhone"
                        value={editFormData.emergencyContactPhone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                        placeholder="Nhập số điện thoại khẩn cấp"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Trạng thái</h3>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isActive">Trạng thái hoạt động</Label>
                    <select
                      id="edit-isActive"
                      value={editFormData.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Không hoạt động</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
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
                        Update Patient
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
