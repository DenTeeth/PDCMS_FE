'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faFileImport,
  faFileExport,
  faEye,
  faEdit,
  faTrash,
  faWarehouse,
  faDollarSign,
  faBoxes,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import warehouseService from '@/services/warehouseService';
import {
  StorageTransaction,
  TransactionType,
  WarehouseType,
  TransactionFilter,
} from '@/types/warehouse';
import TransactionFormModal from '../components/TransactionFormModal';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function StorageInOutPage() {
  const [transactions, setTransactions] = useState<StorageTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<StorageTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<WarehouseType | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.IN);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StorageTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<StorageTransaction | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    totalTransactions: 0,
    totalValue: 0,
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const filter: TransactionFilter = {
        type: activeTab,
        warehouseType: selectedWarehouseType === 'ALL' ? undefined : selectedWarehouseType,
      };
      const [response, suppliersData, itemsData] = await Promise.all([
        warehouseService.getTransactions(filter),
        warehouseService.getSuppliers({ page: 0, size: 1000 }),
        warehouseService.getInventoryItems({ warehouseType: selectedWarehouseType === 'ALL' ? undefined : selectedWarehouseType }),
      ]);
      setTransactions(response.content);
      setFilteredTransactions(response.content);
      setSuppliers(suppliersData.content); // Extract content from PageResponse
      setInventoryItems(itemsData.content);
      calculateStats(response.content);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Không thể tải danh sách phiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, selectedWarehouseType]);

  // Calculate statistics
  const calculateStats = (data: StorageTransaction[]) => {
    const inTransactions = data.filter((t) => t.type === TransactionType.IN);
    const outTransactions = data.filter((t) => t.type === TransactionType.OUT);
    const totalIn = inTransactions.reduce((sum, t) => sum + t.totalCost, 0);
    const totalOut = outTransactions.reduce((sum, t) => sum + t.totalCost, 0);

    setStats({
      totalIn,
      totalOut,
      totalTransactions: data.length,
      totalValue: totalIn - totalOut,
    });
  };

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = transactions.filter(
        (txn) =>
          txn.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchTerm, transactions]);

  // Handle create/edit
  const handleOpenFormModal = (transaction?: StorageTransaction) => {
    setEditingTransaction(transaction || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingTransaction(null);
    setIsFormModalOpen(false);
  };

  const handleSaveTransaction = async (data: any) => {
    try {
      if (editingTransaction) {
        await warehouseService.updateTransaction(editingTransaction.id, data);
      } else {
        await warehouseService.createTransaction(data);
      }
      handleCloseFormModal();
      await fetchTransactions();
      toast.success(editingTransaction ? 'Cập nhật phiếu thành công' : 'Tạo phiếu thành công');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Không thể lưu phiếu');
    }
  };

  // Handle view detail
  const handleViewDetail = (transaction: StorageTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu này?')) return;

    try {
      await warehouseService.deleteTransaction(id);
      toast.success('Xóa phiếu thành công');
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Không thể xóa phiếu');
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Xuất Nhập Kho</h1>
          <p className="text-muted-foreground mt-1">Quản lý phiếu xuất/nhập kho</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Tạo Phiếu Mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Phiếu Nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileImport} className="text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalIn)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Phiếu Xuất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileExport} className="text-red-500" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalOut)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số Phiếu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxes} className="text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalTransactions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giá Trị Tồn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faDollarSign} className="text-purple-500" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} />
            Bộ Lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Warehouse Type Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Loại Kho</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedWarehouseType === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedWarehouseType('ALL')}
                >
                  Tất Cả
                </Button>
                <Button
                  variant={selectedWarehouseType === WarehouseType.COLD ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedWarehouseType(WarehouseType.COLD)}
                >
                  <FontAwesomeIcon icon={faWarehouse} className="mr-2 text-blue-500" />
                  Kho Lạnh
                </Button>
                <Button
                  variant={selectedWarehouseType === WarehouseType.NORMAL ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedWarehouseType(WarehouseType.NORMAL)}
                >
                  <FontAwesomeIcon icon={faWarehouse} className="mr-2 text-orange-500" />
                  Kho Thường
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tìm Kiếm</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Tìm mã phiếu, nhà cung cấp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for IN/OUT */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value={TransactionType.IN}>
            <FontAwesomeIcon icon={faFileImport} className="mr-2" />
            Phiếu Nhập
          </TabsTrigger>
          <TabsTrigger value={TransactionType.OUT}>
            <FontAwesomeIcon icon={faFileExport} className="mr-2" />
            Phiếu Xuất
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TransactionType.IN} className="mt-6">
          <TransactionTable
            transactions={filteredTransactions}
            loading={loading}
            onView={handleViewDetail}
            onEdit={handleOpenFormModal}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value={TransactionType.OUT} className="mt-6">
          <TransactionTable
            transactions={filteredTransactions}
            loading={loading}
            onView={handleViewDetail}
            onEdit={handleOpenFormModal}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        type={activeTab}
        warehouseType={selectedWarehouseType === 'ALL' ? WarehouseType.NORMAL : selectedWarehouseType}
        suppliers={suppliers}
        inventoryItems={inventoryItems}
      />

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}

// Transaction Table Component
interface TransactionTableProps {
  transactions: StorageTransaction[];
  loading: boolean;
  onView: (transaction: StorageTransaction) => void;
  onEdit: (transaction: StorageTransaction) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
}

function TransactionTable({
  transactions,
  loading,
  onView,
  onEdit,
  onDelete,
  formatCurrency,
}: TransactionTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Không có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Mã Phiếu</th>
                <th className="text-left p-4 font-medium">Loại Kho</th>
                <th className="text-left p-4 font-medium">Nhà Cung Cấp</th>
                <th className="text-left p-4 font-medium">Ngày</th>
                <th className="text-left p-4 font-medium">Tổng Tiền</th>
                <th className="text-left p-4 font-medium">Ghi Chú</th>
                <th className="text-right p-4 font-medium">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono">{txn.code}</td>
                  <td className="p-4">
                    <Badge variant={txn.warehouseType === WarehouseType.COLD ? 'default' : 'secondary'}>
                      {txn.warehouseType === WarehouseType.COLD ? 'Kho Lạnh' : 'Kho Thường'}
                    </Badge>
                  </td>
                  <td className="p-4">{txn.supplierName || '-'}</td>
                  <td className="p-4">{new Date(txn.transactionDate).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 font-semibold">{formatCurrency(txn.totalCost)}</td>
                  <td className="p-4 text-muted-foreground">{txn.notes || '-'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onView(txn)}>
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(txn)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(txn.id)}>
                        <FontAwesomeIcon icon={faTrash} className="text-red-500" />
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
  );
}
