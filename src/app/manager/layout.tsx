'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHome,
    faCalendarCheck,
    faUserGroup,
    faChartLine,
    faGear,
    faBell,
    faUser,
    faBars
} from '@fortawesome/free-solid-svg-icons'

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const menuItems = [
        { href: '/manager', label: 'Dashboard', icon: faHome },
        { href: '/manager/appointments', label: 'Appointments', icon: faCalendarCheck },
        { href: '/manager/patients', label: 'Patients', icon: faUserGroup },
        { href: '/manager/analytics', label: 'Analytics', icon: faChartLine },
        { href: '/manager/settings', label: 'Settings', icon: faGear },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <Link href="/manager" className="flex items-center">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                                DenTeeth
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 hover:text-blue-600 transition-all duration-200"
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                                <span className="ml-3 font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Profile */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Dr. Smith</p>
                                <p className="text-xs text-gray-500">Manager</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden text-gray-600 hover:text-gray-900"
                        >
                            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
                        </button>

                        <div className="flex items-center space-x-4">
                            <button className="relative p-2 text-gray-600 hover:text-gray-900">
                                <FontAwesomeIcon icon={faBell} className="w-6 h-6" />
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="border-l border-gray-200 h-6"></div>
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Dr. Smith</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
