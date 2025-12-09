import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
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
import {
    RevenueTrendData,
    AppointmentStatusData,
    TopServiceData,
    PatientAcquisitionData,
} from '@/types/analytics';

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

interface RevenueTrendChartProps {
    data: RevenueTrendData[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Xu hướng doanh thu (12 tháng gần nhất)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#FF6B6B"
                            strokeWidth={3}
                            name="Revenue"
                            dot={{ fill: '#FF6B6B', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                        {data[0]?.target && (
                            <Line
                                type="monotone"
                                dataKey="target"
                                stroke="#4ECDC4"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Target"
                                dot={{ fill: '#4ECDC4', r: 4 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface AppointmentStatusChartProps {
    data: AppointmentStatusData[];
}

export function AppointmentStatusChart({ data }: AppointmentStatusChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lịch hẹn theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data as any}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, percentage }: any) => `${status}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface TopServicesChartProps {
    data: TopServiceData[];
}

export function TopServicesChart({ data }: TopServicesChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dịch vụ hàng đầu</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="serviceName" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#FF6B6B" name="Usage Count" />
                        <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue ($)" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface PatientAcquisitionChartProps {
    data: PatientAcquisitionData[];
}

export function PatientAcquisitionChart({ data }: PatientAcquisitionChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tăng trưởng bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="newPatients"
                            stroke="#FFE66D"
                            strokeWidth={3}
                            name="New Patients"
                            dot={{ fill: '#FFE66D', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="returningPatients"
                            stroke="#95E1D3"
                            strokeWidth={3}
                            name="Returning Patients"
                            dot={{ fill: '#95E1D3', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
