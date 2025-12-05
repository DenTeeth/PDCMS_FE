'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewTransactionPage() {
    const [transactionType, setTransactionType] = useState<'Thu' | 'Chi'>('Thu');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/accountant/transactions">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Tạo Phiếu Thu Chi Mới</h1>
                    <p className="text-gray-600">Ghi nhận giao dịch thu hoặc chi</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông Tin Phiếu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Loại giao dịch */}
                    <div className="space-y-2">
                        <Label>Loại Giao Dịch *</Label>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant={transactionType === 'Thu' ? 'default' : 'outline'}
                                onClick={() => setTransactionType('Thu')}
                                className="flex-1"
                            >
                                Phiếu Thu
                            </Button>
                            <Button
                                type="button"
                                variant={transactionType === 'Chi' ? 'default' : 'outline'}
                                onClick={() => setTransactionType('Chi')}
                                className="flex-1"
                            >
                                Phiếu Chi
                            </Button>
                        </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="person">
                                {transactionType === 'Thu' ? 'Người Nộp' : 'Người Nhận'} *
                            </Label>
                            <Input id="person" placeholder="Nhập tên người" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Danh Mục *</Label>
                            <select id="category" className="w-full border rounded-md p-2">
                                <option value="">Chọn danh mục</option>
                                {transactionType === 'Thu' ? (
                                    <>
                                        <option value="service">Dịch vụ nha khoa</option>
                                        <option value="product">Bán nha phẩm</option>
                                        <option value="medicine">Bán thuốc</option>
                                        <option value="other">Khác</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="salary">Lương nhân viên</option>
                                        <option value="maintenance">Sửa chữa bảo dưỡng</option>
                                        <option value="supplies">Mua vật tư</option>
                                        <option value="rent">Thuê mặt bằng</option>
                                        <option value="utilities">Điện nước</option>
                                        <option value="other">Khác</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Nội Dung Giao Dịch *</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả chi tiết nội dung giao dịch"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Số Tiền *</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0"
                            className="text-right"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Ngày Giao Dịch *</Label>
                        <Input id="date" type="date" />
                    </div>

                    <div className="space-y-2">
                        <Label>Đính Kèm Hóa Đơn/Phiếu (Tùy chọn)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click để tải lên hoặc kéo thả file vào đây</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (tối đa 5MB)</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button className="flex-1 flex items-center justify-center gap-2">
                            <Save className="h-4 w-4" />
                            Lưu Phiếu
                        </Button>
                        <Link href="/accountant/transactions" className="flex-1">
                            <Button variant="outline" className="w-full">
                                Hủy
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
