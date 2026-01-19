'use client';


import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faUser, faBell, faShield } from '@fortawesome/free-solid-svg-icons';

export default function EmployeeSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faCog} className="mr-3" />
          Cài đặt
        </h1>
        <p className="text-primary-foreground/80">
          Quản lý tùy chọn tài khoản của bạn
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-primary" />
              Cài đặt hồ sơ
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin cá nhân của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sắp ra mắt...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-primary" />
              Tùy chọn thông báo
            </CardTitle>
            <CardDescription>
              Quản lý cách bạn nhận thông báo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sắp ra mắt...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShield} className="h-5 w-5 text-primary" />
              Bảo mật
            </CardTitle>
            <CardDescription>
              Cài đặt mật khẩu và bảo mật
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sắp ra mắt...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
