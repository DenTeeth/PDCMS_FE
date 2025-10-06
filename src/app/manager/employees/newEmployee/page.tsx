'use client'

import { useState } from 'react'
import Link from 'next/link'
import Select from '@/components/ui/select'
import {
    UserCircle,
    Stethoscope,
    UserCog,
    Receipt,
    Package,
    HeartPulse,
    ArrowLeft
} from 'lucide-react'

interface EmployeeFormData {
    name: string
    email: string
    phone: string
    role: string
    department: string
    startDate: string
    password: string
    confirmPassword: string
}

type Role = 'doctor' | 'receptionist' | 'cashier' | 'inventory' | 'patient'

export default function NewEmployeePage() {
    const [formData, setFormData] = useState<EmployeeFormData>({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        startDate: '',
        password: '',
        confirmPassword: ''
    })

    const roles: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
        {
            value: 'doctor',
            label: 'Doctor',
            description: 'Examine and treat patients',
            icon: <Stethoscope className="h-5 w-5" />
        },
        {
            value: 'receptionist',
            label: 'Receptionist',
            description: 'Welcome and schedule appointments',
            icon: <UserCircle className="h-5 w-5" />
        },
        {
            value: 'cashier',
            label: 'Cashier',
            description: 'Handle payments and invoices',
            icon: <Receipt className="h-5 w-5" />
        },
        {
            value: 'inventory',
            label: 'Inventory Manager',
            description: 'Manage supplies and equipment',
            icon: <Package className="h-5 w-5" />
        },
        {
            value: 'patient',
            label: 'Patient',
            description: 'Account for patients',
            icon: <HeartPulse className="h-5 w-5" />
        }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match')
            return
        }
        // TODO: Call API to create employee
        console.log('Form submitted:', formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | string, field?: string) => {
        if (typeof e === 'string' && field) {
            setFormData(prev => ({
                ...prev,
                [field]: e
            }))
        } else if (typeof e !== 'string') {
            const { name, value } = e.target
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
                <div className="space-y-6 pt-8">
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                    Start Date
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="startDate"
                                        id="startDate"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Role Assignment</h3>
                        <div className="space-y-4">
                            <Select
                                label="Select Role"
                                options={roles}
                                value={formData.role}
                                onChange={(value) => handleChange(value, 'role')}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Account</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end gap-3">
                        <Link
                            href="/manager/employees"
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}