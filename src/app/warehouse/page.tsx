'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Clock,
  Users,
  BarChart3
} from 'lucide-react';
import { inventoryStats, inventoryItems, inventoryTransactions } from '@/data/warehouse-data';

export default function WarehouseDashboard() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of inventory status and recent activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{inventoryStats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired Items</p>
              <p className="text-2xl font-bold text-orange-600">{inventoryStats.expiredItems}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Clock className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {inventoryTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.itemName}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.type === 'usage' ? 'Used' : 'Imported'} {transaction.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
                <Badge 
                  variant={transaction.type === 'usage' ? 'destructive' : 'default'}
                  className="ml-3"
                >
                  {transaction.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Used Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Most Used Items</h2>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {inventoryStats.topUsedItems.map((item, index) => (
              <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-600">{item.usageCount} times used</p>
                  </div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(item.usageCount / inventoryStats.topUsedItems[0].usageCount) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Overview</h2>
          <TrendingUp className="h-5 w-5 text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inventoryStats.monthlyUsage.slice(0, 3).map((month) => (
            <div key={month.month} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h3 className="font-medium text-gray-900 mb-2">{month.month}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Used:</span>
                  <span className="text-sm font-medium text-red-600">{month.totalUsed} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Imported:</span>
                  <span className="text-sm font-medium text-green-600">{month.totalImported} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="text-sm font-medium text-blue-600">{formatCurrency(month.totalValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Items */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-amber-800">Action Required</h2>
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-amber-100">
            <h3 className="font-medium text-gray-900 mb-2">Low Stock Alert</h3>
            <p className="text-sm text-gray-600 mb-2">
              {inventoryStats.lowStockItems} items are running low on stock
            </p>
            <div className="space-y-1">
              {inventoryItems.filter(item => item.status === 'low_stock').map((item) => (
                <p key={item.id} className="text-xs text-red-600">• {item.name} ({item.quantity} left)</p>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-amber-100">
            <h3 className="font-medium text-gray-900 mb-2">Expired Items</h3>
            <p className="text-sm text-gray-600 mb-2">
              {inventoryStats.expiredItems} items have expired
            </p>
            <div className="space-y-1">
              {inventoryItems.filter(item => item.status === 'expired').map((item) => (
                <p key={item.id} className="text-xs text-orange-600">• {item.name} (Exp: {item.expiryDate})</p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
