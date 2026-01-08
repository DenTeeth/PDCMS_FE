'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardFilters } from '@/types/dashboard';
import { Filter, X } from 'lucide-react';

interface AdvancedFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  employees?: Array<{ id: number; name: string }>;
  patients?: Array<{ id: number; name: string }>;
  services?: Array<{ id: number; name: string }>;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  employees = [],
  patients = [],
  services = [],
}) => {
  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      employeeIds: [],
      patientIds: [],
      serviceIds: [],
      appointmentStatus: undefined,
      invoiceStatus: undefined,
      minRevenue: undefined,
      maxRevenue: undefined,
    });
  };

  const hasActiveFilters = 
    (filters.employeeIds?.length ?? 0) > 0 ||
    (filters.patientIds?.length ?? 0) > 0 ||
    (filters.serviceIds?.length ?? 0) > 0 ||
    filters.appointmentStatus !== undefined ||
    filters.invoiceStatus !== undefined ||
    filters.minRevenue !== undefined ||
    filters.maxRevenue !== undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Lọc nâng cao
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Employee Filter */}
          <div className="space-y-2">
            <Label htmlFor="employee-filter">Nhân viên</Label>
            <Select
              value={filters.employeeIds?.[0]?.toString() || ''}
              onValueChange={(value) => 
                handleFilterChange('employeeIds', value ? [parseInt(value)] : [])
              }
            >
              <SelectTrigger id="employee-filter">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Patient Filter */}
          <div className="space-y-2">
            <Label htmlFor="patient-filter">Bệnh nhân</Label>
            <Select
              value={filters.patientIds?.[0]?.toString() || ''}
              onValueChange={(value) => 
                handleFilterChange('patientIds', value ? [parseInt(value)] : [])
              }
            >
              <SelectTrigger id="patient-filter">
                <SelectValue placeholder="Chọn bệnh nhân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Filter */}
          <div className="space-y-2">
            <Label htmlFor="service-filter">Dịch vụ</Label>
            <Select
              value={filters.serviceIds?.[0]?.toString() || ''}
              onValueChange={(value) => 
                handleFilterChange('serviceIds', value ? [parseInt(value)] : [])
              }
            >
              <SelectTrigger id="service-filter">
                <SelectValue placeholder="Chọn dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="appointment-status-filter">Trạng thái lịch hẹn</Label>
            <Select
              value={filters.appointmentStatus || ''}
              onValueChange={(value) => 
                handleFilterChange('appointmentStatus', value || undefined)
              }
            >
              <SelectTrigger id="appointment-status-filter">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="SCHEDULED">Đã đặt lịch</SelectItem>
                <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang điều trị</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="CANCELLED_LATE">Hủy muộn</SelectItem>
                <SelectItem value="NO_SHOW">Không đến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="invoice-status-filter">Trạng thái hóa đơn</Label>
            <Select
              value={filters.invoiceStatus || ''}
              onValueChange={(value) => 
                handleFilterChange('invoiceStatus', value || undefined)
              }
            >
              <SelectTrigger id="invoice-status-filter">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
                <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Range Filter */}
          <div className="space-y-2">
            <Label>Khoảng doanh thu (VNĐ)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Từ"
                value={filters.minRevenue || ''}
                onChange={(e) => 
                  handleFilterChange('minRevenue', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Đến"
                value={filters.maxRevenue || ''}
                onChange={(e) => 
                  handleFilterChange('maxRevenue', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
