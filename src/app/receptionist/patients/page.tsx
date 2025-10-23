'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faSearch,
    faFilter,
    faUsers,
    faUserCheck,
    faUserTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { patientService } from '@/services/patientService';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';
import PatientTable from './components/PatientTable';
import PatientFilters from './components/PatientFilters';
import CreatePatientModal from './components/CreatePatientModal';

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(12);

    // Filters
    const [filters, setFilters] = useState({
        isActive: undefined as boolean | undefined,
        sortBy: 'patientCode' as 'patientCode' | 'firstName' | 'lastName' | 'createdAt',
        sortDirection: 'ASC' as 'ASC' | 'DESC',
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
    });

    useEffect(() => {
        loadPatients();
    }, [currentPage, pageSize, filters, searchQuery]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const response = await patientService.getPatients({
                page: currentPage,
                size: pageSize,
                search: searchQuery || undefined,
                ...filters,
            });

            setPatients(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);

            // Calculate stats
            const total = response.totalElements || 0;
            const active = response.content?.filter(p => p.isActive).length || 0;
            setStats({
                total,
                active,
                inactive: total - active,
            });
        } catch (error: any) {
            console.error('Failed to load patients:', error);
            setPatients([]);

            if (error.response?.status !== 500) {
                toast.error('Failed to load patients', {
                    description: error.message || 'Please try again later',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0); // Reset to first page
    };

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setCurrentPage(0); // Reset to first page
    };

    const handlePatientCreated = () => {
        setShowCreateModal(false);
        loadPatients(); // Reload list
        toast.success('Patient created successfully!');
    };

    const handleViewDetails = (patient: Patient) => {
        router.push(`/receptionist/patients/${patient.patientCode}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Patient Records</h1>
                    <p className="text-gray-600 mt-1">
                        Manage patient information and records
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Add New Patient
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Patients</p>
                                <p className="text-3xl font-bold">{stats.total}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-2xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Patients</p>
                                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faUserCheck} className="text-green-600 text-2xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Inactive Patients</p>
                                <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faUserTimes} className="text-gray-600 text-2xl" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <Input
                                    placeholder="Search patients by name, code, email, phone..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FontAwesomeIcon icon={faFilter} className="mr-2" />
                            Filters
                        </Button>
                    </div>
                </CardHeader>

                {showFilters && (
                    <CardContent className="border-t">
                        <PatientFilters
                            filters={filters}
                            onChange={handleFilterChange}
                        />
                    </CardContent>
                )}
            </Card>

            {/* Patient Table */}
            <Card>
                <CardContent className="p-6">
                    <PatientTable
                        patients={patients}
                        loading={loading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(0);
                        }}
                        onViewDetails={handleViewDetails}
                        onRefresh={loadPatients}
                    />
                </CardContent>
            </Card>

            {/* Create Patient Modal */}
            <CreatePatientModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={handlePatientCreated}
            />
        </div>
    );
}
