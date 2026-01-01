'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Search,
  Eye,
  CreditCard,
  Loader2,
  Filter,
  X,
  Calendar,
  Receipt,
  User,
  DollarSign,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentService, PaymentResponse, PaymentMethod } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

// ==================== MAIN COMPONENT ====================
export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Permission checks
  const canView = user?.permissions?.includes('VIEW_PAYMENT_ALL') || false;

  // State management
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [invoiceIdFilter, setInvoiceIdFilter] = useState<string>('');

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (canView && invoiceIdFilter) {
      fetchPayments();
    }
  }, [canView, invoiceIdFilter]);

  const fetchPayments = async () => {
    if (!invoiceIdFilter) {
      setPayments([]);
      return;
    }

    try {
      setLoading(true);
      const invoiceId = parseInt(invoiceIdFilter);
      if (isNaN(invoiceId)) {
        toast.error('Invoice ID không hợp lệ');
        return;
      }

      const data = await paymentService.getPaymentsByInvoice(invoiceId);
      setPayments(data);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách thanh toán');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        payment.paymentCode?.toLowerCase().includes(searchLower) ||
        payment.invoiceCode?.toLowerCase().includes(searchLower) ||
        payment.referenceNumber?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Method filter
    if (filterMethod !== 'all') {
      if (payment.paymentMethod.toLowerCase() !== filterMethod.toLowerCase()) return false;
    }

    return true;
  });

  // Get method badge
  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'SEPAY':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            SePay
          </Badge>
        );
      case 'CASH':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Tiền mặt
          </Badge>
        );
      case 'CARD':
        return (
          <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
            Thẻ
          </Badge>
        );
      case 'BANK_TRANSFER':
        return (
          <Badge variant="outline">
            Chuyển khoản
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterMethod('all');
    setInvoiceIdFilter('');
    setPayments([]);
  };

  if (!canView) {
    return (
      <ProtectedRoute requiredPermissions={['VIEW_PAYMENT_ALL']}>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_PAYMENT_ALL']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8" />
              Quản Lý Thanh Toán
            </h1>
            <p className="text-gray-600 mt-1">Xem và quản lý tất cả giao dịch thanh toán</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ Lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice ID Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice ID *</label>
                <Input
                  placeholder="Nhập Invoice ID..."
                  value={invoiceIdFilter}
                  onChange={(e) => setInvoiceIdFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchPayments();
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Nhập Invoice ID để xem các thanh toán của hóa đơn đó</p>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mã thanh toán, mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Method Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Phương thức</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                >
                  <option value="all">Tất cả</option>
                  <option value="SEPAY">SePay</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="CARD">Thẻ</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchPayments} variant="default" disabled={!invoiceIdFilter}>
                Tải lại
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh Sách Thanh Toán ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : !invoiceIdFilter ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Vui lòng nhập Invoice ID để xem thanh toán</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy thanh toán nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <Card
                    key={payment.paymentId}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/invoices/${payment.invoiceCode}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{payment.paymentCode}</h3>
                            {getMethodBadge(payment.paymentMethod)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Hóa đơn:</span>
                              <span className="font-medium">{payment.invoiceCode}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Số tiền:</span>
                              <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                            </div>

                            {payment.paymentDate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Ngày:</span>
                                <span className="font-medium">{format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm')}</span>
                              </div>
                            )}

                            {payment.createdByName && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Người tạo:</span>
                                <span className="font-medium">{payment.createdByName}</span>
                              </div>
                            )}
                          </div>

                          {payment.referenceNumber && (
                            <div className="mt-2 text-sm text-gray-600">
                              Số tham chiếu: {payment.referenceNumber}
                            </div>
                          )}

                          {payment.notes && (
                            <div className="mt-2 text-sm text-gray-500">
                              Ghi chú: {payment.notes}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/invoices/${payment.invoiceCode}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem hóa đơn
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

