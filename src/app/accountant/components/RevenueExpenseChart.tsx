'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ChartData {
    date: string;
    revenue: number;
    expense: number;
}

interface Props {
    data: ChartData[];
}

export default function RevenueExpenseChart({ data }: Props) {
    const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.expense)));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Thu/Chi Theo Ngày (Tháng Này)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.date}</span>
                                <div className="flex gap-4">
                                    <span className="text-green-600">
                                        Thu: {(item.revenue / 1000000).toFixed(1)}tr
                                    </span>
                                    <span className="text-red-600">
                                        Chi: {(item.expense / 1000000).toFixed(1)}tr
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 h-8">
                                <div className="flex-1 relative">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-green-500 rounded"
                                        style={{ width: `${(item.revenue / maxValue) * 100}%` }}
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-red-500 rounded"
                                        style={{ width: `${(item.expense / maxValue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded" />
                        <span>Doanh thu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded" />
                        <span>Chi phí</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
