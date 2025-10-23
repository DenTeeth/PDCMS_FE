'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faUserPlus,
    faUsers,
    faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function ReceptionistDashboard() {
    const router = useRouter();

    const quickActions = [
        {
            title: 'Appointments',
            description: 'Manage patient appointments',
            icon: faCalendarAlt,
            color: 'from-blue-500 to-blue-600',
            path: '/receptionist/appointments',
        },
        {
            title: 'Patients',
            description: 'Manage patient records',
            icon: faUsers,
            color: 'from-green-500 to-green-600',
            path: '/receptionist/patients',
        },
        {
            title: 'New Patient',
            description: 'Register new patient',
            icon: faUserPlus,
            color: 'from-purple-500 to-purple-600',
            path: '/receptionist/patients/create',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-primary-foreground mb-2">
                    Receptionist Dashboard
                </h1>
                <p className="text-primary-foreground/80">
                    Welcome back! Manage appointments and patient records.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action) => (
                    <Card
                        key={action.path}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(action.path)}
                    >
                        <CardContent className="p-6">
                            <div className={`bg-gradient-to-r ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                                <FontAwesomeIcon icon={action.icon} className="text-white text-xl" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                            <p className="text-gray-600 text-sm">{action.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Appointments</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold">5</p>
                            </div>
                            <FontAwesomeIcon icon={faChartLine} className="text-orange-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold">248</p>
                            </div>
                            <FontAwesomeIcon icon={faUsers} className="text-green-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">New This Month</p>
                                <p className="text-2xl font-bold">18</p>
                            </div>
                            <FontAwesomeIcon icon={faUserPlus} className="text-purple-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Note */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 text-xl mt-1" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">Quick Access</h4>
                            <p className="text-sm text-blue-800">
                                Use the cards above for quick access to common tasks. Click on Appointments to
                                manage the full appointment system with calendar and list views.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
