'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faEnvelope,
    faPhone,
    faCalendar,
    faUserTag,
    faHospital,
} from '@fortawesome/free-solid-svg-icons'

interface ManagerProfileProps {
    isOpen: boolean
    onClose: () => void
}

export default function ManagerProfile({ isOpen, onClose }: ManagerProfileProps) {
    if (!isOpen) return null

    const managerInfo = {
        name: 'Dr. John Smith',
        email: 'dr.smith@denteeth.com',
        phone: '+1 234 567 890',
        joinDate: 'January 15, 2023',
        role: 'Clinical Manager',
        department: 'Dental Surgery'
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>

                    {/* Profile Header */}
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-[#9747FF] flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="text-3xl text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{managerInfo.name}</h2>
                        <p className="text-sm text-gray-500">{managerInfo.role}</p>
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faEnvelope} className="text-[#9747FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-sm font-medium">{managerInfo.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faPhone} className="text-[#9747FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-sm font-medium">{managerInfo.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faCalendar} className="text-[#9747FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Join Date</p>
                                <p className="text-sm font-medium">{managerInfo.joinDate}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faUserTag} className="text-[#9747FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Role</p>
                                <p className="text-sm font-medium">{managerInfo.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faHospital} className="text-[#9747FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Department</p>
                                <p className="text-sm font-medium">{managerInfo.department}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}