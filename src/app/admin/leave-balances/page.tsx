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

import React, { useState, useEffect } from 'react';
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
  Settings
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

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.content || []);
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
        alert('Không tìm thấy dữ liệu số dư phép cho nhân viên này');
      } else {
        handleApiError(error, 'Không thể tải số dư phép');
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

      alert('Điều chỉnh số dư phép thành công!');
      setShowAdjustModal(false);
      loadBalances(); // Refresh
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '';

      if (errorMsg.includes('INVALID_BALANCE') || error?.response?.status === 400) {
        setAdjustFormErrors({
          changeAmount: 'Số dư phép không thể âm sau khi điều chỉnh'
        });
      } else if (errorMsg.includes('RELATED_RESOURCE_NOT_FOUND') || error?.response?.status === 404) {
        setAdjustFormErrors({
          timeOffTypeId: 'Nhân viên hoặc loại phép không tồn tại'
        });
      } else {
        handleApiError(error, 'Không thể điều chỉnh số dư phép');
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
            <p className="text-gray-600">Bạn không có quyền xem số dư phép của nhân viên.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Số Dư Phép</h1>
          <p className="text-gray-600 mt-2">Xem và điều chỉnh số dư phép của nhân viên</p>
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
            Xem Số Dư Phép
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Select
                label="Chọn Nhân Viên"
                value={selectedEmployeeId?.toString() || ''}
                onChange={(value) => setSelectedEmployeeId(Number(value))}
                options={[
                  { value: '', label: '-- Chọn nhân viên --' },
                  ...employees.map(emp => ({
                    value: emp.employeeId.toString(),
                    label: `${emp.fullName} (ID: ${emp.employeeId})`
                  }))
                ]}
              />
            </div>

            <div>
              <Label htmlFor="year">Năm</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                min={2020}
                max={2100}
              />
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
                      Loại Phép
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
                  {balanceData.balances.map((balance) => (
                    <tr key={balance.balance_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{balance.type_name}</div>
                          <div className="text-sm text-gray-500">{balance.type_code}</div>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loadingBalances && (!balanceData || balanceData.balances.length === 0) && selectedEmployeeId && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Không có dữ liệu số dư phép</p>
              <p className="text-sm text-gray-600">Nhân viên này chưa có dữ liệu số dư phép cho năm {selectedYear}</p>
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
                Điều Chỉnh Số Dư
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== ADJUSTMENT MODAL ==================== */}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Điều Chỉnh Số Dư Phép Thủ Công</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="VD: 5 (cộng), -3 (trừ)"
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
                  ⚠️ CẢNH BÁO: Thao tác này sẽ ảnh hưởng đến TOÀN BỘ nhân viên!
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
                <Select
                  label="Loại Phép *"
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
