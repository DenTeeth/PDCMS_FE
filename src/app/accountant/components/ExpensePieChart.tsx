'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';

interface ExpenseData {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

interface Props {
    data: ExpenseData[];
}

export default function ExpensePieChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Cơ Cấu Chi Phí
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm">{item.category}</span>
                                </div>
                                <span className="font-bold text-sm">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">
                                {(item.amount / 1000000).toFixed(1)} triệu
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
