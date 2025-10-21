'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch,
  faClock,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { workShiftService } from '@/services/workShiftService';
import { WorkShift } from '@/types/workShift';

export default function WorkShiftsPage() {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadWorkShifts();
  }, [filterActive]);

  const loadWorkShifts = async () => {
    try {
      setLoading(true);
      const data = await workShiftService.getAll(filterActive);
      setWorkShifts(data);
    } catch (error) {
      console.error('Error loading work shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work shift?')) return;
    
    try {
      await workShiftService.delete(id);
      await loadWorkShifts();
    } catch (error) {
      console.error('Error deleting work shift:', error);
      alert('Failed to delete work shift');
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:mm
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredShifts = workShifts.filter(shift =>
    shift.shiftName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
          Work Shifts Management
        </h1>
        <p className="text-primary-foreground/80">
          Manage employee work schedules and shifts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workShifts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workShifts.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Shifts</CardTitle>
            <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workShifts.filter(s => !s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Shifts</CardTitle>
            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workShifts.filter(s => s.category === 'NORMAL').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Work Shifts</CardTitle>
              <CardDescription>View and manage employee work schedules</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === undefined ? "default" : "outline"}
                onClick={() => setFilterActive(undefined)}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterActive === true ? "default" : "outline"}
                onClick={() => setFilterActive(true)}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                onClick={() => setFilterActive(false)}
                size="sm"
              >
                Inactive
              </Button>
              <Button className="ml-4">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Shift
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" 
              />
              <Input
                placeholder="Search by employee or shift name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading work shifts...</p>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-6xl text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No work shifts found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search' : 'Create your first work shift'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Shift Name</th>
                    <th className="text-left py-3 px-4 font-medium">Time</th>
                    <th className="text-left py-3 px-4 font-medium">Duration</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((shift) => (
                    <tr key={shift.workShiftId} className="border-b hover:bg-accent transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{shift.shiftName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-muted-foreground" />
                          <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{shift.durationHours} hours</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={shift.category === 'NIGHT' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                          {shift.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {shift.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            <FontAwesomeIcon icon={faTimesCircle} className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(shift.workShiftId)}
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
