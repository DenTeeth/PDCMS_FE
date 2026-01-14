'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService } from '@/services/invoiceService';
import {
  PaymentHistoryFilters,
  PatientPaymentHistoryResponse,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
} from '@/types/patientPaymentHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFileInvoice,
  faMoneyBillWave,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faFilter,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { getToken } from '@/lib/cookies';
import { getPatientCodeFromToken } from '@/lib/utils';

export default function PatientPaymentHistoryPage() {
  const { user, hasPermission } = useAuth();
  
  // Permissions
  const canViewOwn = hasPermission('VIEW_INVOICE_OWN');
  
  // State
  const [data, setData] = useState<PatientPaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientCode, setPatientCode] = useState<string>('');
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    patientCode: '',
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Get patient code from token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const code = getPatientCodeFromToken(token);
      if (code) {
        setPatientCode(code);
        setFilters(prev => ({ ...prev, patientCode: code }));
      } else {
        toast.error('Không thể xác định mã bệnh nhân từ tài khoản');
      }
    }
  }, []);
  
  // Check permissions
  useEffect(() => {
    if (!canViewOwn) {
      toast.error('Bạn không có quyền xem lịch sử thanh toán');
    }
  }, [canViewOwn]);
  
  // Load data
  const loadData = async () => {
    if (!patientCode || patientCode.trim() === '') {
      return;
    }
    
    setLoading(true);
    try {
      const response = await invoiceService.getPatientPaymentHistory({
        ...filters,
        patientCode,
      });
      setData(response);
    } catch (error: any) {
      console.error('Error loading payment history:', error);
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy lịch sử thanh toán');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xem lịch sử thanh toán');
      } else {
        toast.error('Không thể tải lịch sử thanh toán');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof PaymentHistoryFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 0 }); // Reset to page 0 when filter changes
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };
  
  // Apply filters and reload
  const applyFilters = () => {
    setFilters({ ...filters, page: 0 });
    loadData();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      patientCode: patientCode,
      page: 0,
      size: 10,
      sort: 'createdAt,desc',
    });
  };
  
  // Load data on mount and when filters change
  useEffect(() => {
    if (patientCode) {
      loadData();
    }
  }, [patientCode, filters.page]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lịch sử thanh toán</h1>
        <p className="text-gray-600 mt-2">Xem lịch sử hóa đơn và thanh toán của bạn</p>
        {patientCode && (
          <p className="text-sm text-gray-500 mt-1">Mã bệnh nhân: <span className="font-semibold">{patientCode}</span></p>
        )}
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} />
              Bộ lọc
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ẩn' : 'Hiển thị'} bộ lọc
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PARTIAL_PAID">Thanh toán một phần</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div>
                <Label htmlFor="fromDate">Từ ngày</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="toDate">Đến ngày</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="button" onClick={applyFilters} disabled={loading}>
                  <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                  Áp dụng bộ lọc
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Summary Statistics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Tổng hóa đơn</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalInvoices}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.paidAmount)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Còn nợ</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.remainingAmount)}</p>
                {data.summary.unpaidInvoices > 0 && (
                  <p className="text-xs text-orange-600 mt-1">{data.summary.unpaidInvoices} hóa đơn chưa thanh toán</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Invoices List */}
      {data && data.invoices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileInvoice} />
              Danh sách hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.invoices.map((invoice) => {
                const statusConfig = PAYMENT_STATUS_CONFIG[invoice.paymentStatus];
                
                return (
                  <div key={invoice.invoiceCode} className="border rounded-lg p-4 hover:bg-gray-50">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{invoice.invoiceCode}</h4>
                        <p className="text-sm text-gray-600">
                          {invoice.appointmentCode && `Lịch hẹn: ${invoice.appointmentCode}`}
                          {invoice.appointmentCode && invoice.treatmentPlanCode && ' | '}
                          {invoice.treatmentPlanCode && `Kế hoạch: ${invoice.treatmentPlanCode}`}
                        </p>
                      </div>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Ngày tạo</p>
                        <p className="font-medium">{formatDate(invoice.issuedDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tổng tiền</p>
                        <p className="font-medium text-blue-600">{formatCurrency(invoice.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Đã thanh toán</p>
                        <p className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Còn nợ</p>
                        <p className="font-medium text-orange-600">{formatCurrency(invoice.remainingAmount)}</p>
                      </div>
                    </div>
                    
                    {/* Services */}
                    {invoice.items.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Dịch vụ:</p>
                        <ul className="text-sm space-y-1">
                          {invoice.items.map((item) => (
                            <li key={item.itemId} className="flex justify-between">
                              <span>{item.serviceName}       x {item.quantity}</span>
                              <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Payment History */}
                    {invoice.payments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Lịch sử thanh toán:</p>
                        <ul className="text-sm space-y-1">
                          {invoice.payments.map((payment) => {
                            const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod];
                            return (
                              <li key={payment.paymentId} className="flex justify-between items-center">
                                <div>
                                  <span className="text-gray-600">{formatDate(payment.paymentDate)}</span>
                                  <Badge className={`ml-2 ${methodConfig.bgColor} ${methodConfig.color} text-xs`}>
                                    {methodConfig.label}
                                  </Badge>
                                  {payment.notes && <span className="text-gray-500 ml-2">- {payment.notes}</span>}
                                </div>
                                <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {/* Notes */}
                    {invoice.notes && (
                      <div className="mt-3 text-sm text-gray-600 italic">
                        Ghi chú: {invoice.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Trang {data.pagination.currentPage} / {data.pagination.totalPages}
                  {' '}(Tổng {data.pagination.totalItems} hóa đơn)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page! - 1)}
                    disabled={filters.page === 0 || loading}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page! + 1)}
                    disabled={filters.page! >= data.pagination.totalPages - 1 || loading}
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : data && data.invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FontAwesomeIcon icon={faFileInvoice} className="text-gray-400 text-5xl mb-4" />
            <p className="text-gray-500 text-lg">Bạn chưa có hóa đơn nào</p>
          </CardContent>
        </Card>
      ) : null}
      
      {/* Loading State */}
      {loading && !data && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </CardContent>
        </Card>
      )}
      
      {/* Error State */}
      {!loading && !data && patientCode && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Vui lòng chọn bộ lọc và nhấn "Áp dụng bộ lọc" để xem lịch sử thanh toán</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
