'use client'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsers,
    faCalendarCheck,
    faChartLine,
    faClock,
    faArrowUp,
    faArrowDown,
    faUserPlus,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export default function ManagerDashboard() {
    const stats = [
        {
            title: 'Total Patients',
            value: '1,234',
            change: '+12.5%',
            trend: 'up',
            icon: faUsers
        },
        {
            title: "Today's Appointments",
            value: '48',
            change: '+8.2%',
            trend: 'up',
            icon: faCalendarCheck
        },
        {
            title: 'Monthly Revenue',
            value: '$52,420',
            change: '-2.4%',
            trend: 'down',
            icon: faChartLine
        },
        {
            title: 'Pending Appointments',
            value: '13',
            change: '+5.3%',
            trend: 'up',
            icon: faClock
        }
    ]

    const recentAppointments = [
        { id: 1, patient: 'Sarah Johnson', time: '10:00 AM', service: 'Dental Cleaning', status: 'Confirmed' },
        { id: 2, patient: 'Mike Chen', time: '11:30 AM', service: 'Root Canal', status: 'Pending' },
        { id: 3, patient: 'Emma Davis', time: '2:00 PM', service: 'Consultation', status: 'Confirmed' }
    ]

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg">
                                <FontAwesomeIcon icon={stat.icon} className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <FontAwesomeIcon
                                icon={stat.trend === 'up' ? faArrowUp : faArrowDown}
                                className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
                            />
                            <span className={`ml-2 text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.change}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Appointments */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
                            <Link href="/manager/appointments"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View all
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentAppointments.map((apt) => (
                            <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="font-medium text-gray-900">{apt.patient}</p>
                                        <p className="text-sm text-gray-500">{apt.service}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{apt.time}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                                <FontAwesomeIcon icon={faUserPlus} className="w-6 h-6 text-blue-600 mb-3" />
                                <h3 className="font-medium text-gray-900">New Patient</h3>
                                <p className="text-sm text-gray-500 mt-1">Register patient record</p>
                            </button>
                            <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                                <FontAwesomeIcon icon={faCalendarCheck} className="w-6 h-6 text-blue-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Schedule</h3>
                                <p className="text-sm text-gray-500 mt-1">Book appointment</p>
                            </button>
                            <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                                <FontAwesomeIcon icon={faFileAlt} className="w-6 h-6 text-blue-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Reports</h3>
                                <p className="text-sm text-gray-500 mt-1">View analytics</p>
                            </button>
                            <button className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                                <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-blue-600 mb-3" />
                                <h3 className="font-medium text-gray-900">Staff</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage team</p>
                            </button>
                        </div>
                    </div>

                    {/* Additional Stats or Charts can be added here */}
                </div>
            </div>
        </div>
    )
}
