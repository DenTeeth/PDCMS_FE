'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Receipt,
  CreditCard,
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { financialSummary, patientBills, expenseRecords } from '@/data/accountant-data';

export default function AccountantDashboard() {
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

  const getChangeColor = (value: number, previousValue: number) => {
    if (value > previousValue) return 'text-green-600';
    if (value < previousValue) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number, previousValue: number) => {
    if (value > previousValue) return <ArrowUpRight className="h-3 w-3" />;
    if (value < previousValue) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const currentMonth = financialSummary.monthlyTrends[0];
  const previousMonth = financialSummary.monthlyTrends[1];

  const pendingBills = patientBills.filter(bill => bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial');
  const recentExpenses = expenseRecords.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive financial overview and analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            This Month
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonth.revenue)}</p>
            <div className={`flex items-center text-sm ${getChangeColor(currentMonth.revenue, previousMonth.revenue)}`}>
              {getChangeIcon(currentMonth.revenue, previousMonth.revenue)}
              <span>{((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
            <Receipt className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonth.expenses)}</p>
            <div className={`flex items-center text-sm ${getChangeColor(previousMonth.expenses, currentMonth.expenses)}`}>
              {getChangeIcon(previousMonth.expenses, currentMonth.expenses)}
              <span>{((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMonth.profit)}</p>
            <div className={`flex items-center text-sm ${getChangeColor(currentMonth.profit, previousMonth.profit)}`}>
              {getChangeIcon(currentMonth.profit, previousMonth.profit)}
              <span>{((currentMonth.profit - previousMonth.profit) / previousMonth.profit * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Profit Margin</h3>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{financialSummary.profitMargin.toFixed(1)}%</p>
            <Badge variant="outline" className="text-xs">
              Healthy
            </Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Revenue by Service Category</h2>
            <TrendingUp className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {financialSummary.revenueBreakdown.map((category) => (
              <div key={category.serviceCategory} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{category.serviceCategory}</h3>
                  <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}% of total revenue</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-bold text-green-600">{formatCurrency(category.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Doctors */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Performing Doctors</h2>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {financialSummary.topPerformingDoctors.map((doctor, index) => (
              <div key={doctor.doctorId} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-sm mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{doctor.doctorName}</h3>
                  <p className="text-sm text-gray-600">{doctor.cases} cases completed</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(doctor.revenue)}</p>
                  <p className="text-xs text-gray-500">{(doctor.revenue / financialSummary.totalRevenue * 100).toFixed(1)}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trend */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Cash Flow</h2>
            <DollarSign className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {financialSummary.cashFlow.map((flow) => (
              <div key={flow.date} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(flow.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Inflow</p>
                  <p className="font-medium text-green-600">{formatCurrency(flow.inflow)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Outflow</p>
                  <p className="font-medium text-red-600">{formatCurrency(flow.outflow)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net Flow</p>
                  <p className={`font-medium ${flow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(flow.netFlow)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Outstanding Payments Alert */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-800">Payment Alerts</h2>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-amber-100">
              <h3 className="font-medium text-gray-900 mb-2">Outstanding Payments</h3>
              <p className="text-2xl font-bold text-amber-600 mb-2">
                {formatCurrency(financialSummary.outstandingPayments)}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                {pendingBills.length} bills pending payment
              </p>
              <div className="space-y-2">
                {pendingBills.slice(0, 3).map((bill) => (
                  <div key={bill.id} className="flex justify-between text-xs">
                    <span className="text-gray-600">{bill.patientName}</span>
                    <span className="font-medium text-red-600">{formatCurrency(bill.remainingBalance)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-amber-100">
              <h3 className="font-medium text-gray-900 mb-2">Recent Expenses</h3>
              <div className="space-y-2">
                {recentExpenses.slice(0, 4).map((expense) => (
                  <div key={expense.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{expense.description}</span>
                    <span className="font-medium text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">6-Month Financial Trends</h2>
          <TrendingUp className="h-5 w-5 text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {financialSummary.monthlyTrends.map((month) => (
            <div key={month.month} className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
              <h3 className="font-medium text-gray-900 mb-3 text-center">
                {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Revenue</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(month.revenue)}</p>
                  <div className="w-full bg-green-100 rounded-full h-1 mt-1">
                    <div 
                      className="bg-green-600 h-1 rounded-full" 
                      style={{ 
                        width: `${(month.revenue / Math.max(...financialSummary.monthlyTrends.map(m => m.revenue))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600">Expenses</p>
                  <p className="text-sm font-semibold text-red-600">{formatCurrency(month.expenses)}</p>
                  <div className="w-full bg-red-100 rounded-full h-1 mt-1">
                    <div 
                      className="bg-red-600 h-1 rounded-full" 
                      style={{ 
                        width: `${(month.expenses / Math.max(...financialSummary.monthlyTrends.map(m => m.expenses))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600">Profit</p>
                  <p className="text-sm font-semibold text-purple-600">{formatCurrency(month.profit)}</p>
                  <div className="w-full bg-purple-100 rounded-full h-1 mt-1">
                    <div 
                      className="bg-purple-600 h-1 rounded-full" 
                      style={{ 
                        width: `${(month.profit / Math.max(...financialSummary.monthlyTrends.map(m => m.profit))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
