'use client';

/**
 * Employee Patients Page
 * Requires: VIEW_PATIENT permission
 * 
 * TODO: Di chuyển logic từ src/app/dentist/patients/page.tsx vào đây
 */

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
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
import PatientTable from '@/app/receptionist/patients/components/PatientTable';
import PatientFilters from '@/app/receptionist/patients/components/PatientFilters';
import CreatePatientModal from '@/app/receptionist/patients/components/CreatePatientModal';

export default function EmployeePatientsPage() {
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
    setCurrentPage(0);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handlePatientCreated = () => {
    setShowCreateModal(false);
    loadPatients();
    toast.success('Patient created successfully!');
  };

  const handleViewDetails = (patient: Patient) => {
    router.push(`/employee/patients/${patient.patientCode}`);
  };

  return (
    <ProtectedRoute 
      requiredBaseRole="employee" 
      requiredPermissions={['VIEW_PATIENT']}
    >
      <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faUsers} className="mr-3" />
          Patient Management
        </h1>
        <p className="text-primary-foreground/80">
          View and manage patient records
        </p>
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
      </div>
    </ProtectedRoute>
  );
}
