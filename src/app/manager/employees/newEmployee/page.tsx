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
            label: 'Bác sĩ',
            description: 'Khám và điều trị bệnh nhân',
            icon: <Stethoscope className="h-5 w-5" />
        },
        {
            value: 'receptionist',
            label: 'Lễ tân',
            description: 'Tiếp đón và sắp xếp lịch hẹn',
            icon: <UserCircle className="h-5 w-5" />
        },
        {
            value: 'cashier',
            label: 'Thu ngân',
            description: 'Xử lý thanh toán và hóa đơn',
            icon: <Receipt className="h-5 w-5" />
        },
        {
            value: 'inventory',
            label: 'Quản lý kho',
            description: 'Quản lý vật tư và thiết bị',
            icon: <Package className="h-5 w-5" />
        },
        {
            value: 'patient',
            label: 'Bệnh nhân',
            description: 'Tài khoản dành cho bệnh nhân',
            icon: <HeartPulse className="h-5 w-5" />
        }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu không khớp')
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
                <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
                <div className="space-y-6 pt-8">
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Thông tin cá nhân</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Họ và tên
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
                                    Số điện thoại
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
                                    Ngày bắt đầu
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
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Phân quyền</h3>
                        <div className="space-y-4">
                            <Select
                                label="Chọn vai trò"
                                options={roles}
                                value={formData.role}
                                onChange={(value) => handleChange(value, 'role')}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Tài khoản</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Mật khẩu
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
                                    Xác nhận mật khẩu
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
                            Quay lại
                        </Link>
                        <button
                            type="submit"
                            className="justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 flex items-center gap-2"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}