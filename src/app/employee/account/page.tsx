'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, MapPin, Calendar, Shield, Hash } from 'lucide-react';
import { authenticationService } from '@/services/authenticationService';
import { employeeService } from '@/services/employeeService';
import { UserProfileResponse } from '@/types/account';
import { Employee } from '@/types/employee';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getEmployeeCodeFromToken, getFullNameFromToken } from '@/lib/utils';
import { getToken } from '@/lib/cookies';

export default function EmployeeAccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const employeeCode = token ? getEmployeeCodeFromToken(token) : null;
      
      // Fetch account profile
      const profileData = await authenticationService.getAccountProfile();
      setProfile(profileData);
      
      // Fetch employee details to get full specializations list
      if (employeeCode) {
        try {
          const employeeData = await employeeService.getEmployeeByCode(employeeCode);
          setEmployee(employeeData);
        } catch (error: any) {
          console.warn('Could not fetch employee details:', error);
          // Continue without employee data - will use profile data only
        }
      }
    } catch (error: any) {
      console.error('Error fetching account profile:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Không tìm thấy thông tin tài khoản</p>
      </div>
    );
  }

  // Get additional info from JWT token
  const token = getToken();
  const employeeCode = token ? getEmployeeCodeFromToken(token) : null;
  const fullNameFromToken = token ? getFullNameFromToken(token) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Chi tiết tài khoản</h1>
        <p className="text-muted-foreground">Thông tin tài khoản và cá nhân của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Thông tin tài khoản
              </CardTitle>
              <CardDescription>
                Thông tin đăng nhập và quyền truy cập
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Tên đăng nhập</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium break-all">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <Badge 
                      variant={profile.accountStatus === 'ACTIVE' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {profile.accountStatus === 'ACTIVE' ? 'Hoạt động' : profile.accountStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {profile.roles && profile.roles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Vai trò</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.roles.map((role, index) => (
                      <Badge key={index} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          {(profile.fullName || profile.phoneNumber || profile.address || profile.dateOfBirth) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                  Thông tin cơ bản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.fullName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Họ và tên</p>
                        <p className="font-medium">{profile.fullName}</p>
                      </div>
                    </div>
                  )}
                  {employeeCode && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Mã nhân viên</p>
                        <p className="font-medium">{employeeCode}</p>
                      </div>
                    </div>
                  )}
                  {profile.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Số điện thoại</p>
                        <p className="font-medium">{profile.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {profile.dateOfBirth && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Ngày sinh</p>
                        <p className="font-medium">
                          {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Địa chỉ</p>
                        <p className="font-medium">{profile.address}</p>
                      </div>
                    </div>
                  )}
                  {/* Specializations - Display all like admin page */}
                  {employee?.specializations && employee.specializations.length > 0 ? (
                    <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
                      <Shield className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Chuyên khoa</p>
                        <div className="flex flex-wrap gap-2">
                          {employee.specializations.map((spec: any) => (
                            <Badge key={spec.specializationId} variant="default">
                              {spec.name || spec.specializationName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (profile.specializationNames && profile.specializationNames.length > 0) || profile.specializationName ? (
                    <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Chuyên khoa</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.specializationNames && profile.specializationNames.length > 0 ? (
                            profile.specializationNames.map((spec, index) => (
                              <Badge key={index} variant="default">
                                {spec}
                              </Badge>
                            ))
                          ) : profile.specializationName ? (
                            <Badge variant="default">
                              {profile.specializationName}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trạng thái tài khoản</span>
                <Badge 
                  variant={profile.accountStatus === 'ACTIVE' ? 'default' : 'destructive'}
                >
                  {profile.accountStatus === 'ACTIVE' ? 'Hoạt động' : profile.accountStatus}
                </Badge>
              </div>
              {profile.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ngày tạo tài khoản</span>
                  <span className="text-sm font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

