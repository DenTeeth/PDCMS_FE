'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { inventoryStats, inventoryTransactions } from '@/data/warehouse-data';

export default function InventoryStatisticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  const periods = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

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
    });
  };

  const getCurrentMonthStats = () => {
    const currentMonth = inventoryStats.monthlyUsage[0];
    const previousMonth = inventoryStats.monthlyUsage[1];
    
    const usageChange = currentMonth.totalUsed - previousMonth.totalUsed;
    const importChange = currentMonth.totalImported - previousMonth.totalImported;
    const valueChange = currentMonth.totalValue - previousMonth.totalValue;

    return {
      usage: { value: currentMonth.totalUsed, change: usageChange },
      import: { value: currentMonth.totalImported, change: importChange },
      value: { value: currentMonth.totalValue, change: valueChange },
    };
  };

  const currentStats = getCurrentMonthStats();

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3" />;
    if (change < 0) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const usageTransactions = inventoryTransactions.filter(t => t.type === 'usage');
  const importTransactions = inventoryTransactions.filter(t => t.type === 'import');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Statistics</h1>
          <p className="text-gray-600 mt-2">
            Detailed analytics of inventory usage and imports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Current Month Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Items Used This Month</h3>
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{currentStats.usage.value}</p>
            <div className={`flex items-center text-sm ${getChangeColor(currentStats.usage.change)}`}>
              {getChangeIcon(currentStats.usage.change)}
              <span>{Math.abs(currentStats.usage.change)} vs last month</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Items Imported This Month</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{currentStats.import.value}</p>
            <div className={`flex items-center text-sm ${getChangeColor(currentStats.import.change)}`}>
              {getChangeIcon(currentStats.import.change)}
              <span>{Math.abs(currentStats.import.change)} vs last month</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Transaction Value</h3>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentStats.value.value)}</p>
            <div className={`flex items-center text-sm ${getChangeColor(currentStats.value.change)}`}>
              {getChangeIcon(currentStats.value.change)}
              <span>{formatCurrency(Math.abs(currentStats.value.change))}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Monthly Trends</h2>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {inventoryStats.monthlyUsage.map((month, index) => (
              <div key={month.month} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">{formatDate(month.month + '-01')}</h3>
                  <Badge variant="outline" className="text-xs">
                    {index === 0 ? 'Current' : `${index} month${index > 1 ? 's' : ''} ago`}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Used</p>
                    <p className="font-semibold text-red-600">{month.totalUsed} items</p>
                    <div className="w-full bg-red-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(month.totalUsed / Math.max(...inventoryStats.monthlyUsage.map(m => m.totalUsed))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Imported</p>
                    <p className="font-semibold text-green-600">{month.totalImported} items</p>
                    <div className="w-full bg-green-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(month.totalImported / Math.max(...inventoryStats.monthlyUsage.map(m => m.totalImported))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Value</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(month.totalValue)}</p>
                    <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(month.totalValue / Math.max(...inventoryStats.monthlyUsage.map(m => m.totalValue))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Net Change: {month.totalImported - month.totalUsed} items</span>
                    <span className={month.totalImported >= month.totalUsed ? 'text-green-600' : 'text-red-600'}>
                      {month.totalImported >= month.totalUsed ? '↗ Positive' : '↘ Negative'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Used Items Analysis */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Most Used Items</h2>
            <TrendingDown className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {inventoryStats.topUsedItems.map((item, index) => (
              <div key={item.itemId} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-sm mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.itemName}</h3>
                  <p className="text-sm text-gray-600">{item.usageCount} times used</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage Frequency</span>
                      <span>{((item.usageCount / inventoryStats.topUsedItems[0].usageCount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${(item.usageCount / inventoryStats.topUsedItems[0].usageCount) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`ml-3 ${
                    index < 2 ? 'border-red-200 text-red-700 bg-red-50' : 
                    index < 4 ? 'border-yellow-200 text-yellow-700 bg-yellow-50' : 
                    'border-green-200 text-green-700 bg-green-50'
                  }`}
                >
                  {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Normal'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transaction Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Usage</h2>
            <Badge variant="destructive">-{usageTransactions.length} transactions</Badge>
          </div>
          <div className="space-y-3">
            {usageTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.itemName}</p>
                  <p className="text-sm text-gray-600">Used by {transaction.performedBy}</p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">-{transaction.quantity}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.previousQuantity} → {transaction.newQuantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Import Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Imports</h2>
            <Badge variant="default" className="bg-green-100 text-green-800">
              +{importTransactions.length} transactions
            </Badge>
          </div>
          <div className="space-y-3">
            {importTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.itemName}</p>
                  <p className="text-sm text-gray-600">Added by {transaction.performedBy}</p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{transaction.quantity}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.previousQuantity} → {transaction.newQuantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="mb-2">
            <Package className="h-8 w-8 text-blue-600 mx-auto" />
          </div>
          <h3 className="font-semibold text-blue-900">Total Inventory Value</h3>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(inventoryStats.totalValue)}</p>
        </Card>

        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="mb-2">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
          </div>
          <h3 className="font-semibold text-green-900">Active Items</h3>
          <p className="text-2xl font-bold text-green-700">{inventoryStats.totalItems}</p>
        </Card>

        <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
          <div className="mb-2">
            <Calendar className="h-8 w-8 text-yellow-600 mx-auto" />
          </div>
          <h3 className="font-semibold text-yellow-900">Expiring Soon</h3>
          <p className="text-2xl font-bold text-yellow-700">{inventoryStats.expiringItems}</p>
        </Card>

        <Card className="p-6 text-center bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className="mb-2">
            <TrendingDown className="h-8 w-8 text-red-600 mx-auto" />
          </div>
          <h3 className="font-semibold text-red-900">Low Stock</h3>
          <p className="text-2xl font-bold text-red-700">{inventoryStats.lowStockItems}</p>
        </Card>
      </div>
    </div>
  );
}
