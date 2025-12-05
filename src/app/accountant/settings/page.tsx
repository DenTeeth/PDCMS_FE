'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Bell, Lock, Globe } from 'lucide-react';

export default function AccountantSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Cài Đặt</h1>
                <p className="text-gray-600">Quản lý thông tin cá nhân và cài đặt hệ thống</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Thông Tin Cá Nhân
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullname">Họ và Tên</Label>
                            <Input id="fullname" placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="email@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số Điện Thoại</Label>
                            <Input id="phone" placeholder="0901234567" />
                        </div>
                        <Button className="w-full">Cập Nhật Thông Tin</Button>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Đổi Mật Khẩu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Mật Khẩu Hiện Tại</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Mật Khẩu Mới</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Xác Nhận Mật Khẩu</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                        <Button className="w-full">Đổi Mật Khẩu</Button>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Thông Báo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                            </div>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Công Nợ Quá Hạn</p>
                                <p className="text-sm text-gray-500">Cảnh báo công nợ quá hạn</p>
                            </div>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Báo Cáo Hàng Tháng</p>
                                <p className="text-sm text-gray-500">Nhận báo cáo tự động</p>
                            </div>
                            <input type="checkbox" className="toggle" />
                        </div>
                    </CardContent>
                </Card>

                {/* Language Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Ngôn Ngữ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Chọn Ngôn Ngữ</Label>
                            <select id="language" className="w-full border rounded-md p-2">
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <Button className="w-full">Lưu Cài Đặt</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
