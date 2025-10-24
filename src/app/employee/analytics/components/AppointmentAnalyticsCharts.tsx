import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { AppointmentVolumeData, AppointmentMetrics } from '@/types/analytics';

interface AppointmentAnalyticsChartsProps {
    volumeData: AppointmentVolumeData[];
    metrics: AppointmentMetrics;
}

export function AppointmentVolumeChart({ volumeData }: { volumeData: AppointmentVolumeData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Appointment Volume</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#95E1D3"
                            strokeWidth={3}
                            name="Appointments"
                            dot={{ fill: '#95E1D3', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function AppointmentMetricsCards({ metrics }: { metrics: AppointmentMetrics }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Total Appointments</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {metrics.totalAppointments}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Cancellation Rate</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {metrics.cancellationRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {metrics.cancelled} cancelled
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">No-Show Rate</div>
                    <div className="text-2xl font-bold text-red-600">
                        {metrics.noShowRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{metrics.noShow} no-shows</div>
                </CardContent>
            </Card>
        </div>
    );
}

export function PeakHoursHeatmap() {
    // Mock heatmap data - would come from props in real implementation
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    const getRandomIntensity = () => Math.floor(Math.random() * 100);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Peak Hours/Days (Heatmap)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-sm font-medium text-gray-600">Hour</th>
                                    {days.map((day) => (
                                        <th key={day} className="p-2 text-sm font-medium text-gray-600">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {hours.map((hour) => (
                                    <tr key={hour}>
                                        <td className="p-2 text-sm font-medium text-gray-600">
                                            {hour}:00
                                        </td>
                                        {days.map((day) => {
                                            const intensity = getRandomIntensity();
                                            const bgColor =
                                                intensity > 75
                                                    ? 'bg-rose-500'
                                                    : intensity > 50
                                                        ? 'bg-amber-400'
                                                        : intensity > 25
                                                            ? 'bg-emerald-300'
                                                            : 'bg-sky-100';
                                            return (
                                                <td key={`${day}-${hour}`} className="p-1">
                                                    <div
                                                        className={`w-12 h-8 ${bgColor} rounded flex items-center justify-center text-xs font-medium ${intensity > 50 ? 'text-white' : 'text-gray-700'
                                                            }`}
                                                        title={`${day} ${hour}:00 - ${intensity} appointments`}
                                                    >
                                                        {intensity}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="text-gray-600">Legend:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sky-100 rounded" />
                        <span>Low (0-25)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-300 rounded" />
                        <span>Medium (26-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-400 rounded" />
                        <span>High (51-75)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-rose-500 rounded" />
                        <span>Very High (76-100)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
