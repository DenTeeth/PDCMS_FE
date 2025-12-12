'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faEdit,
  faSave,
  faTimes,
  faShieldAlt,
  faHeart,
  faBan,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { 
  getBookingBlockReasonLabel,
  isTemporaryBlock 
} from '@/types/patientBlockReason';
import { patientService } from '@/services/patientService';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Patient | null>(null);

  // Fetch patient profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await patientService.getCurrentPatientProfile();
        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Không tìm thấy thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hồ sơ của tôi</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân và tùy chọn của bạn</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex items-center">
                <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" />
                Hủy
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center">
              <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
              Chỉnh sửa hồ sơ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Thông tin cơ bản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="font-semibold">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName || ''}
                    disabled={true}
                    className="font-semibold text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="patientCode" className="font-semibold">Mã bệnh nhân</Label>
                  <Input
                    id="patientCode"
                    value={profile.patientCode || ''}
                    disabled={true}
                    className="font-semibold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="font-semibold text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="font-semibold">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className="font-semibold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="font-semibold">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth || ''}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    disabled={!isEditing}
                    className="font-semibold text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="font-semibold">Giới tính</Label>
                  <Input
                    id="gender"
                    value={profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    disabled={true}
                    className="font-semibold text-black"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="font-semibold">Địa chỉ</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  disabled={!isEditing}
                  className="font-semibold text-black"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faPhone} className="mr-2 h-5 w-5" />
                Liên hệ khẩn cấp
              </CardTitle>
              <CardDescription>
                Thông tin liên hệ trong trường hợp khẩn cấp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName" className="font-semibold">Tên người liên hệ</Label>
                  <Input
                    id="emergencyName"
                    value={profile.emergencyContactName || ''}
                    onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                    disabled={!isEditing}
                    className="font-semibold text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone" className="font-semibold">Số điện thoại</Label>
                  <Input
                    id="emergencyPhone"
                    value={profile.emergencyContactPhone || ''}
                    onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                    disabled={!isEditing}
                    className="font-semibold text-black"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical History Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faHeart} className="mr-2 h-5 w-5" />
                Lịch sử y tế
              </CardTitle>
              <CardDescription>
                Thông tin sức khỏe của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Dị ứng</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies ? (
                    profile.allergies.split(',').map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="font-semibold">{allergy.trim()}</Badge>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-black">Không có</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Lịch sử bệnh</h4>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-black whitespace-pre-wrap">
                    {profile.medicalHistory || 'Không có lịch sử bệnh'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Trạng thái tài khoản</span>
                  <Badge variant="default" className="font-semibold">Hoạt động</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Trạng thái đặt lịch</span>
                  {profile.isBookingBlocked ? (
                    <Badge 
                      variant="destructive" 
                      className={`font-semibold ${
                        isTemporaryBlock(profile.bookingBlockReason)
                          ? 'bg-orange-600'
                          : 'bg-red-600'
                      }`}
                    >
                      <FontAwesomeIcon icon={faBan} className="mr-1 h-3 w-3" />
                      {isTemporaryBlock(profile.bookingBlockReason) ? 'Tạm chặn' : 'Bị chặn'}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 font-semibold">Có thể đặt lịch</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Ngày tạo tài khoản</span>
                  <span className="text-sm font-semibold text-black">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Cập nhật lần cuối</span>
                  <span className="text-sm font-semibold text-black">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Block Details (if blocked) */}
          {profile.isBookingBlocked && (
            <Card className={
              isTemporaryBlock(profile.bookingBlockReason)
                ? 'border-orange-300 bg-orange-50'
                : 'border-red-300 bg-red-50'
            }>
              <CardHeader>
                <CardTitle className={`flex items-center text-base ${
                  isTemporaryBlock(profile.bookingBlockReason)
                    ? 'text-orange-700'
                    : 'text-red-700'
                }`}>
                  <FontAwesomeIcon icon={faBan} className="mr-2 h-4 w-4" />
                  {isTemporaryBlock(profile.bookingBlockReason) 
                    ? 'Tạm thời bị chặn đặt lịch' 
                    : 'Bị chặn đặt lịch'}
                </CardTitle>
                <CardDescription>
                  {profile.bookingBlockReason && getBookingBlockReasonLabel(profile.bookingBlockReason)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.bookingBlockNotes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Chi tiết:</h4>
                    <p className="text-sm font-semibold text-black whitespace-pre-wrap">
                      {profile.bookingBlockNotes}
                    </p>
                  </div>
                )}
                {profile.consecutiveNoShows !== undefined && profile.consecutiveNoShows > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Số lần no-show:</span>
                    <Badge variant="outline" className="border-orange-600 text-orange-700 font-semibold">
                      {profile.consecutiveNoShows} lần
                    </Badge>
                  </div>
                )}
                {profile.blockedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Thời gian chặn:</span>
                    <span className="text-sm font-semibold text-black">
                      {new Date(profile.blockedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                <div className={`p-3 border rounded-lg ${
                  isTemporaryBlock(profile.bookingBlockReason)
                    ? 'bg-orange-100 border-orange-300'
                    : 'bg-red-100 border-red-300'
                }`}>
                  <p className={`text-sm ${
                    isTemporaryBlock(profile.bookingBlockReason)
                      ? 'text-orange-800'
                      : 'text-red-800'
                  }`}>
                    <strong>⚠️ Lưu ý:</strong> Bạn hiện không thể đặt lịch hẹn. 
                    {isTemporaryBlock(profile.bookingBlockReason)
                      ? ' Trạng thái này sẽ được tự động gỡ bỏ khi bạn đến khám theo đúng lịch hẹn.'
                      : ' Vui lòng liên hệ quản trị viên để biết thêm chi tiết.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

