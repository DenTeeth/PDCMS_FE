'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/radix-select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';

interface FiltersState {
    isActive: boolean | undefined;
    sortBy: 'patientCode' | 'firstName' | 'lastName' | 'createdAt';
    sortDirection: 'ASC' | 'DESC';
}

interface PatientFiltersProps {
    filters: FiltersState;
    onChange: (filters: FiltersState) => void;
}

export default function PatientFilters({ filters, onChange }: PatientFiltersProps) {
    const handleReset = () => {
        onChange({
            isActive: undefined,
            sortBy: 'patientCode',
            sortDirection: 'ASC',
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
                        onValueChange={(value) =>
                            onChange({
                                ...filters,
                                isActive: value === 'all' ? undefined : value === 'active',
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Patients</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                        value={filters.sortBy}
                        onValueChange={(value: any) =>
                            onChange({ ...filters, sortBy: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="patientCode">Patient Code</SelectItem>
                            <SelectItem value="firstName">First Name</SelectItem>
                            <SelectItem value="lastName">Last Name</SelectItem>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort Direction */}
                <div className="space-y-2">
                    <Label>Order</Label>
                    <Select
                        value={filters.sortDirection}
                        onValueChange={(value: any) =>
                            onChange({ ...filters, sortDirection: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ASC">Ascending</SelectItem>
                            <SelectItem value="DESC">Descending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset Button */}
                <div className="space-y-2">
                    <Label className="invisible">Reset</Label>
                    <Button variant="outline" onClick={handleReset} className="w-full">
                        <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
                        Reset Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}
