'use client';

/**
 * LEAVE BALANCES TAB COMPONENT
 * Tái sử dụng từ admin/leave-balances với tối ưu hóa
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Wallet,
  Plus,
  RefreshCw,
  AlertTriangle,
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
import CustomSelect from '@/components/ui/custom-select';

import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { employeeService } from '@/services/employeeService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';

import {
  EmployeeLeaveBalancesResponse,
  AdjustmentFormData,
  AnnualResetFormData
} from '@/types/leaveBalance';
import { Employee } from '@/types/employee';
import { TimeOffType } from '@/types/timeOff';

import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

interface LeaveBalancesTabProps {
  employees: Employee[];
  timeOffTypes: TimeOffType[];
}

export function LeaveBalancesTab({ employees: propEmployees, timeOffTypes: propTimeOffTypes }: LeaveBalancesTabProps) {
  const { user } = useAuth();
  const { handleError: handleApiError } = useApiErrorHandler();

  // RBAC Permissions
  const canViewBalances = user?.permissions?.includes('VIEW_LEAVE_BALANCE_ALL');
  const canAdjustBalances = user?.permissions?.includes('ADJUST_LEAVE_BALANCE');

  // Balance Viewer State
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>(propTimeOffTypes);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [balanceData, setBalanceData] = useState<EmployeeLeaveBalancesResponse | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Search/Filter State
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Year Picker State
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAnnualResetModal, setShowAnnualResetModal] = useState(false);

  // Form States
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

  // ⚡ Memoize filtered employees
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm.trim()) return employees;

    const searchLower = employeeSearchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.fullName.toLowerCase().includes(searchLower) ||
      emp.employeeCode?.toLowerCase().includes(searchLower) ||
      emp.employeeId.toString().includes(searchLower)
    );
  }, [employeeSearchTerm, employees]);

  // Load balances when employee or year changes
  useEffect(() => {
    if (selectedEmployeeId && selectedYear) {
      loadBalances();
    }
  }, [selectedEmployeeId, selectedYear]);

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

  // Sync with props if they change
  useEffect(() => {
    setEmployees(propEmployees);
  }, [propEmployees]);

  useEffect(() => {
    setTimeOffTypes(propTimeOffTypes);
  }, [propTimeOffTypes]);

  const loadBalances = async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoadingBalances(true);
      const data = await LeaveBalanceService.getEmployeeBalances(
        Number(selectedEmployeeId),
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

    if (!adjustFormData.timeOffTypeId) errors.timeOffTypeId = 'Vui lòng chọn loại phép';
    if (!adjustFormData.cycleYear) errors.cycleYear = 'Vui lòng nhập năm';
    if (adjustFormData.changeAmount === null || adjustFormData.changeAmount === 0) {
      errors.changeAmount = 'Vui lòng nhập số lượng điều chỉnh (khác 0)';
    }
    if (!adjustFormData.notes.trim()) errors.notes = 'Vui lòng nhập ghi chú';

    setAdjustFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdjust = async () => {
    if (!validateAdjustForm() || !selectedEmployeeId) return;

    try {
      setSubmittingAdjust(true);

      await LeaveBalanceService.adjustBalance({
        employee_id: Number(selectedEmployeeId),
        time_off_type_id: adjustFormData.timeOffTypeId,
        cycle_year: adjustFormData.cycleYear,
        change_amount: adjustFormData.changeAmount!,
        notes: adjustFormData.notes
      });

      alert('Điều chỉnh số dư ngày nghỉ thành công!');
      setShowAdjustModal(false);
      loadBalances();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorMsg.includes('INVALID_BALANCE') || error?.response?.status === 400) {
        setAdjustFormErrors({ changeAmount: 'Số dư ngày nghỉ không thể âm sau khi điều chỉnh' });
      } else if (errorMsg.includes('RELATED_RESOURCE_NOT_FOUND') || error?.response?.status === 404) {
        setAdjustFormErrors({ timeOffTypeId: 'Nhân viên hoặc loại ngày nghỉ phép không tồn tại' });
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

    if (!annualResetFormData.applyToTypeId) errors.applyToTypeId = 'Vui lòng chọn loại phép';
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

      const result = await LeaveBalanceService.annualReset({
        cycle_year: annualResetFormData.cycleYear,
        apply_to_type_id: annualResetFormData.applyToTypeId,
        default_allowance: annualResetFormData.defaultAllowance!
      });

      alert(`Job đã được kích hoạt thành công!\n\nSố nhân viên được cập nhật: ${result.employees_affected || 'N/A'}`);
      setShowAnnualResetModal(false);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorMsg.includes('JOB_ALREADY_RUN') || error?.response?.status === 409) {
        alert(`Job reset cho năm ${annualResetFormData.cycleYear} đã được chạy trước đó.`);
      } else if (errorMsg.includes('INVALID_YEAR') || error?.response?.status === 400) {
        setAnnualResetFormErrors({ cycleYear: 'Năm không hợp lệ' });
      } else {
        handleApiError(error, 'Không thể kích hoạt Job');
      }
    } finally {
      setSubmittingAnnualReset(false);
    }
  };

  // ==================== RENDER ====================

  if (!canViewBalances) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Bạn không có quyền xem số dư ngày nghỉ của nhân viên.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Actions */}
      <div className="flex justify-end mb-4">
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

      {/* Balance Viewer Card */}
      <Card>
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
                <CustomSelect
                  label="Chọn nhân viên"
                  value={selectedEmployeeId?.toString() || ''}
                  onChange={(value: string) => setSelectedEmployeeId(value || null)}
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
                className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Điều Chỉnh Số Dư Ngày Nghỉ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}

      {/* ==================== ADJUSTMENT MODAL ==================== */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Điều Chỉnh Phép Thủ Công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nhân viên:</strong> {employees.find(e => e.employeeId === selectedEmployeeId)?.fullName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjust-type">Loại Phép *</Label>
                  <select
                    id="adjust-type"
                    value={adjustFormData.timeOffTypeId}
                    onChange={(e) => {
                      setAdjustFormData({ ...adjustFormData, timeOffTypeId: e.target.value });
                      const newErrors = { ...adjustFormErrors };
                      delete newErrors.timeOffTypeId;
                      setAdjustFormErrors(newErrors);
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${adjustFormErrors.timeOffTypeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">-- Chọn loại phép --</option>
                    {timeOffTypes.map(type => (
                      <option key={type.typeId} value={type.typeId}>
                        {type.typeName} ({type.typeCode})
                      </option>
                    ))}
                  </select>
                  {adjustFormErrors.timeOffTypeId && (
                    <p className="text-red-500 text-sm mt-1">{adjustFormErrors.timeOffTypeId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adjust-year">Năm *</Label>
                  <Input
                    id="adjust-year"
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
                <textarea
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
                  className={`w-full px-3 py-2 border rounded-md ${adjustFormErrors.notes ? 'border-red-500' : 'border-gray-300'
                    }`}
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
                  className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
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
                <Label htmlFor="reset-type">Loại Phép *</Label>
                <select
                  id="reset-type"
                  value={annualResetFormData.applyToTypeId}
                  onChange={(e) => {
                    setAnnualResetFormData({ ...annualResetFormData, applyToTypeId: e.target.value });
                    const newErrors = { ...annualResetFormErrors };
                    delete newErrors.applyToTypeId;
                    setAnnualResetFormErrors(newErrors);
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${annualResetFormErrors.applyToTypeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">-- Chọn loại phép --</option>
                  {timeOffTypes.map(type => (
                    <option key={type.typeId} value={type.typeId}>
                      {type.typeName} ({type.typeCode})
                    </option>
                  ))}
                </select>
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
    </>
  );
}
