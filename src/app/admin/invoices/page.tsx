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
} from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus, InvoiceType } from '@/services/invoiceService';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import CreateSupplementalInvoiceModal from '@/components/invoices/CreateSupplementalInvoiceModal';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all'); // Tabs: all, appointment, treatment_plan, supplemental
  const [patientIdFilter, setPatientIdFilter] = useState<string>('');

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (canView) {
      fetchInvoices();
    }
  }, [canView, patientIdFilter, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // If search term looks like an invoice code, try to fetch by code
      if (searchTerm && searchTerm.trim().length > 0) {
        const trimmedSearch = searchTerm.trim();
        
        // Check if search term looks like an invoice code (starts with INV-)
        if (trimmedSearch.toUpperCase().startsWith('INV-')) {
          try {
            const invoice = await invoiceService.getInvoiceByCode(trimmedSearch);
            setInvoices([invoice]);
            return;
          } catch (error: any) {
            // If invoice not found, continue with other search methods
            console.log('Invoice not found by code, trying other methods...');
          }
        }
      }

      // If patientId filter is set, fetch by patient
      if (patientIdFilter) {
        const patientId = parseInt(patientIdFilter);
        if (!isNaN(patientId)) {
          const data = await invoiceService.getInvoicesByPatient(patientId);
          setInvoices(data);
          return;
        }
      }

      // Otherwise, fetch all invoices
      try {
        const data = await invoiceService.getAllInvoices();
        setInvoices(data);
      } catch (error: any) {
        // If getAllInvoices fails, show empty list with message
        console.warn('Could not fetch all invoices, showing empty list');
        setInvoices([]);
        if (!searchTerm && !patientIdFilter) {
          toast.info('Không thể tải danh sách hóa đơn. Vui lòng thử tìm kiếm theo Invoice Code hoặc Patient ID');
        }
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        invoice.invoiceCode?.toLowerCase().includes(searchLower) ||
        invoice.patientName?.toLowerCase().includes(searchLower) ||
        invoice.paymentCode?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending' && invoice.paymentStatus !== 'PENDING_PAYMENT') return false;
      if (filterStatus === 'partial' && invoice.paymentStatus !== 'PARTIAL_PAID') return false;
      if (filterStatus === 'paid' && invoice.paymentStatus !== 'PAID') return false;
      if (filterStatus === 'cancelled' && invoice.paymentStatus !== 'CANCELLED') return false;
    }

    // Type filter (from tabs)
    if (activeTab !== 'all') {
      if (activeTab === 'appointment' && invoice.invoiceType !== 'APPOINTMENT') return false;
      if (activeTab === 'treatment_plan' && invoice.invoiceType !== 'TREATMENT_PLAN') return false;
      if (activeTab === 'supplemental' && invoice.invoiceType !== 'SUPPLEMENTAL') return false;
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
    setPatientIdFilter('');
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient ID Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient ID</label>
                <Input
                  placeholder="Nhập Patient ID..."
                  value={patientIdFilter}
                  onChange={(e) => setPatientIdFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchInvoices();
                    }
                  }}
                />
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mã hóa đơn, tên bệnh nhân..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
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
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchInvoices} variant="default">
                Tải lại
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Xóa bộ lọc
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
              patientIdFilter={patientIdFilter}
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
              patientIdFilter={patientIdFilter}
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
              patientIdFilter={patientIdFilter}
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
              patientIdFilter={patientIdFilter}
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
  patientIdFilter: string;
  router: any;
  getStatusBadge: (status: InvoicePaymentStatus) => JSX.Element;
  getTypeLabel: (type: InvoiceType) => string;
  formatCurrency: (amount: number) => string;
  format: (date: Date, format: string) => string;
}

function InvoicesListContent({
  invoices,
  loading,
  patientIdFilter,
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
                {!patientIdFilter && (
                  <p className="text-sm text-gray-500 mt-2">Vui lòng nhập Patient ID để xem hóa đơn</p>
                )}
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
                            {invoice.createdAt && (
                              <div className="text-sm text-gray-500">
                                Tạo lúc: {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                                {invoice.createdByName && ` bởi ${invoice.createdByName}`}
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

