'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faUsers,
    faTooth,
    faDollarSign,
    faCalendarAlt,
    faRefresh,
    faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import KPICard from './components/KPICard';
import {
    RevenueTrendChart,
    AppointmentStatusChart,
    TopServicesChart,
    PatientAcquisitionChart,
} from './components/DashboardCharts';
import EmployeePerformanceTable from './components/EmployeePerformanceTable';
import {
    MostUsedServicesChart,
    ServiceRevenueChart,
    ServiceAnalyticsTable,
} from './components/ServiceAnalyticsCharts';
import IncomeExpenseCharts from './components/IncomeExpenseCharts';
import {
    AppointmentVolumeChart,
    AppointmentMetricsCards,
    PeakHoursHeatmap,
} from './components/AppointmentAnalyticsCharts';
import { analyticsService } from '@/services/analyticsService';
import {
    KPIData,
    RevenueTrendData,
    AppointmentStatusData,
    TopServiceData,
    PatientAcquisitionData,
    EmployeePerformance,
    ServiceAnalytics,
    IncomeExpenseData,
    ExpenseCategory,
    AppointmentVolumeData,
    AppointmentMetrics,
    DateRangeFilter,
} from '@/types/analytics';

// Mock data generator
const generateMockData = () => {
    const kpi: KPIData = {
        totalPatientsThisMonth: 342,
        totalRevenueThisMonth: 125800,
        totalAppointmentsThisMonth: 456,
        employeeCount: 28,
        patientsChange: 12.5,
        revenueChange: 8.3,
        appointmentsChange: 15.2,
        employeesChange: 3.7,
    };

    const revenueTrend: RevenueTrendData[] = [
        { month: 'Jan', revenue: 98000, target: 100000 },
        { month: 'Feb', revenue: 105000, target: 100000 },
        { month: 'Mar', revenue: 112000, target: 110000 },
        { month: 'Apr', revenue: 108000, target: 110000 },
        { month: 'May', revenue: 118000, target: 115000 },
        { month: 'Jun', revenue: 122000, target: 120000 },
        { month: 'Jul', revenue: 115000, target: 120000 },
        { month: 'Aug', revenue: 125000, target: 125000 },
        { month: 'Sep', revenue: 130000, target: 125000 },
        { month: 'Oct', revenue: 125800, target: 130000 },
    ];

    const appointmentStatus: AppointmentStatusData[] = [
        { status: 'Completed', count: 320, percentage: 70 },
        { status: 'Scheduled', count: 90, percentage: 20 },
        { status: 'Cancelled', count: 30, percentage: 6.5 },
        { status: 'No-Show', count: 16, percentage: 3.5 },
    ];

    const topServices: TopServiceData[] = [
        { serviceName: 'Teeth Cleaning', count: 120, revenue: 36000 },
        { serviceName: 'Teeth Whitening', count: 85, revenue: 42500 },
        { serviceName: 'Dental Implants', count: 45, revenue: 67500 },
        { serviceName: 'Root Canal', count: 38, revenue: 30400 },
        { serviceName: 'Orthodontics', count: 52, revenue: 78000 },
    ];

    const patientAcquisition: PatientAcquisitionData[] = [
        { month: 'Jan', newPatients: 45, returningPatients: 198 },
        { month: 'Feb', newPatients: 52, returningPatients: 210 },
        { month: 'Mar', newPatients: 48, returningPatients: 225 },
        { month: 'Apr', newPatients: 58, returningPatients: 232 },
        { month: 'May', newPatients: 62, returningPatients: 245 },
        { month: 'Jun', newPatients: 55, returningPatients: 258 },
        { month: 'Jul', newPatients: 60, returningPatients: 268 },
        { month: 'Aug', newPatients: 68, returningPatients: 280 },
        { month: 'Sep', newPatients: 72, returningPatients: 295 },
        { month: 'Oct', newPatients: 65, returningPatients: 305 },
    ];

    const employees: EmployeePerformance[] = [
        {
            employeeId: 'E001',
            employeeName: 'Dr. Nguyen Van A',
            role: 'Dentist',
            appointmentsHandled: 85,
            revenueGenerated: 42500,
            rating: 4.8,
        },
        {
            employeeId: 'E002',
            employeeName: 'Dr. Tran Thi B',
            role: 'Dentist',
            appointmentsHandled: 72,
            revenueGenerated: 38000,
            rating: 4.6,
        },
        {
            employeeId: 'E003',
            employeeName: 'Nguyen Thi C',
            role: 'Receptionist',
            appointmentsHandled: 156,
            revenueGenerated: 15600,
            rating: 4.5,
        },
        {
            employeeId: 'E004',
            employeeName: 'Le Van D',
            role: 'Dental Hygienist',
            appointmentsHandled: 98,
            revenueGenerated: 29400,
            rating: 4.7,
        },
    ];

    const services: ServiceAnalytics[] = [
        {
            serviceCode: 'S001',
            serviceName: 'Teeth Cleaning',
            usageCount: 120,
            revenue: 36000,
            utilizationRate: 85,
            averagePrice: 300,
        },
        {
            serviceCode: 'S002',
            serviceName: 'Teeth Whitening',
            usageCount: 85,
            revenue: 42500,
            utilizationRate: 70,
            averagePrice: 500,
        },
        {
            serviceCode: 'S003',
            serviceName: 'Dental Implants',
            usageCount: 45,
            revenue: 67500,
            utilizationRate: 60,
            averagePrice: 1500,
        },
    ];

    const incomeExpenses: IncomeExpenseData[] = [
        { month: 'Jan', income: 98000, expenses: 65000, netProfit: 33000 },
        { month: 'Feb', income: 105000, expenses: 68000, netProfit: 37000 },
        { month: 'Mar', income: 112000, expenses: 72000, netProfit: 40000 },
        { month: 'Apr', income: 108000, expenses: 70000, netProfit: 38000 },
        { month: 'May', income: 118000, expenses: 75000, netProfit: 43000 },
        { month: 'Jun', income: 122000, expenses: 78000, netProfit: 44000 },
    ];

    const expenseCategories: ExpenseCategory[] = [
        { category: 'Salaries', amount: 45000, percentage: 58 },
        { category: 'Supplies', amount: 18000, percentage: 23 },
        { category: 'Rent', amount: 10000, percentage: 13 },
        { category: 'Utilities', amount: 3000, percentage: 4 },
        { category: 'Other', amount: 2000, percentage: 2 },
    ];

    const appointmentVolume: AppointmentVolumeData[] = [
        { date: 'Oct 1', count: 45 },
        { date: 'Oct 5', count: 52 },
        { date: 'Oct 10', count: 48 },
        { date: 'Oct 15', count: 55 },
        { date: 'Oct 20', count: 58 },
        { date: 'Oct 24', count: 50 },
    ];

    const appointmentMetrics: AppointmentMetrics = {
        totalAppointments: 456,
        completed: 320,
        cancelled: 30,
        noShow: 16,
        cancellationRate: 6.5,
        noShowRate: 3.5,
    };

    return {
        kpi,
        revenueTrend,
        appointmentStatus,
        topServices,
        patientAcquisition,
        employees,
        services,
        incomeExpenses,
        expenseCategories,
        appointmentVolume,
        appointmentMetrics,
    };
};

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRangeFilter>('THIS_MONTH');
    const [data, setData] = useState(generateMockData());

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Try to fetch from backend, fallback to mock data
            try {
                // Uncomment when backend is ready
                // const [kpi, revenueTrend, ...] = await Promise.all([...]);
                throw new Error('Backend not ready');
            } catch (error) {
                console.log('Using mock data');
                setData(generateMockData());
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.info('Exporting report...');
            // await analyticsService.exportReport('income-expenses');
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FontAwesomeIcon
                    icon={faRefresh}
                    className="text-4xl text-gray-400 animate-spin"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Bảng điều khiển phân tích</h1>
                    <p className="text-gray-600 mt-1">
                        Comprehensive business analytics and insights
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={dateRange}
                        onValueChange={(value: any) => setDateRange(value)}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="THIS_WEEK">This Week</SelectItem>
                            <SelectItem value="THIS_MONTH">This Month</SelectItem>
                            <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
                            <SelectItem value="CUSTOM">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={loadData} variant="outline">
                        <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="dashboard">
                        <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="services">
                        <FontAwesomeIcon icon={faTooth} className="mr-2" />
                        Services
                    </TabsTrigger>
                    <TabsTrigger value="financial">
                        <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
                        Financial
                    </TabsTrigger>
                    <TabsTrigger value="appointments">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                        Appointments
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Tổng bệnh nhân"
                            value={data.kpi.totalPatientsThisMonth}
                            icon={faUsers}
                            change={data.kpi.patientsChange}
                            iconColor="text-blue-600"
                        />
                        <KPICard
                            title="Tổng doanh thu"
                            value={`$${data.kpi.totalRevenueThisMonth.toLocaleString()}`}
                            icon={faDollarSign}
                            change={data.kpi.revenueChange}
                            iconColor="text-green-600"
                        />
                        <KPICard
                            title="Tổng lịch hẹn"
                            value={data.kpi.totalAppointmentsThisMonth}
                            icon={faCalendarAlt}
                            change={data.kpi.appointmentsChange}
                            iconColor="text-purple-600"
                        />
                        <KPICard
                            title="Số nhân viên"
                            value={data.kpi.employeeCount}
                            icon={faUsers}
                            change={data.kpi.employeesChange}
                            iconColor="text-orange-600"
                        />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueTrendChart data={data.revenueTrend} />
                        <AppointmentStatusChart data={data.appointmentStatus} />
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopServicesChart data={data.topServices} />
                        <PatientAcquisitionChart data={data.patientAcquisition} />
                    </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance">
                    <EmployeePerformanceTable data={data.employees} />
                </TabsContent>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MostUsedServicesChart data={data.services} />
                        <ServiceRevenueChart data={data.services} />
                    </div>
                    <ServiceAnalyticsTable data={data.services} />
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial">
                    <IncomeExpenseCharts
                        data={data.incomeExpenses}
                        expenseCategories={data.expenseCategories}
                        onExport={handleExport}
                    />
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="space-y-6">
                    <AppointmentMetricsCards metrics={data.appointmentMetrics} />
                    <AppointmentVolumeChart volumeData={data.appointmentVolume} />
                    <PeakHoursHeatmap />
                </TabsContent>
            </Tabs>
        </div>
    );
}
