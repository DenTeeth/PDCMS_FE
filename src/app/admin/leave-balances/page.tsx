'use client';

/**
 * ⚠️ ADMIN LEAVE BALANCE MANAGEMENT PAGE (P6.1/P6.2)
 * 
 * FEATURES:
 * 1. Balance Viewer - Xem số dư phép của nhân viên (RBAC: VIEW_LEAVE_BALANCE_ALL)
 * 2. Manual Adjustment - Điều chỉnh thủ công số dư (RBAC: ADJUST_LEAVE_BALANCE)
 * 3. Annual Reset Tool - Kích hoạt job cộng phép năm (RBAC: ADJUST_LEAVE_BALANCE)
 * 
 * UI/UX: Following work-shifts pattern with purple theme
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Users,
  Calendar,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { employeeService } from '@/services/employeeService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';

import {
  EmployeeLeaveBalancesResponse,
  LeaveBalance,
  AdjustmentFormData,
  AnnualResetFormData
} from '@/types/leaveBalance';
import { Employee } from '@/types/employee';
import { TimeOffType } from '@/types/timeOff';

import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

export default function AdminLeaveBalancesPage() {
  const { user } = useAuth();
  const { handleError: handleApiError } = useApiErrorHandler();

  // RBAC Permissions
  const canViewBalances = user?.permissions?.includes('VIEW_LEAVE_BALANCE_ALL');
  const canAdjustBalances = user?.permissions?.includes('ADJUST_LEAVE_BALANCE');

  // ==================== STATE ====================

  // Balance Viewer State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [balanceData, setBalanceData] = useState<EmployeeLeaveBalancesResponse | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Search/Filter State
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Year Picker State
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAnnualResetModal, setShowAnnualResetModal] = useState(false);

  // Form States
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [adjustFormData, setAdjustFormData] = useState<AdjustmentFormData>({
    timeOffTypeId: '',
    cycleYear: new Date().getFullYear(),
    changeAmount: null,
    notes: ''
  });
  const [adjustFormErrors, setAdjustFormErrors] = useState<Partial<Record<keyof AdjustmentFormData, string>>>({});
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const [annualResetFormData, setAnnualResetFormData] = useState<AnnualResetFormData>({
    cycleYear: new Date().getFullYear() + 1,
    applyToTypeId: '',
    defaultAllowance: null
  });
  const [annualResetFormErrors, setAnnualResetFormErrors] = useState<Partial<Record<keyof AnnualResetFormData, string>>>({});
  const [submittingAnnualReset, setSubmittingAnnualReset] = useState(false);

  // ==================== LOAD DATA ====================

  useEffect(() => {
    if (canViewBalances) {
      loadEmployees();
      loadTimeOffTypes();
    }
  }, [canViewBalances]);

  useEffect(() => {
    if (selectedEmployeeId && selectedYear) {
      loadBalances();
    }
  }, [selectedEmployeeId, selectedYear]);

  // Filter employees based on search term
  useEffect(() => {
    if (employeeSearchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const searchLower = employeeSearchTerm.toLowerCase();
      const filtered = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchLower) ||
        emp.employeeCode?.toLowerCase().includes(searchLower) ||
        emp.employeeId.toString().includes(searchLower)
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearchTerm, employees]);

  // Close year picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setShowYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getEmployees();
      const empList = data.content || [];
      setEmployees(empList);
      setFilteredEmployees(empList);
    } catch (error: any) {
      handleApiError(error, 'Không thể tải danh sách nhân viên');
    }
  };

  const loadTimeOffTypes = async () => {
    try {
      const data = await TimeOffTypeService.getActiveTimeOffTypes();
      setTimeOffTypes(data);
    } catch (error: any) {
      handleApiError(error, 'Không thể tải danh sách loại nghỉ phép');
    }
  };

  const loadBalances = async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoadingBalances(true);
      const data = await LeaveBalanceService.getEmployeeBalances(
        selectedEmployeeId,
        selectedYear
      );
      setBalanceData(data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setBalanceData(null);
        alert('Không tìm thấy dữ liệu số dư ngày nghỉ cho nhân viên này');
      } else {
        handleApiError(error, 'Không thể tải số dư ngày nghỉ');
      }
    } finally {
      setLoadingBalances(false);
    }
  };

  // ==================== MANUAL ADJUSTMENT ====================

  const openAdjustModal = () => {
    if (!selectedEmployeeId) {
      alert('Vui lòng chọn nhân viên trước');
      return;
    }
    setAdjustFormData({
      timeOffTypeId: '',
      cycleYear: selectedYear,
      changeAmount: null,
      notes: ''
    });
    setAdjustFormErrors({});
    setShowAdjustModal(true);
  };

  const validateAdjustForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!adjustFormData.timeOffTypeId) {
      errors.timeOffTypeId = 'Vui lòng chọn loại phép';
    }

    if (!adjustFormData.cycleYear) {
      errors.cycleYear = 'Vui lòng nhập năm';
    }

    if (adjustFormData.changeAmount === null || adjustFormData.changeAmount === 0) {
      errors.changeAmount = 'Vui lòng nhập số lượng điều chỉnh (khác 0)';
    }

    if (!adjustFormData.notes.trim()) {
      errors.notes = 'Vui lòng nhập ghi chú';
    }

    setAdjustFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdjust = async () => {
    if (!validateAdjustForm() || !selectedEmployeeId) return;

    try {
      setSubmittingAdjust(true);

      await LeaveBalanceService.adjustBalance({
        employee_id: selectedEmployeeId,
        time_off_type_id: adjustFormData.timeOffTypeId,
        cycle_year: adjustFormData.cycleYear,
        change_amount: adjustFormData.changeAmount!,
        notes: adjustFormData.notes
      });

      alert('Điều chỉnh số dư ngày nghỉ thành công!');
      setShowAdjustModal(false);
      loadBalances(); // Refresh
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorMsg.includes('INVALID_BALANCE') || error?.response?.status === 400) {
        setAdjustFormErrors({
          changeAmount: 'Số dư ngày nghỉ không thể âm sau khi điều chỉnh'
        });
      } else if (errorMsg.includes('RELATED_RESOURCE_NOT_FOUND') || error?.response?.status === 404) {
        setAdjustFormErrors({
          timeOffTypeId: 'Nhân viên hoặc loại ngày nghỉ phép không tồn tại'
        });
      } else {
        handleApiError(error, 'Không thể điều chỉnh số dư ngày nghỉ');
      }
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // ==================== ANNUAL RESET ====================

  const openAnnualResetModal = () => {
    setAnnualResetFormData({
      cycleYear: new Date().getFullYear() + 1,
      applyToTypeId: '',
      defaultAllowance: null
    });
    setAnnualResetFormErrors({});
    setShowAnnualResetModal(true);
  };

  const validateAnnualResetForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!annualResetFormData.cycleYear) {
      errors.cycleYear = 'Vui lòng nhập năm áp dụng';
    } else if (annualResetFormData.cycleYear < new Date().getFullYear()) {
      errors.cycleYear = 'Năm phải >= năm hiện tại';
    }

    if (!annualResetFormData.applyToTypeId) {
      errors.applyToTypeId = 'Vui lòng chọn loại phép';
    }

    if (annualResetFormData.defaultAllowance === null || annualResetFormData.defaultAllowance <= 0) {
      errors.defaultAllowance = 'Số ngày cộng phải > 0';
    }

    setAnnualResetFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnnualReset = async () => {
    if (!validateAnnualResetForm()) return;

    const confirmMsg = `Bạn có chắc chắn muốn kích hoạt Job cộng phép năm ${annualResetFormData.cycleYear}?\n\nThao tác này sẽ ảnh hưởng đến TOÀN BỘ nhân viên trong hệ thống.`;

    if (!confirm(confirmMsg)) return;

    try {
      setSubmittingAnnualReset(true);

      const requestData = {
        cycle_year: annualResetFormData.cycleYear,
        apply_to_type_id: annualResetFormData.applyToTypeId,
        default_allowance: annualResetFormData.defaultAllowance!
      };

      console.log('🔄 Annual reset request:', requestData);

      const result = await LeaveBalanceService.annualReset(requestData);

      console.log('✅ Annual reset success:', result);
      alert('Job đã được kích hoạt thành công!');
      setShowAnnualResetModal(false);
    } catch (error: any) {
      console.error('❌ Annual reset error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        requestData: {
          cycle_year: annualResetFormData.cycleYear,
          apply_to_type_id: annualResetFormData.applyToTypeId,
          default_allowance: annualResetFormData.defaultAllowance
        }
      });

      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorMsg.includes('JOB_ALREADY_RUN') || error?.response?.status === 409) {
        alert(`Job reset cho năm ${annualResetFormData.cycleYear} đã được chạy trước đó.`);
      } else if (errorMsg.includes('INVALID_YEAR') || error?.response?.status === 400) {
        setAnnualResetFormErrors({
          cycleYear: 'Năm không hợp lệ'
        });
      } else {
        handleApiError(error, 'Không thể kích hoạt Job');
      }
    } finally {
      setSubmittingAnnualReset(false);
    }
  };

  // ==================== PERMISSION CHECK ====================

  if (!canViewBalances) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có quyền truy cập</h3>
            <p className="text-gray-600">Bạn không có quyền xem số dư ngày nghỉ của nhân viên.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Số Dư Ngày Nghỉ</h1>
          <p className="text-gray-600 mt-2">Xem và điều chỉnh số dư ngày nghỉ của nhân viên</p>
        </div>

        {canAdjustBalances && (
          <Button
            onClick={openAnnualResetModal}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Công Cụ Admin
          </Button>
        )}
      </div>

      {/* ==================== BALANCE VIEWER ==================== */}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-600" />
            Xem Số Dư Ngày Nghỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Chọn Nhân Viên</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã NV, hoặc ID..."
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {employeeSearchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                  Tìm thấy {filteredEmployees.length} nhân viên
                </p>
              )}
              <div className="mt-2">
                <Select
                  label=""
                  value={selectedEmployeeId?.toString() || ''}
                  onChange={(value) => setSelectedEmployeeId(Number(value))}
                  options={[
                    { value: '', label: '-- Chọn nhân viên --' },
                    ...filteredEmployees.map(emp => ({
                      value: emp.employeeId.toString(),
                      label: `${emp.fullName} (${emp.employeeCode || 'ID: ' + emp.employeeId})`
                    }))
                  ]}
                />
              </div>
            </div>

            <div className="relative" ref={yearPickerRef}>
              <Label htmlFor="year">Năm</Label>
              <Input
                id="year"
                type="text"
                value={selectedYear}
                onClick={() => setShowYearPicker(!showYearPicker)}
                readOnly
                placeholder="Chọn năm"
                className="cursor-pointer"
              />

              {/* Year Picker Dropdown */}
              {showYearPicker && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
                  {/* Header with navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDisplayYear(prev => prev - 12)}
                      className="p-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium text-gray-700">
                      {displayYear - 5} - {displayYear + 6}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDisplayYear(prev => prev + 12)}
                      className="p-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Year grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const year = displayYear - 5 + i;
                      const isSelected = year === selectedYear;
                      const isCurrent = year === new Date().getFullYear();

                      return (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setShowYearPicker(false);
                          }}
                          className={`
                            px-3 py-2 text-sm rounded transition-colors
                            ${isSelected
                              ? 'bg-purple-600 text-white font-semibold'
                              : isCurrent
                                ? 'bg-purple-50 text-purple-700 font-medium'
                                : 'hover:bg-gray-100 text-gray-700'
                            }
                          `}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loadingBalances && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          )}

          {/* Balance Table */}
          {!loadingBalances && balanceData && balanceData.balances.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Loại Nghỉ Phép
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Tổng Ngày Phép
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Đã Nghỉ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Còn Lại
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balanceData.balances.map((balance) => {
                    // Find full type info from timeOffTypes using the new structure
                    const typeInfo = timeOffTypes.find(t => t.typeId === balance.time_off_type.type_id);

                    return (
                      <tr key={balance.balance_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{balance.time_off_type.type_name}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {balance.time_off_type.type_id}
                              </Badge>
                              {balance.time_off_type.is_paid ? (
                                <Badge className="bg-green-50 text-green-700 text-xs">
                                  Có lương
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-50 text-gray-700 text-xs">
                                  Không lương
                                </Badge>
                              )}
                              {typeInfo?.requiresBalance && (
                                <Badge className="bg-blue-50 text-blue-700 text-xs">
                                  Yêu cầu số dư
                                </Badge>
                              )}
                            </div>
                            {typeInfo?.description && (
                              <div className="text-xs text-gray-500 italic">
                                {typeInfo.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            {balance.total_days_allowed} ngày
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-orange-100 text-orange-800">
                            {balance.days_taken} ngày
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={
                            balance.days_remaining > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }>
                            {balance.days_remaining} ngày
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loadingBalances && (!balanceData || balanceData.balances.length === 0) && selectedEmployeeId && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Không có dữ liệu số dư ngày nghỉ</p>
              <p className="text-sm text-gray-600">Nhân viên này chưa có dữ liệu số dư ngày nghỉ cho năm {selectedYear}</p>
            </div>
          )}

          {/* Action Button */}
          {canAdjustBalances && selectedEmployeeId && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={openAdjustModal}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Điều Chỉnh Số Dư Ngày Nghỉ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== ADJUSTMENT MODAL ==================== */}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle>Điều Chỉnh Số Dư Ngày Nghỉ Thủ Công</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 pt-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Nhập <strong>số dương</strong> để cộng phép, <strong>số âm</strong> để trừ phép.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Loại Phép *"
                    value={adjustFormData.timeOffTypeId}
                    onChange={(value) => {
                      setAdjustFormData({ ...adjustFormData, timeOffTypeId: value });
                      const newErrors = { ...adjustFormErrors };
                      delete newErrors.timeOffTypeId;
                      setAdjustFormErrors(newErrors);
                    }}
                    options={[
                      { value: '', label: '-- Chọn loại phép --' },
                      ...timeOffTypes.map(type => ({
                        value: type.typeId,
                        label: `${type.typeName} (${type.typeCode})`
                      }))
                    ]}
                  />
                  {adjustFormErrors.timeOffTypeId && (
                    <p className="text-red-500 text-sm mt-1">{adjustFormErrors.timeOffTypeId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adj-year">Năm *</Label>
                  <Input
                    id="adj-year"
                    type="number"
                    value={adjustFormData.cycleYear}
                    onChange={(e) => {
                      setAdjustFormData({ ...adjustFormData, cycleYear: Number(e.target.value) });
                      const newErrors = { ...adjustFormErrors };
                      delete newErrors.cycleYear;
                      setAdjustFormErrors(newErrors);
                    }}
                    className={adjustFormErrors.cycleYear ? 'border-red-500' : ''}
                  />
                  {adjustFormErrors.cycleYear && (
                    <p className="text-red-500 text-sm mt-1">{adjustFormErrors.cycleYear}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="change-amount">Số Lượng Điều Chỉnh *</Label>
                <Input
                  id="change-amount"
                  type="number"
                  placeholder="VD: 5"
                  value={adjustFormData.changeAmount ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    setAdjustFormData({ ...adjustFormData, changeAmount: value });
                    const newErrors = { ...adjustFormErrors };
                    delete newErrors.changeAmount;
                    setAdjustFormErrors(newErrors);
                  }}
                  className={adjustFormErrors.changeAmount ? 'border-red-500' : ''}
                />
                {adjustFormErrors.changeAmount && (
                  <p className="text-red-500 text-sm mt-1">{adjustFormErrors.changeAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Ghi Chú *</Label>
                <Textarea
                  id="notes"
                  placeholder="VD: Thưởng phép năm 2025, Sửa lỗi nhập liệu..."
                  rows={3}
                  value={adjustFormData.notes}
                  onChange={(e) => {
                    setAdjustFormData({ ...adjustFormData, notes: e.target.value });
                    const newErrors = { ...adjustFormErrors };
                    delete newErrors.notes;
                    setAdjustFormErrors(newErrors);
                  }}
                  className={adjustFormErrors.notes ? 'border-red-500' : ''}
                />
                {adjustFormErrors.notes && (
                  <p className="text-red-500 text-sm mt-1">{adjustFormErrors.notes}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  disabled={submittingAdjust}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAdjust}
                  disabled={submittingAdjust}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submittingAdjust ? 'Đang lưu...' : 'Lưu Điều Chỉnh'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== ANNUAL RESET MODAL ==================== */}

      {showAnnualResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Kích Hoạt Job Cộng Phép Năm Mới
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  CẢNH BÁO: Thao tác này sẽ ảnh hưởng đến TOÀN BỘ nhân viên!
                </p>
                <p className="text-sm text-red-700">
                  Job sẽ cộng số ngày phép mặc định cho tất cả nhân viên trong hệ thống cho năm được chọn.
                  Hãy chắc chắn bạn hiểu rõ tác động trước khi thực hiện.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reset-year">Năm Áp Dụng *</Label>
                  <Input
                    id="reset-year"
                    type="number"
                    value={annualResetFormData.cycleYear}
                    onChange={(e) => {
                      setAnnualResetFormData({ ...annualResetFormData, cycleYear: Number(e.target.value) });
                      const newErrors = { ...annualResetFormErrors };
                      delete newErrors.cycleYear;
                      setAnnualResetFormErrors(newErrors);
                    }}
                    min={new Date().getFullYear()}
                    className={annualResetFormErrors.cycleYear ? 'border-red-500' : ''}
                  />
                  {annualResetFormErrors.cycleYear && (
                    <p className="text-red-500 text-sm mt-1">{annualResetFormErrors.cycleYear}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reset-allowance">Số Ngày Cộng Mặc Định *</Label>
                  <Input
                    id="reset-allowance"
                    type="number"
                    placeholder="VD: 12"
                    value={annualResetFormData.defaultAllowance ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      setAnnualResetFormData({ ...annualResetFormData, defaultAllowance: value });
                      const newErrors = { ...annualResetFormErrors };
                      delete newErrors.defaultAllowance;
                      setAnnualResetFormErrors(newErrors);
                    }}
                    min={1}
                    className={annualResetFormErrors.defaultAllowance ? 'border-red-500' : ''}
                  />
                  {annualResetFormErrors.defaultAllowance && (
                    <p className="text-red-500 text-sm mt-1">{annualResetFormErrors.defaultAllowance}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reset-type">Loại Phép <span className="text-red-500">*</span></Label>
                <Select
                  value={annualResetFormData.applyToTypeId}
                  onChange={(value) => {
                    setAnnualResetFormData({ ...annualResetFormData, applyToTypeId: value });
                    const newErrors = { ...annualResetFormErrors };
                    delete newErrors.applyToTypeId;
                    setAnnualResetFormErrors(newErrors);
                  }}
                  options={[
                    { value: '', label: '-- Chọn loại phép --' },
                    ...timeOffTypes.map(type => ({
                      value: type.typeId,
                      label: `${type.typeName} (${type.typeCode})`
                    }))
                  ]}
                />
                {annualResetFormErrors.applyToTypeId && (
                  <p className="text-red-500 text-sm mt-1">{annualResetFormErrors.applyToTypeId}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAnnualResetModal(false)}
                  disabled={submittingAnnualReset}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAnnualReset}
                  disabled={submittingAnnualReset}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {submittingAnnualReset ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác Nhận Chạy Job'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
