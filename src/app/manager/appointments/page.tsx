'use client'
import { useState } from 'react'
import SearchBar from '@/components/ui/search-bar'

interface Appointment {
    id: string
    patientName: string
    patientId: string
    date: string
    time: string
    service: string
    doctor: string
    status: 'confirmed' | 'pending' | 'cancelled'
}

const mockAppointments: Appointment[] = [
    {
        id: 'APT-001',
        patientName: 'Sarah Johnson',
        patientId: 'PAT-001',
        date: '2025-09-28',
        time: '09:00 AM',
        service: 'Dental Cleaning',
        doctor: 'Dr. Smith',
        status: 'confirmed'
    },
    {
        id: 'APT-002',
        patientName: 'Michael Brown',
        patientId: 'PAT-002',
        date: '2025-09-28',
        time: '10:30 AM',
        service: 'Root Canal',
        doctor: 'Dr. Johnson',
        status: 'pending'
    },
    {
        id: 'APT-003',
        patientName: 'Emma Wilson',
        patientId: 'PAT-003',
        date: '2025-09-28',
        time: '02:00 PM',
        service: 'Tooth Extraction',
        doctor: 'Dr. Williams',
        status: 'cancelled'
    }
]

export default function AppointmentsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [doctorFilter, setDoctorFilter] = useState('all')

    const filteredAppointments = mockAppointments.filter(appointment => {
        const matchesSearch =
            appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesDate = !selectedDate || appointment.date === selectedDate
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
        const matchesDoctor = doctorFilter === 'all' || appointment.doctor === doctorFilter

        return matchesSearch && matchesDate && matchesStatus && matchesDoctor
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search appointments..."
                />
                <div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Doctors</option>
                        <option value="Dr. Smith">Dr. Smith</option>
                        <option value="Dr. Johnson">Dr. Johnson</option>
                        <option value="Dr. Williams">Dr. Williams</option>
                    </select>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Service
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Doctor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAppointments.map((appointment) => (
                                <tr key={appointment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                                                <div className="text-sm text-gray-500">#{appointment.patientId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {new Date(appointment.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm text-gray-500">{appointment.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{appointment.service}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{appointment.doctor}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                                        <button className="text-red-600 hover:text-red-900">Cancel</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}