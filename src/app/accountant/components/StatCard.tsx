import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

export default function StatCard({ title, value, change, trend, icon: Icon, color, bgColor }: StatCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend === 'up' ? '↑' : '↓'} {change} so với tháng trước
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
