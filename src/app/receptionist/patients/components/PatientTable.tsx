'use client';

import { Patient } from '@/types/patient';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/radix-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faChevronLeft,
    faChevronRight,
    faSpinner,
    faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PatientTableProps {
    patients: Patient[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onViewDetails: (patient: Patient) => void;
    onRefresh: () => void;
}

export default function PatientTable({
    patients,
    loading,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onViewDetails,
    onRefresh,
}: PatientTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-400 animate-spin" />
            </div>
        );
    }

    if (patients.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No patients found</p>
                <Button variant="outline" onClick={onRefresh} className="mt-4">
                    <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient Code</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Date of Birth</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {patients.map((patient) => (
                            <TableRow key={patient.patientId}>
                                <TableCell className="font-medium">{patient.patientCode}</TableCell>
                                <TableCell>{patient.fullName}</TableCell>
                                <TableCell>{patient.email || '-'}</TableCell>
                                <TableCell>{patient.phone || '-'}</TableCell>
                                <TableCell>
                                    {patient.gender ? (
                                        <Badge variant="outline">
                                            {patient.gender}
                                        </Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {patient.dateOfBirth
                                        ? format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                                        {patient.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={patient.hasAccount ? 'default' : 'outline'}>
                                        {patient.hasAccount ? 'Yes' : 'No'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onViewDetails(patient)}
                                    >
                                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                        Page {currentPage + 1} of {totalPages} ({totalElements} total)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
