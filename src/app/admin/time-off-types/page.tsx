'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faEye,
  faSearch,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/select';

import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { TimeOffType } from '@/types/timeOff';

export default function AdminTimeOffTypesPage() {
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  useEffect(() => {
    loadTimeOffTypes();
  }, []);

  const loadTimeOffTypes = async () => {
    try {
      setLoading(true);
      const response = await TimeOffTypeService.getTimeOffTypes({
        page: 0,
        size: 100
      });
      setTimeOffTypes(response.content || []);
    } catch (error) {
      console.error('Error loading time off types:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = timeOffTypes.filter((type) => {
    const matchesSearch = 
      type.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.typeCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && type.isActive) ||
      (statusFilter === 'INACTIVE' && !type.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh Sách Loại Nghỉ Phép</h1>
          <p className="text-gray-600 mt-2">Xem danh sách các loại nghỉ phép có sẵn</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Tìm theo tên hoặc mã loại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Trạng thái"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                options={[
                  { value: 'ALL', label: 'Tất cả' },
                  { value: 'ACTIVE', label: 'Đang hoạt động' },
                  { value: 'INACTIVE', label: 'Đã tắt' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadTimeOffTypes}
                variant="outline"
                className="w-full"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Off Types List */}
      <div className="grid gap-4">
        {filteredTypes.map((type) => (
          <Card key={type.typeId} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {type.typeName}
                    </h3>
                    <Badge className={type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {type.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                    </Badge>
                    <Badge variant="outline">{type.typeCode}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <strong>Mô tả:</strong> {type.description}
                    </div>
                    
                    <div>
                      <strong>Yêu cầu số dư:</strong> 
                      <Badge className={type.requiresBalance ? 'bg-blue-100 text-blue-800 ml-2' : 'bg-gray-100 text-gray-800 ml-2'}>
                        {type.requiresBalance ? 'Có' : 'Không'}
                      </Badge>
                    </div>

                    <div>
                      <strong>Ngày mặc định/năm:</strong> {type.defaultDaysPerYear || 'N/A'}
                    </div>

                    <div>
                      <strong>Được trả lương:</strong>
                      <Badge className={type.isPaid ? 'bg-green-100 text-green-800 ml-2' : 'bg-red-100 text-red-800 ml-2'}>
                        {type.isPaid ? 'Có' : 'Không'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Tạo lúc: {format(new Date(type.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} | 
                    Cập nhật: {format(new Date(type.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* Navigate to detail page if needed */}}
                  >
                    <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                    Chi tiết
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <FontAwesomeIcon icon={faSearch} className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Không tìm thấy loại nghỉ phép nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}