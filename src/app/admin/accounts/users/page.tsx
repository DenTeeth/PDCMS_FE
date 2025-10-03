'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  UserPlus,
  Users
} from 'lucide-react';
// Sample patient data
const patients = [
  {
    id: '1',
    name: 'Nguyễn Thị H',
    email: 'nguyenthih@example.com',
    phone: '0123456789',
    age: 28,
    gender: 'female',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    medicalHistory: 'Không có tiền sử bệnh lý',
    allergies: 'Không có dị ứng',
    emergencyContact: 'Nguyễn Văn H (Chồng) - 0987654321',
    lastVisit: '2024-01-15',
    nextAppointment: '2024-02-15',
    status: 'active',
    insurance: 'Bảo hiểm y tế',
    bloodType: 'A+',
    notes: 'Bệnh nhân thường xuyên'
  },
  {
    id: '2',
    name: 'Trần Văn I',
    email: 'tranvani@example.com',
    phone: '0987654321',
    age: 35,
    gender: 'male',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    medicalHistory: 'Tiền sử sâu răng',
    allergies: 'Dị ứng penicillin',
    emergencyContact: 'Trần Thị I (Vợ) - 0123456789',
    lastVisit: '2024-01-10',
    nextAppointment: '2024-01-25',
    status: 'active',
    insurance: 'Bảo hiểm tư nhân',
    bloodType: 'O+',
    notes: 'Cần theo dõi định kỳ'
  },
  {
    id: '3',
    name: 'Lê Thị K',
    email: 'lethik@example.com',
    phone: '0369852147',
    age: 22,
    gender: 'female',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    medicalHistory: 'Đang niềng răng',
    allergies: 'Không có dị ứng',
    emergencyContact: 'Lê Văn K (Bố) - 0741258963',
    lastVisit: '2024-01-20',
    nextAppointment: '2024-02-20',
    status: 'active',
    insurance: 'Bảo hiểm y tế',
    bloodType: 'B+',
    notes: 'Đang điều trị niềng răng'
  },
  {
    id: '4',
    name: 'Phạm Văn L',
    email: 'phamvanl@example.com',
    phone: '0741258963',
    age: 45,
    gender: 'male',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    medicalHistory: 'Tiền sử viêm nướu',
    allergies: 'Không có dị ứng',
    emergencyContact: 'Phạm Thị L (Vợ) - 0852147369',
    lastVisit: '2024-01-18',
    nextAppointment: null,
    status: 'inactive',
    insurance: 'Bảo hiểm y tế',
    bloodType: 'AB+',
    notes: 'Bệnh nhân cũ, ít đến khám'
  },
  {
    id: '5',
    name: 'Hoàng Thị M',
    email: 'hoangthim@example.com',
    phone: '0456123789',
    age: 30,
    gender: 'female',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    medicalHistory: 'Không có tiền sử bệnh lý',
    allergies: 'Dị ứng latex',
    emergencyContact: 'Hoàng Văn M (Chồng) - 0321654987',
    lastVisit: '2024-01-21',
    nextAppointment: '2024-01-28',
    status: 'active',
    insurance: 'Bảo hiểm tư nhân',
    bloodType: 'A-',
    notes: 'Bệnh nhân mới'
  }
];

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getGenderBadgeColor = (gender: string) => {
    return gender === 'male' 
      ? 'bg-blue-100 text-blue-800'
      : 'bg-pink-100 text-pink-800';
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600">Manage patient information and medical records</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">A</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">I</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.status === 'inactive').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">D</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold">{patients.filter(p => new Date(p.lastVisit) > new Date('2024-01-01')).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>

      <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <CardDescription>
            Manage patient information and medical records
          </CardDescription>
        </CardHeader>

        {/* Filters */}

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">

            <div className="md:w-48">
              <Label htmlFor="status" className="mb-2">Status</Label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>

        {/* Users Table */}
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">STT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Số điện thoại</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lịch hẹn tiếp theo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-center text-gray-600 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{patient.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {patient.phone}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(patient.status)}`}>
                        {patient.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString('vi-VN') : 'Chưa đặt lịch'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Chỉnh sửa">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

