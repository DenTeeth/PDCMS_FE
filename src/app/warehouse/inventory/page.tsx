'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { inventoryItems } from '@/data/warehouse-data';
import Link from 'next/link';

export default function InventoryListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'material', label: 'Material' },
    { value: 'consumable', label: 'Consumable' },
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'expired', label: 'Expired' },
  ];

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medicine':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'equipment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'material':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'consumable':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all dental supplies, equipment, and materials
          </p>
        </div>
        <Link href="/warehouse/add-product">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Package className="h-4 w-4 mr-1" />
            {filteredItems.length} items found
          </div>
        </div>
      </Card>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.supplier}</p>
                </div>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex space-x-2">
                <Badge className={`${getCategoryColor(item.category)} border`}>
                  {item.category}
                </Badge>
                <Badge className={`${getStatusColor(item.status)} border`}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Purpose */}
              <div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  <span className="font-medium">Purpose:</span> {item.dentalPurpose}
                </p>
              </div>

              {/* Stock Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">
                    {item.quantity} 
                    {item.quantity <= item.minQuantity && (
                      <AlertTriangle className="inline h-4 w-4 text-red-500 ml-1" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Min. Stock</p>
                  <p className="font-semibold text-gray-900">{item.minQuantity}</p>
                </div>
              </div>

              {/* Price & Value */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Unit Price</p>
                  <p className="font-semibold text-green-600">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Value</p>
                  <p className="font-semibold text-green-600">{formatCurrency(item.totalValue)}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Mfg. Date
                  </p>
                  <p className="font-medium text-gray-900">{formatDate(item.manufacturingDate)}</p>
                </div>
                {item.expiryDate && (
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Exp. Date
                    </p>
                    <p className={`font-medium ${
                      item.status === 'expired' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDate(item.expiryDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Batch Number */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Batch: <span className="font-mono">{item.batchNumber}</span>
                </p>
              </div>

              {/* Storage Conditions */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Storage:</span> {item.storageConditions}
                </p>
              </div>

              {/* Warranty Info */}
              {item.warranty && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600">
                    <span className="font-medium">Warranty:</span> {item.warranty}
                    {item.warrantyPeriod && ` (${item.warrantyPeriod} months)`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or add new products to inventory.
          </p>
          <Link href="/warehouse/add-product">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
