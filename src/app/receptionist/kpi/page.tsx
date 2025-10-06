'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartLine,
  Users,
  DollarSign,
  Calendar,
  Star,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { customerGroups, patients, appointments } from '@/data/receptionist-data';

export default function KPIDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedGroup, setSelectedGroup] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getKPIStats = () => {
    const totalRevenue = customerGroups.reduce((sum, group) => sum + group.totalRevenue, 0);
    const totalCustomers = patients.length;
    const totalAppointments = appointments.length;
    const averageCustomerValue = totalRevenue / totalCustomers || 0;
    const conversionRate = (appointments.filter(apt => apt.status === 'completed').length / appointments.length) * 100;
    
    return {
      totalRevenue,
      totalCustomers,
      totalAppointments,
      averageCustomerValue,
      conversionRate
    };
  };

  const getGroupPerformance = () => {
    return customerGroups.map(group => {
      const groupPatients = patients.filter(p => p.customerGroupId === group.id);
      const groupAppointments = appointments.filter(apt => 
        groupPatients.some(p => p.id === apt.patientId)
      );
      const completedAppointments = groupAppointments.filter(apt => apt.status === 'completed');
      
      return {
        ...group,
        patientCount: groupPatients.length,
        appointmentCount: groupAppointments.length,
        completedAppointments: completedAppointments.length,
        completionRate: (completedAppointments.length / groupAppointments.length) * 100 || 0,
        revenuePerCustomer: group.totalRevenue / groupPatients.length || 0
      };
    });
  };


  const kpiStats = getKPIStats();
  const groupPerformance = getGroupPerformance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track performance metrics and customer analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Period and Group Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Groups</option>
                {customerGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(kpiStats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold text-foreground">{kpiStats.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Customer Value</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(kpiStats.averageCustomerValue)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-foreground">{kpiStats.conversionRate.toFixed(1)}%</p>
              </div>
              <ChartLine className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Group Performance Analysis</CardTitle>
          <CardDescription>
            Detailed performance metrics for each customer group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupPerformance.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="secondary">{group.patientCount} customers</Badge>
                  </div>
                  <CardDescription className="text-sm">{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(group.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Value</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(group.averageVisitValue)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Appointments</span>
                      <span className="font-medium">{group.appointmentCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{group.completedAppointments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium text-green-600">
                        {group.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue/Customer</span>
                      <span className="font-medium text-purple-600">
                        {formatCurrency(group.revenuePerCustomer)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Performance</span>
                      <Badge className={
                        group.totalRevenue > 50000 ? 'bg-green-100 text-green-800' :
                        group.totalRevenue > 25000 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {group.totalRevenue > 50000 ? 'Excellent' :
                         group.totalRevenue > 25000 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Insights</CardTitle>
          <CardDescription>
            Customer behavior and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">New Customers This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  +{Math.floor(kpiStats.totalCustomers * 0.1)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Repeat Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.floor(kpiStats.totalCustomers * 0.7)} ({70}%)
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900">Avg. Visits per Customer</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(kpiStats.totalAppointments / kpiStats.totalCustomers).toFixed(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-900">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-yellow-600">4.8/5.0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
