'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  Plus,
  Eye,
  Edit,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Heart,
  Activity,
  FileText,
  Camera,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { patients, treatments, dentistAppointments } from '@/data/dentist-data';
import Link from 'next/link';

export default function PatientRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'treatments' | 'appointments'>('overview');

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatientData = patients.find(p => p.id === selectedPatient);
  const patientTreatments = treatments.filter(t => t.patientId === selectedPatient);
  const patientAppointments = dentistAppointments.filter(a => a.patientId === selectedPatient);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOralHygieneColor = (hygiene: string) => {
    switch (hygiene) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive patient management and medical records
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Records
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
            <Badge variant="outline" className="text-xs">
              {filteredPatients.length} patients
            </Badge>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Patient List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedPatient === patient.id
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPatient(patient.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                  <Badge className={`${getStatusColor(patient.status)} border text-xs`}>
                    {patient.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center">
                    <User className="h-3 w-3 mr-2" />
                    Age {calculateAge(patient.dateOfBirth)}
                  </p>
                  <p className="flex items-center">
                    <Phone className="h-3 w-3 mr-2" />
                    {patient.phone}
                  </p>
                  {patient.lastVisit && (
                    <p className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      Last visit: {formatDate(patient.lastVisit)}
                    </p>
                  )}
                </div>

                {/* Quick indicators */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    {patient.medicalHistory.allergies.length > 0 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" title="Has allergies" />
                    )}
                    {patient.medicalHistory.conditions.length > 0 && (
                      <Heart className="h-4 w-4 text-orange-500" title="Medical conditions" />
                    )}
                    {patient.insuranceInfo && (
                      <Shield className="h-4 w-4 text-blue-500" title="Has insurance" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {patientTreatments.filter(t => t.patientId === patient.id).length} treatments
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {selectedPatientData ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">
                        {selectedPatientData.firstName[0]}{selectedPatientData.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPatientData.fullName}</h2>
                      <p className="text-gray-600">
                        {selectedPatientData.gender} • Age {calculateAge(selectedPatientData.dateOfBirth)} • 
                        Patient ID: {selectedPatientData.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedPatientData.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedPatientData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedPatientData.address.split(',')[0]}</span>
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'overview', label: 'Overview', icon: Eye },
                    { key: 'history', label: 'Medical History', icon: FileText },
                    { key: 'treatments', label: 'Treatments', icon: Activity },
                    { key: 'appointments', label: 'Appointments', icon: Calendar },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.key
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedPatientData.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedPatientData.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <Badge className={`${getStatusColor(selectedPatientData.status)} border text-xs mt-1`}>
                          {selectedPatientData.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Emergency Contact */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relationship</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </Card>


                  {/* Dental History */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dental History</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Previous Dentist</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.dentalHistory.previousDentist}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Cleaning Frequency</label>
                        <p className="text-sm text-gray-900">{selectedPatientData.dentalHistory.cleaningFrequency}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Oral Hygiene</label>
                        <p className={`text-sm font-medium ${getOralHygieneColor(selectedPatientData.dentalHistory.oralHygiene)}`}>
                          {selectedPatientData.dentalHistory.oralHygiene}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Habits</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPatientData.dentalHistory.habits.map((habit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {habit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Allergies */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      Allergies
                    </h3>
                    {selectedPatientData.medicalHistory.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPatientData.medicalHistory.allergies.map((allergy, index) => (
                          <Badge key={index} className="bg-red-100 text-red-800 border-red-200">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No known allergies</p>
                    )}
                  </Card>

                  {/* Current Medications */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Medications</h3>
                    {selectedPatientData.medicalHistory.medications.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatientData.medicalHistory.medications.map((medication, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm font-medium text-gray-900">{medication}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No current medications</p>
                    )}
                  </Card>

                  {/* Medical Conditions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Conditions</h3>
                    {selectedPatientData.medicalHistory.conditions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatientData.medicalHistory.conditions.map((condition, index) => (
                          <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-sm font-medium text-gray-900">{condition}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No known medical conditions</p>
                    )}
                  </Card>

                  {/* Previous Surgeries */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Surgeries</h3>
                    {selectedPatientData.medicalHistory.previousSurgeries.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatientData.medicalHistory.previousSurgeries.map((surgery, index) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-sm font-medium text-gray-900">{surgery}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No previous surgeries</p>
                    )}
                  </Card>

                  {/* Family History */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Family History</h3>
                    {selectedPatientData.medicalHistory.familyHistory.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatientData.medicalHistory.familyHistory.map((history, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{history}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No significant family history</p>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'treatments' && (
                <div className="space-y-4">
                  {patientTreatments.length > 0 ? (
                    patientTreatments.map((treatment) => (
                      <Card key={treatment.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{treatment.type}</h3>
                            <p className="text-gray-600">Tooth: {treatment.tooth.join(', ')}</p>
                          </div>
                          <Badge className={`${
                            treatment.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            treatment.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          } border`}>
                            {treatment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{treatment.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600">Start Date</label>
                            <p className="text-sm text-gray-900">{formatDate(treatment.startDate)}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Expected End</label>
                            <p className="text-sm text-gray-900">{formatDate(treatment.expectedEndDate)}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Total Cost</label>
                            <p className="text-sm text-gray-900">${treatment.totalCost.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Paid Amount</label>
                            <p className="text-sm text-gray-900">${treatment.paidAmount.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Treatment Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Treatment Progress</span>
                            <span>{treatment.stages.filter(s => s.isCompleted).length}/{treatment.stages.length} stages</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${(treatment.stages.filter(s => s.isCompleted).length / treatment.stages.length) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Current Stage: {treatment.stages.find(s => s.id === treatment.currentStageId)?.name || 'Not started'}
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No treatments</h3>
                      <p className="text-gray-600">This patient has no treatment history.</p>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {patientAppointments.length > 0 ? (
                    patientAppointments.map((appointment) => (
                      <Card key={appointment.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.treatmentType || appointment.type}
                            </h3>
                            <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                          </div>
                          <Badge className={`${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          } border`}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600">Duration</label>
                            <p className="text-sm text-gray-900">{appointment.duration} minutes</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Room</label>
                            <p className="text-sm text-gray-900">{appointment.room}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Type</label>
                            <p className="text-sm text-gray-900 capitalize">{appointment.type}</p>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mb-4">
                            <label className="text-xs font-medium text-gray-600">Notes</label>
                            <p className="text-sm text-gray-900 mt-1">{appointment.notes}</p>
                          </div>
                        )}

                        {appointment.diagnosis && (
                          <div className="mb-4">
                            <label className="text-xs font-medium text-gray-600">Diagnosis</label>
                            <p className="text-sm text-gray-900 mt-1">{appointment.diagnosis}</p>
                          </div>
                        )}

                        {appointment.treatmentPlan && (
                          <div>
                            <label className="text-xs font-medium text-gray-600">Treatment Plan</label>
                            <p className="text-sm text-gray-900 mt-1">{appointment.treatmentPlan}</p>
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
                      <p className="text-gray-600">This patient has no appointment history.</p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a patient</h3>
              <p className="text-gray-600">
                Choose a patient from the list to view their detailed records and medical history.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

