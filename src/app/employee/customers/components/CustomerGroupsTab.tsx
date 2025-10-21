"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faSearch,
    faEdit,
    faEye,
    faPhone,
    faEnvelope,
    faCalendar,
    faDollarSign,
    faStar
} from '@fortawesome/free-solid-svg-icons';

// TODO: Replace with API calls
const patients: any[] = [];
const customerGroups: any[] = [];

export default function CustomerGroupsTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone.includes(searchTerm);
        const matchesGroup = filterGroup === 'all' || patient.customerGroupId === filterGroup;
        return matchesSearch && matchesGroup;
    });

    const getGroupStats = (groupId: string) => {
        const groupPatients = patients.filter(p => p.customerGroupId === groupId);
        const group = customerGroups.find(g => g.id === groupId);
        return {
            patientCount: groupPatients.length,
            totalRevenue: group?.totalRevenue || 0,
            averageValue: group?.averageVisitValue || 0,
            lastVisit: groupPatients.length > 0 ?
                Math.max(...groupPatients.map(p => new Date(p.lastVisit).getTime())) : null
        };
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'inactive':
                return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    const getGenderIcon = (gender: string) => {
        return gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👤';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold text-foreground">{patients.length}</p>
                            </div>
                            <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Customer Groups</p>
                                <p className="text-2xl font-bold text-foreground">{customerGroups.length}</p>
                            </div>
                            <FontAwesomeIcon icon={faDollarSign} className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(customerGroups.reduce((sum, group) => sum + group.totalRevenue, 0))}
                                </p>
                            </div>
                            <FontAwesomeIcon icon={faDollarSign} className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg. Customer Value</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(customerGroups.reduce((sum, group) => sum + group.averageVisitValue, 0) / customerGroups.length)}
                                </p>
                            </div>
                            <FontAwesomeIcon icon={faStar} className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Groups */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Groups</CardTitle>
                            <CardDescription>
                                Manage customer segments and KPIs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customerGroups.map((group) => {
                                const stats = getGroupStats(group.id);
                                return (
                                    <div
                                        key={group.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedGroup?.id === group.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:shadow-md'
                                            }`}
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-foreground">{group.name}</h3>
                                            <Badge variant="secondary">{stats.patientCount} customers</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Revenue:</span>
                                                <div className="font-semibold text-green-600">
                                                    {formatCurrency(stats.totalRevenue)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Avg. Value:</span>
                                                <div className="font-semibold text-blue-600">
                                                    {formatCurrency(stats.averageValue)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Customer List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Customer List</CardTitle>
                                    <CardDescription>
                                        {selectedGroup ? `Customers in ${selectedGroup.name}` : 'All customers'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder="Search customers..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 w-64"
                                        />
                                    </div>
                                    <select
                                        value={filterGroup}
                                        onChange={(e) => setFilterGroup(e.target.value)}
                                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    >
                                        <option value="all">All Groups</option>
                                        {customerGroups.map((group) => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredPatients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                                                    {getGenderIcon(patient.gender)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{patient.name}</h3>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center space-x-1">
                                                            <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3" />
                                                            <span>{patient.email}</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                                                            <span>{patient.phone}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            Last visit: {patient.lastVisit}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            • {patient.totalVisits} visits
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            • {customerGroups.find(g => g.id === patient.customerGroupId)?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getStatusBadge(patient.status)}
                                                <Button variant="outline" size="sm">
                                                    <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Group Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Group Performance</CardTitle>
                    <CardDescription>
                        Detailed performance metrics for each customer group
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Group Name</TableHead>
                                <TableHead>Customers</TableHead>
                                <TableHead>Total Revenue</TableHead>
                                <TableHead>Average Value</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead>Performance</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customerGroups.map((group) => {
                                const stats = getGroupStats(group.id);
                                const performance = stats.totalRevenue > 50000 ? 'Excellent' :
                                    stats.totalRevenue > 25000 ? 'Good' : 'Needs Improvement';
                                const performanceColor = performance === 'Excellent' ? 'text-green-600' :
                                    performance === 'Good' ? 'text-yellow-600' : 'text-red-600';

                                return (
                                    <TableRow key={group.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{group.name}</div>
                                                <div className="text-sm text-muted-foreground">{group.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-muted-foreground" />
                                                <span>{stats.patientCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-green-600" />
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(stats.totalRevenue)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-blue-600">
                                                {formatCurrency(stats.averageValue)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {stats.lastVisit ? (
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-muted-foreground" />
                                                    <span>{new Date(stats.lastVisit).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No activity</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${performanceColor} bg-opacity-20`}>
                                                {performance}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1">
                                                <Button variant="outline" size="sm">
                                                    <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
