'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsers,
    faCalendarCheck,
    faChartLine,
    faDollarSign,
    faArrowUp,
    faArrowDown,
} from '@fortawesome/free-solid-svg-icons'

export default function AnalyticsPage() {
    const metrics = [
        {
            title: 'Total Patients',
            value: '1,234',
            change: '+12.5%',
            trend: 'up',
            icon: faUsers,
            color: 'bg-blue-500'
        },
        {
            title: 'Monthly Appointments',
            value: '856',
            change: '+8.2%',
            trend: 'up',
            icon: faCalendarCheck,
            color: 'bg-green-500'
        },
        {
            title: 'Revenue Growth',
            value: '+23.5%',
            change: '+4.4%',
            trend: 'up',
            icon: faChartLine,
            color: 'bg-purple-500'
        },
        {
            title: 'Average Revenue',
            value: '$2,845',
            change: '-2.4%',
            trend: 'down',
            icon: faDollarSign,
            color: 'bg-orange-500'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Analytics Overview</h1>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden rounded-lg border bg-white p-4"
                    >
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-gray-200" />
                        <div className="flex items-center gap-4">
                            <div className={`rounded-full ${metric.color} p-2 bg-opacity-10`}>
                                <div className={`rounded-full ${metric.color} p-1`}>
                                    <FontAwesomeIcon icon={metric.icon} className="h-2 w-2 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">{metric.title}</p>
                                <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                                <div className="mt-2 flex items-center text-sm">
                                    <FontAwesomeIcon
                                        icon={metric.trend === 'up' ? faArrowUp : faArrowDown}
                                        className={`mr-1 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                            }`}
                                    />
                                    <span className={`${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {metric.change}
                                    </span>
                                    <span className="ml-2 text-gray-500">vs last month</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-lg border bg-white p-4">
                    <h3 className="mb-4 text-lg font-medium">Revenue Trend</h3>
                    <div className="h-80 rounded-lg bg-gray-50 p-4">
                        {/* Add your chart component here */}
                        <div className="flex h-full items-center justify-center text-gray-500">
                            Chart will be implemented here
                        </div>
                    </div>
                </div>

                {/* Appointments Chart */}
                <div className="rounded-lg border bg-white p-4">
                    <h3 className="mb-4 text-lg font-medium">Appointment Statistics</h3>
                    <div className="h-80 rounded-lg bg-gray-50 p-4">
                        {/* Add your chart component here */}
                        <div className="flex h-full items-center justify-center text-gray-500">
                            Chart will be implemented here
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Analytics */}
            <div className="rounded-lg border bg-white p-4">
                <h3 className="mb-4 text-lg font-medium">Top Procedures</h3>
                <div className="space-y-4">
                    {/* Add procedure statistics here */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dental Cleaning</span>
                        <span className="text-sm text-gray-500">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Root Canal</span>
                        <span className="text-sm text-gray-500">25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tooth Extraction</span>
                        <span className="text-sm text-gray-500">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dental Implants</span>
                        <span className="text-sm text-gray-500">10%</span>
                    </div>
                </div>
            </div>
        </div>
    )
}