import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ServiceAnalytics } from '@/types/analytics';

const COLORS = [
    '#FF6B6B', // Bright Red
    '#4ECDC4', // Turquoise
    '#FFE66D', // Bright Yellow
    '#95E1D3', // Mint Green
    '#A8E6CF', // Light Green
    '#FF8B94', // Pink
    '#C7CEEA', // Lavender
    '#FFDAC1', // Peach
    '#B4F8C8', // Light Lime
    '#FBE7C6', // Cream
];

interface ServiceAnalyticsChartsProps {
    data: ServiceAnalytics[];
}

export function MostUsedServicesChart({ data }: ServiceAnalyticsChartsProps) {
    const sortedData = [...data].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dịch vụ được sử dụng nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sortedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="serviceName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="usageCount" fill="#FF6B6B" name="Usage Count" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function ServiceRevenueChart({ data }: ServiceAnalyticsChartsProps) {
    const sortedData = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Doanh thu theo dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={sortedData as any}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ serviceName, revenue }: any) =>
                                `${serviceName}: $${Number(revenue).toLocaleString()}`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                        >
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function ServiceAnalyticsTable({ data }: ServiceAnalyticsChartsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Chi tiết phân tích dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3 font-semibold">Service Name</th>
                                <th className="text-left p-3 font-semibold">Usage Count</th>
                                <th className="text-left p-3 font-semibold">Revenue</th>
                                <th className="text-left p-3 font-semibold">Utilization Rate</th>
                                <th className="text-left p-3 font-semibold">Average Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((service) => (
                                <tr key={service.serviceCode} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{service.serviceName}</td>
                                    <td className="p-3">{service.usageCount}</td>
                                    <td className="p-3">${service.revenue.toLocaleString()}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-FF6B6B to-4ECDC4 h-2 rounded-full"
                                                    style={{ width: `${service.utilizationRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm">{service.utilizationRate}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3">${service.averagePrice.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
