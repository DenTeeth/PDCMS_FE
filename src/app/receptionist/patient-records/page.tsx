'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faEye,
  faEdit,
  faPlus,
  faUser,
  faPhone,
  faEnvelope,
  faCalendar,
  faFileMedical
} from '@fortawesome/free-solid-svg-icons';
import { patients } from '@/data/receptionist-data';

export default function PatientRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Records</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view patient information
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          <span>Add Patient</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search patients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient List ({filteredPatients.length})</CardTitle>
              <CardDescription>
                All patients in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPatient(patient)}
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

        {/* Patient Details */}
        <div className="lg:col-span-1">
          {selectedPatient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                  <span>Patient Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {getGenderIcon(selectedPatient.gender)}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{selectedPatient.name}</h3>
                  <p className="text-muted-foreground">{selectedPatient.email}</p>
                  {getStatusBadge(selectedPatient.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedPatient.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">DOB: {selectedPatient.dateOfBirth}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faFileMedical} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedPatient.totalVisits} total visits</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Address</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.address}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Emergency Contact</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.emergencyContact}</p>
                  </div>
                  {selectedPatient.insuranceProvider && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Insurance</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.insuranceProvider} - {selectedPatient.insuranceNumber}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Medical History</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.medicalHistory}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Allergies</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.allergies}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Current Medications</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.currentMedications}</p>
                  </div>
                </div>

                {selectedPatient.notes && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button className="flex-1">
                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FontAwesomeIcon icon={faFileMedical} className="h-4 w-4 mr-2" />
                    Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon={faUser} className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Patient</h3>
                <p className="text-muted-foreground">
                  Click on a patient from the list to view their details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
