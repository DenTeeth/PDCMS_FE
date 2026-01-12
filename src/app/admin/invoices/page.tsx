'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Search,
  Eye,
  FileText,
  Loader2,
  Filter,
  X,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Plus,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus, InvoiceType } from '@/services/invoiceService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import CreateSupplementalInvoiceModal from '@/components/invoices/CreateSupplementalInvoiceModal';
import PatientSearchInput from '@/components/invoices/PatientSearchInput';
import DateRangeFilter from '@/components/invoices/DateRangeFilter';

// ==================== MAIN COMPONENT ====================
export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Permission checks
  const canView = user?.permissions?.includes('VIEW_INVOICE_ALL') || false;
  const canCreate = user?.permissions?.includes('CREATE_INVOICE') || false;
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State management
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all'); // Tabs: all, appointment, treatment_plan, supplemental
  const [patientId, setPatientId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [quickFilter, setQuickFilter] = useState<string>('');

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (canView) {
      fetchInvoices();
    }
  }, [canView, patientId, startDate, endDate, filterStatus, activeTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // Build params for server-side filtering
      const params: any = {
        page: 0,
        size: 100,
        sort: 'createdAt,desc',
      };

      // Add status filter
      if (filterStatus !== 'all') {
        const statusMap: Record<string, InvoicePaymentStatus> = {
          pending: 'PENDING_PAYMENT',
          partial: 'PARTIAL_PAID',
          paid: 'PAID',
          overdue: 'OVERDUE',
          cancelled: 'CANCELLED',
        };
        params.status = statusMap[filterStatus];
      }

      // Add type filter (from tabs)
      if (activeTab !== 'all') {
        const typeMap: Record<string, InvoiceType> = {
          appointment: 'APPOINTMENT',
          treatment_plan: 'TREATMENT_PLAN',
          supplemental: 'SUPPLEMENTAL',
        };
        params.type = typeMap[activeTab];
      }

      // Add patient filter
      if (patientId) {
        params.patientId = patientId;
      }

      // Add date range filter
      if (startDate) {
        params.startDate = format(startDate, 'yyyy-MM-dd');
      }
      if (endDate) {
        params.endDate = format(endDate, 'yyyy-MM-dd');
      }

      const data = await invoiceService.getAllInvoices(params);
      setInvoices(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách hóa đơn');
      setInvoices([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter (for invoice code/patient name)
  const filteredInvoices = invoices.filter((invoice) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoiceCode?.toLowerCase().includes(searchLower) ||
        invoice.patientName?.toLowerCase().includes(searchLower) ||
        invoice.paymentCode?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get status badge
  const getStatusBadge = (status: InvoicePaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã thanh toán
          </Badge>
        );
      case 'PARTIAL_PAID':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Thanh toán một phần
          </Badge>
        );
      case 'PENDING_PAYMENT':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chờ thanh toán
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Quá hạn
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get type label
  const getTypeLabel = (type: InvoiceType) => {
    switch (type) {
      case 'APPOINTMENT':
        return 'Lịch hẹn';
      case 'TREATMENT_PLAN':
        return 'Kế hoạch điều trị';
      case 'SUPPLEMENTAL':
        return 'Bổ sung';
      default:
        return type;
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setActiveTab('all');
    setPatientId(null);
    setStartDate(null);
    setEndDate(null);
    setQuickFilter('');
  };

  // Get invoice counts by type
  const getInvoiceCounts = () => {
    const all = invoices.length;
    const appointment = invoices.filter(inv => inv.invoiceType === 'APPOINTMENT').length;
    const treatmentPlan = invoices.filter(inv => inv.invoiceType === 'TREATMENT_PLAN').length;
    const supplemental = invoices.filter(inv => inv.invoiceType === 'SUPPLEMENTAL').length;
    return { all, appointment, treatmentPlan, supplemental };
  };

  const counts = getInvoiceCounts();

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Hóa đơn');

      // Define columns
      worksheet.columns = [
        { header: 'Mã hóa đơn', key: 'invoiceCode', width: 20 },
        { header: 'Bệnh nhân', key: 'patientName', width: 25 },
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
        { header: 'Loại', key: 'type', width: 20 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
        { header: 'Đã thanh toán', key: 'paidAmount', width: 15 },
        { header: 'Còn nợ', key: 'remainingDebt', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data
      filteredInvoices.forEach(inv => {
        worksheet.addRow({
          invoiceCode: inv.invoiceCode,
          patientName: inv.patientName,
          createdAt: inv.createdAt ? format(new Date(inv.createdAt), 'dd/MM/yyyy HH:mm') : '',
          type: getTypeLabel(inv.invoiceType),
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          remainingDebt: inv.remainingDebt,
          status: inv.paymentStatus,
        });
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Đã xuất file Excel thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Không thể xuất file Excel');
    }
  };

  if (!canView) {
    return (
      <ProtectedRoute requiredPermissions={['VIEW_INVOICE_ALL']}>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_INVOICE_ALL']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-8 w-8" />
              Quản lý hóa đơn
            </h1>
            <p className="text-gray-600 mt-1">Xem và quản lý tất cả hóa đơn trong hệ thống</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo hóa đơn bổ sung
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Invoices */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng hóa đơn</p>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
                <Receipt className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Paid */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã thu</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
                    )}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Debt */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Công nợ</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      invoices.reduce((sum, inv) => sum + inv.remainingDebt, 0)
                    )}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Patient Search + General Search + Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PatientSearchInput onPatientSelect={(id) => setPatientId(id)} />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="partial">Thanh toán một phần</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="overdue">Quá hạn</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date Range + Quick Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={quickFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today);
                    setEndDate(today);
                    setQuickFilter('today');
                  }}
                >
                  Hôm nay
                </Button>
                <Button
                  variant={quickFilter === 'this-week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    setStartDate(startOfWeek);
                    setEndDate(new Date());
                    setQuickFilter('this-week');
                  }}
                >
                  Tuần này
                </Button>
                <Button
                  variant={quickFilter === 'this-month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setEndDate(new Date());
                    setQuickFilter('this-month');
                  }}
                >
                  Tháng này
                </Button>
                <Button
                  variant={quickFilter === 'unpaid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilterStatus('pending');
                    setQuickFilter('unpaid');
                  }}
                >
                  Chưa thanh toán
                </Button>
              </div>
            </div>

            {/* Quick Filter Buttons - Already included above */}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/20 rounded-full h-auto p-1 w-full md:w-auto">
            <TabsTrigger
              value="all"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Tổng ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              value="appointment"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Lịch hẹn ({counts.appointment})
            </TabsTrigger>
            <TabsTrigger
              value="treatment_plan"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Kế hoạch điều trị ({counts.treatmentPlan})
            </TabsTrigger>
            <TabsTrigger
              value="supplemental"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Bổ sung ({counts.supplemental})
            </TabsTrigger>
          </TabsList>

          {/* All Invoices Tab */}
          <TabsContent value="all">
            <InvoicesListContent
              invoices={filteredInvoices}
              loading={loading}
              router={router}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
              format={format}
            />
          </TabsContent>

          {/* Appointment Invoices Tab */}
          <TabsContent value="appointment">
            <InvoicesListContent
              invoices={filteredInvoices}
              loading={loading}
              router={router}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
              format={format}
            />
          </TabsContent>

          {/* Treatment Plan Invoices Tab */}
          <TabsContent value="treatment_plan">
            <InvoicesListContent
              invoices={filteredInvoices}
              loading={loading}
              router={router}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
              format={format}
            />
          </TabsContent>

          {/* Supplemental Invoices Tab */}
          <TabsContent value="supplemental">
            <InvoicesListContent
              invoices={filteredInvoices}
              loading={loading}
              router={router}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
              format={format}
            />
          </TabsContent>
        </Tabs>

        {/* Create Supplemental Invoice Modal */}
        <CreateSupplementalInvoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInvoices();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

// ==================== INVOICES LIST CONTENT COMPONENT ====================
interface InvoicesListContentProps {
  invoices: InvoiceResponse[];
  loading: boolean;
  router: any;
  getStatusBadge: (status: InvoicePaymentStatus) => JSX.Element;
  getTypeLabel: (type: InvoiceType) => string;
  formatCurrency: (amount: number) => string;
  format: (date: Date, format: string) => string;
}

function InvoicesListContent({
  invoices,
  loading,
  router,
  getStatusBadge,
  getTypeLabel,
  formatCurrency,
  format,
}: InvoicesListContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Danh sách hóa đơn ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy hóa đơn nào</p>
                <p className="text-sm text-gray-500 mt-2">Thử điều chỉnh bộ lọc để xem thêm kết quả</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card
                    key={invoice.invoiceId}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/invoices/${invoice.invoiceCode}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{invoice.invoiceCode}</h3>
                            {getStatusBadge(invoice.paymentStatus)}
                            <Badge variant="outline">{getTypeLabel(invoice.invoiceType)}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Bệnh nhân:</span>
                              <span className="font-medium">{invoice.patientName || `ID: ${invoice.patientId}`}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Tổng tiền:</span>
                              <span className="font-medium text-green-600">{formatCurrency(invoice.totalAmount)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Đã trả:</span>
                              <span className="font-medium">{formatCurrency(invoice.paidAmount)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Còn lại:</span>
                              <span className="font-medium text-orange-600">{formatCurrency(invoice.remainingDebt)}</span>
                            </div>
                          </div>

                          <div className="mt-2 space-y-1">
                            {invoice.appointmentCode && (
                              <div className="text-sm text-gray-600">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Lịch hẹn: {invoice.appointmentCode}
                              </div>
                            )}
                            {invoice.treatmentPlanCode && (
                              <div className="text-sm text-gray-600">
                                <FileText className="h-4 w-4 inline mr-1" />
                                Kế hoạch điều trị: {invoice.treatmentPlanCode}
                              </div>
                            )}
                            {/* ✅ FIX: Hiển thị cả Người tạo hóa đơn và Bác sĩ phụ trách */}
                            {invoice.createdAt && (
                              <div className="text-sm text-gray-500 space-y-1">
                                {/* Người tạo hóa đơn */}
                                {invoice.invoiceCreatorName ? (
                                  <div>
                                    Tạo lúc: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')} bởi {invoice.invoiceCreatorName}
                                  </div>
                                ) : invoice.createdByName ? (
                                  <div>
                                    Tạo lúc: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')} bởi {invoice.createdByName}
                                  </div>
                                ) : (
                                  <div>
                                    Tạo lúc: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                                {/* Bác sĩ phụ trách (nếu khác với người tạo) */}
                                {invoice.createdByName && 
                                 invoice.invoiceCreatorName && 
                                 invoice.createdByName !== invoice.invoiceCreatorName && (
                                  <div>
                                    Bác sĩ phụ trách: {invoice.createdByName}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/invoices/${invoice.invoiceCode}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
  );
}

