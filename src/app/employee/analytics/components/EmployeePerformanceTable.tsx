import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSort,
    faSortUp,
    faSortDown,
    faSearch,
    faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { EmployeePerformance } from '@/types/analytics';

interface EmployeePerformanceTableProps {
    data: EmployeePerformance[];
}

type SortField = keyof EmployeePerformance;
type SortDirection = 'asc' | 'desc' | null;

export default function EmployeePerformanceTable({
    data,
}: EmployeePerformanceTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Get unique roles
    const roles = Array.from(new Set(data.map((emp) => emp.role)));

    // Filter and sort data
    const filteredData = data
        .filter((emp) => {
            const matchesSearch =
                emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
            return matchesSearch && matchesRole;
        })
        .sort((a, b) => {
            if (!sortField || !sortDirection) return 0;

            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return 0;
        });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return faSort;
        return sortDirection === 'asc' ? faSortUp : faSortDown;
    };

    // Prepare chart data (top 10 performers)
    const topPerformers = [...filteredData]
        .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
        .slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <Input
                                    placeholder="Search by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                options={[
                                    { value: 'all', label: 'All Roles' },
                                    ...roles.map((role) => ({ value: role, label: role })),
                                ]}
                                value={roleFilter}
                                onChange={setRoleFilter}
                                placeholder="Filter by role"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topPerformers}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="employeeName" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenueGenerated" fill="#4ECDC4" name="Revenue ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('employeeName')}
                                            className="font-semibold"
                                        >
                                            Employee Name
                                            <FontAwesomeIcon
                                                icon={getSortIcon('employeeName')}
                                                className="ml-2"
                                            />
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('role')}
                                            className="font-semibold"
                                        >
                                            Role
                                            <FontAwesomeIcon icon={getSortIcon('role')} className="ml-2" />
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('appointmentsHandled')}
                                            className="font-semibold"
                                        >
                                            Appointments
                                            <FontAwesomeIcon
                                                icon={getSortIcon('appointmentsHandled')}
                                                className="ml-2"
                                            />
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('revenueGenerated')}
                                            className="font-semibold"
                                        >
                                            Revenue
                                            <FontAwesomeIcon
                                                icon={getSortIcon('revenueGenerated')}
                                                className="ml-2"
                                            />
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('rating')}
                                            className="font-semibold"
                                        >
                                            Rating
                                            <FontAwesomeIcon icon={getSortIcon('rating')} className="ml-2" />
                                        </Button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((emp) => (
                                    <tr key={emp.employeeId} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{emp.employeeName}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="p-3">{emp.appointmentsHandled}</td>
                                        <td className="p-3">${emp.revenueGenerated.toLocaleString()}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{emp.rating.toFixed(1)}</span>
                                                <span className="text-yellow-500">★</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredData.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No employees found matching your criteria
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
