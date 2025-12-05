'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function RevenueReportPage() {
    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const doctorRevenue = [
        { name: 'BS. Nguyễn Văn A', revenue: 45000000, actualRevenue: 42000000, patients: 35, procedures: 48 },
        { name: 'BS. Trần Thị B', revenue: 38000000, actualRevenue: 36000000, patients: 28, procedures: 42 },
        { name: 'BS. Lê Văn C', revenue: 32000000, actualRevenue: 30000000, patients: 25, procedures: 38 },
    ];

    const customerSourceRevenue = [
        { source: 'Website', customers: 45, procedures: 68, revenue: 85000000 },
        { source: 'Facebook', customers: 38, procedures: 52, revenue: 62000000 },
        { source: 'Zalo', customers: 25, procedures: 35, revenue: 45000000 },
        { source: 'Walk-in', customers: 18, procedures: 28, revenue: 35000000 },
        { source: 'Referral', customers: 12, procedures: 18, revenue: 22000000 },
    ];
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Báo Cáo Doanh Thu</h1>
                    <p className="text-gray-600">Thống kê doanh thu theo nhiều tiêu chí</p>
                </div>
                <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Xuất Báo Cáo
                </Button>
            </div>

            <Tabs defaultValue="doctor" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="doctor">Theo Bác Sĩ</TabsTrigger>
                    <TabsTrigger value="source">Theo Nguồn KH</TabsTrigger>
                    <TabsTrigger value="group">Theo Nhóm KH</TabsTrigger>
                </TabsList>

                <TabsContent value="doctor" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh Thu Theo Bác Sĩ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Bác Sĩ</th>
                                            <th className="text-right p-3">Doanh Thu</th>
                                            <th className="text-right p-3">Thực Thu</th>
                                            <th className="text-right p-3">Số BN</th>
                                            <th className="text-right p-3">Số Thủ Thuật</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctorRevenue.map((doctor, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{doctor.name}</td>
                                                <td className="p-3 text-right">{doctor.revenue.toLocaleString()} ₫</td>
                                                <td className="p-3 text-right text-green-600 font-bold">
                                                    {doctor.actualRevenue.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right">{doctor.patients}</td>
                                                <td className="p-3 text-right">{doctor.procedures}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="source" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh Thu Theo Nguồn Khách Hàng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Nguồn</th>
                                            <th className="text-right p-3">Số KH</th>
                                            <th className="text-right p-3">Số Thủ Thuật</th>
                                            <th className="text-right p-3">Tổng Doanh Thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerSourceRevenue.map((source, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{source.source}</td>
                                                <td className="p-3 text-right">{source.customers}</td>
                                                <td className="p-3 text-right">{source.procedures}</td>
                                                <td className="p-3 text-right text-green-600 font-bold">
                                                    {source.revenue.toLocaleString()} ₫
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="group">
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh Thu Theo Nhóm Khách Hàng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-center py-8">Chức năng đang phát triển...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
