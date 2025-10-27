'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faComments,
    faUsers,
    faCalendarAlt,
    faDollarSign,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function ManagerDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    const quickLinks = [
        {
            title: 'Feedback & Reviews',
            description: 'Analyze patient feedback and service ratings',
            icon: faComments,
            color: 'from-blue-500 to-blue-600',
            path: '/manager/feedback',
        },
        {
            title: 'Analytics',
            description: 'View business analytics and reports',
            icon: faChartLine,
            color: 'from-purple-500 to-purple-600',
            path: '/manager/analytics',
        },
        {
            title: 'Staff Management',
            description: 'Manage staff and assignments',
            icon: faUsers,
            color: 'from-green-500 to-green-600',
            path: '/manager/staff',
        },
        {
            title: 'Appointments Overview',
            description: 'Monitor appointments and schedules',
            icon: faCalendarAlt,
            color: 'from-orange-500 to-orange-600',
            path: '/manager/appointments',
        },
        {
            title: 'Financial Reports',
            description: 'View revenue and financial metrics',
            icon: faDollarSign,
            color: 'from-emerald-500 to-emerald-600',
            path: '/manager/financial',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-primary-foreground mb-2">
                    Manager Dashboard
                </h1>
                <p className="text-primary-foreground/80">
                    Welcome back, {user?.username}! Monitor and manage clinic operations.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Reviews</p>
                                <p className="text-2xl font-bold">248</p>
                            </div>
                            <FontAwesomeIcon icon={faComments} className="text-blue-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold">4.3⭐</p>
                            </div>
                            <FontAwesomeIcon icon={faChartLine} className="text-green-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Staff</p>
                                <p className="text-2xl font-bold">24</p>
                            </div>
                            <FontAwesomeIcon icon={faUsers} className="text-purple-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">This Month</p>
                                <p className="text-2xl font-bold">$45.2K</p>
                            </div>
                            <FontAwesomeIcon icon={faDollarSign} className="text-emerald-500 text-2xl" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickLinks.map((link) => (
                        <Card
                            key={link.path}
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                            onClick={() => router.push(link.path)}
                        >
                            <CardHeader>
                                <div className={`bg-gradient-to-r ${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                                    <FontAwesomeIcon icon={link.icon} className="text-white text-xl" />
                                </div>
                                <CardTitle className="flex items-center justify-between">
                                    {link.title}
                                    <FontAwesomeIcon icon={faArrowRight} className="text-gray-400 text-sm" />
                                </CardTitle>
                                <CardDescription>{link.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faComments} className="text-blue-600 text-xl mt-1" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">Feedback Management</h4>
                            <p className="text-sm text-blue-800 mb-3">
                                The feedback system is now live! View detailed analytics, sentiment analysis,
                                and AI-generated insights to improve patient satisfaction.
                            </p>
                            <Button
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-100"
                                onClick={() => router.push('/manager/feedback')}
                            >
                                View Feedback Dashboard
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
