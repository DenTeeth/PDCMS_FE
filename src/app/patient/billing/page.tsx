'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faDollarSign,
  faCalendarAlt,
  faReceipt,
  faDownload,
  faEye,
  faPlus,
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faTimes,
  faSearch,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

// Sample billing data
const bills = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 150.00,
    status: 'paid',
    description: 'General consultation and examination',
    doctor: 'Dr. Nguyen Van A',
    department: 'General Medicine',
    paymentMethod: 'Credit Card',
    paidDate: '2024-01-16'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    date: '2024-01-20',
    dueDate: '2024-02-20',
    amount: 75.50,
    status: 'pending',
    description: 'Dental cleaning and checkup',
    doctor: 'Dr. Le Thi B',
    department: 'Dentistry',
    paymentMethod: null,
    paidDate: null
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    date: '2024-01-25',
    dueDate: '2024-02-25',
    amount: 300.00,
    status: 'overdue',
    description: 'Blood tests and laboratory work',
    doctor: 'Dr. Tran Van C',
    department: 'Laboratory',
    paymentMethod: null,
    paidDate: null
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    date: '2024-01-10',
    dueDate: '2024-02-10',
    amount: 200.00,
    status: 'paid',
    description: 'X-ray examination',
    doctor: 'Dr. Pham Thi D',
    department: 'Radiology',
    paymentMethod: 'Insurance',
    paidDate: '2024-01-12'
  }
];

const paymentMethods = [
  {
    id: '1',
    type: 'Credit Card',
    lastFour: '**** 1234',
    expiryDate: '12/25',
    isDefault: true
  },
  {
    id: '2',
    type: 'Bank Account',
    lastFour: '**** 5678',
    expiryDate: null,
    isDefault: false
  }
];

const statusColors = {
  paid: 'default',
  pending: 'secondary',
  overdue: 'destructive',
  cancelled: 'outline'
};

export default function UserBilling() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-600" />;
      default:
        return <FontAwesomeIcon icon={faTimes} className="h-4 w-4 text-gray-600" />;
    }
  };

  const totalOutstanding = bills
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const totalPaid = bills
    .filter(bill => bill.status === 'paid')
    .reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground">Manage your medical bills and payments</p>
        </div>
        <Button onClick={() => setShowPaymentModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</p>
              </div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Methods</p>
                <p className="text-2xl font-bold">{paymentMethods.length}</p>
              </div>
              <FontAwesomeIcon icon={faCreditCard} className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm hóa đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('overdue')}
                size="sm"
              >
                Overdue
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                size="sm"
              >
                Paid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <Card key={bill.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(bill.status)}
                    <Badge variant={statusColors[bill.status]}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{bill.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">{bill.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">${bill.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {bill.dueDate}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                    </Button>
                    {bill.status !== 'paid' && (
                      <Button size="sm">
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p>{bill.doctor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p>{bill.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{bill.date}</p>
                  </div>
                </div>
                
                {bill.paidDate && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Paid on {bill.paidDate} via {bill.paymentMethod}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FontAwesomeIcon icon={faReceipt} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy hóa đơn</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You don\'t have any bills yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thanh toán</CardTitle>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input placeholder="$0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <select className="w-full p-2 border rounded-md">
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.type} {method.lastFour}
                      </option>
                    ))}
                  </select>
                </div>
                <Button className="w-full">
                  Process Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

