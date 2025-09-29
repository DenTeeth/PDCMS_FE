'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Star,
  Calendar,
  Award,
  Package,
  Receipt,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { doctorPerformance, services } from '@/data/accountant-data';
import { inventoryItems } from '@/data/warehouse-data';

export default function DoctorPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedDoctor, setSelectedDoctor] = useState('all');

  const periods = [
    { value: 'current', label: 'Current Month (2024-01)' },
    { value: 'previous', label: 'Previous Month (2023-12)' },
    { value: 'comparison', label: 'Month Comparison' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPerformanceData = () => {
    if (selectedPeriod === 'current') {
      return doctorPerformance.filter(p => p.period === '2024-01');
    } else if (selectedPeriod === 'previous') {
      return doctorPerformance.filter(p => p.period === '2023-12');
    } else {
      return doctorPerformance;
    }
  };

  const getCurrentMonthData = doctorPerformance.find(p => p.period === '2024-01');
  const getPreviousMonthData = doctorPerformance.find(p => p.period === '2023-12');

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-3 w-3" />;
    if (current < previous) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const getSupplyCostForService = (serviceId: string, quantity: number = 1) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 0;
    
    let totalCost = 0;
    service.requiredSupplies.forEach(supplyId => {
      const supply = inventoryItems.find(item => item.id === supplyId);
      if (supply) {
        totalCost += supply.unitPrice * quantity;
      }
    });
    return totalCost;
  };

  const performanceData = getPerformanceData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Performance Analysis</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive performance tracking including revenue, expenses, and efficiency metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Performance Summary Cards */}
      {getCurrentMonthData && getPreviousMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Cases</h3>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{getCurrentMonthData.totalCases}</p>
              <div className={`flex items-center text-sm ${getChangeColor(getCurrentMonthData.totalCases, getPreviousMonthData.totalCases)}`}>
                {getChangeIcon(getCurrentMonthData.totalCases, getPreviousMonthData.totalCases)}
                <span>{Math.abs(getCurrentMonthData.totalCases - getPreviousMonthData.totalCases)} vs last month</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getCurrentMonthData.totalRevenue)}</p>
              <div className={`flex items-center text-sm ${getChangeColor(getCurrentMonthData.totalRevenue, getPreviousMonthData.totalRevenue)}`}>
                {getChangeIcon(getCurrentMonthData.totalRevenue, getPreviousMonthData.totalRevenue)}
                <span>{((getCurrentMonthData.totalRevenue - getPreviousMonthData.totalRevenue) / getPreviousMonthData.totalRevenue * 100).toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Supply Expenses</h3>
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getCurrentMonthData.totalExpenses)}</p>
              <div className={`flex items-center text-sm ${getChangeColor(getPreviousMonthData.totalExpenses, getCurrentMonthData.totalExpenses)}`}>
                {getChangeIcon(getPreviousMonthData.totalExpenses, getCurrentMonthData.totalExpenses)}
                <span>{((getCurrentMonthData.totalExpenses - getPreviousMonthData.totalExpenses) / getPreviousMonthData.totalExpenses * 100).toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getCurrentMonthData.netProfit)}</p>
              <div className={`flex items-center text-sm ${getChangeColor(getCurrentMonthData.netProfit, getPreviousMonthData.netProfit)}`}>
                {getChangeIcon(getCurrentMonthData.netProfit, getPreviousMonthData.netProfit)}
                <span>{((getCurrentMonthData.netProfit - getPreviousMonthData.netProfit) / getPreviousMonthData.netProfit * 100).toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Doctor Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {performanceData.map((doctor) => (
          <Card key={`${doctor.doctorId}-${doctor.period}`} className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{doctor.doctorName}</h3>
                  <p className="text-sm text-gray-600">{doctor.period}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {doctor.efficiency}% efficiency
              </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{doctor.totalCases}</p>
                <p className="text-xs text-gray-600">Total Cases</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{formatCurrency(doctor.totalRevenue)}</p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{formatCurrency(doctor.totalExpenses)}</p>
                <p className="text-xs text-gray-600">Supply Costs</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{formatCurrency(doctor.netProfit)}</p>
                <p className="text-xs text-gray-600">Net Profit</p>
              </div>
            </div>

            {/* Patient Satisfaction */}
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Patient Satisfaction</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-bold text-yellow-600">{doctor.patientSatisfaction}/5.0</span>
                </div>
              </div>
              <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(doctor.patientSatisfaction / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Services Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Services Performed</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {doctor.servicesPerformed.map((service) => (
                  <div key={service.serviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.serviceName}</p>
                      <p className="text-xs text-gray-600">{service.count} cases</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(service.revenue)}</p>
                      <p className="text-xs text-red-600">-{formatCurrency(service.supplyCost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Service Analysis */}
      {getCurrentMonthData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Service Performance Analysis</h2>
            <Receipt className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Service</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Cases</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Supply Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Net Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Margin</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentMonthData.servicesPerformed.map((service) => {
                  const netProfit = service.revenue - service.supplyCost;
                  const margin = (netProfit / service.revenue) * 100;
                  const serviceInfo = services.find(s => s.id === service.serviceId);
                  
                  return (
                    <tr key={service.serviceId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{service.serviceName}</p>
                          <p className="text-xs text-gray-500">{serviceInfo?.category}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {service.count}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-600">
                        {formatCurrency(service.revenue)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-red-600">
                        {formatCurrency(service.supplyCost)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-purple-600">
                        {formatCurrency(netProfit)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            margin >= 70 ? 'bg-green-50 text-green-700 border-green-200' :
                            margin >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {margin.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center">
                          {margin >= 70 ? (
                            <Award className="h-4 w-4 text-green-600" />
                          ) : margin >= 50 ? (
                            <TrendingUp className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Supply Cost Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Supply Cost Analysis</h2>
          <Package className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const performanceService = getCurrentMonthData?.servicesPerformed.find(p => p.serviceId === service.id);
            const totalSupplyCost = getSupplyCostForService(service.id);
            
            return (
              <div key={service.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">{service.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">{formatCurrency(service.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supply Cost:</span>
                    <span className="font-medium text-red-600">{formatCurrency(totalSupplyCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net per Service:</span>
                    <span className="font-medium text-green-600">{formatCurrency(service.basePrice - totalSupplyCost)}</span>
                  </div>
                  {performanceService && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cases this month:</span>
                        <span className="font-medium">{performanceService.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total profit:</span>
                        <span className="font-medium text-purple-600">
                          {formatCurrency(performanceService.revenue - performanceService.supplyCost)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
