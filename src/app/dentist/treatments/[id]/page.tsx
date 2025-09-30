'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Camera,
  Activity,
  CheckCircle,
  Circle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Edit,
  Plus,
  Eye,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { treatments, patients, dentistAppointments, additionalAppointments } from '@/data/dentist-data';
import Link from 'next/link';

export default function TreatmentDetailPage() {
  const params = useParams();
  const treatmentId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'appointments' | 'images' | 'notes'>('overview');

  const treatment = treatments.find(t => t.id === treatmentId);
  const patient = treatment ? patients.find(p => p.id === treatment.patientId) : null;
  const allAppointments = [...dentistAppointments, ...additionalAppointments];
  const treatmentAppointments = treatment ? allAppointments.filter(apt => apt.treatmentId === treatmentId) : [];

  if (!treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Treatment Not Found</h1>
          <p className="text-gray-600 mb-4">The treatment you're looking for doesn't exist.</p>
          <Link href="/dentist/treatments">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Treatments
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageStatusColor = (stage: any) => {
    if (stage.isCompleted) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (stage.startedAt && !stage.isCompleted) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getChecklistProgress = (checklist: any[]) => {
    const completed = checklist.filter(item => item.isCompleted).length;
    return { completed, total: checklist.length, percentage: (completed / checklist.length) * 100 };
  };

  const overallProgress = treatment.stages.reduce((acc, stage) => {
    const progress = getChecklistProgress(stage.checklist);
    return acc + progress.percentage;
  }, 0) / treatment.stages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dentist/stages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stages
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{treatment.type}</h1>
            <p className="text-gray-600">
              Patient: {patient?.fullName} • Treatment ID: {treatment.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Treatment
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Treatment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={`${getStatusColor(treatment.status)} border text-sm mt-1`}>
                {treatment.status.replace('_', ' ')}
              </Badge>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <Badge className={`${getPriorityColor(treatment.priority)} border text-sm mt-1`}>
                {treatment.priority}
              </Badge>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(overallProgress)}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">${treatment.totalCost.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Patient Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
          <Link href={`/dentist/patients?patient=${treatment.patientId}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </Link>
        </div>
        
        {patient && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{patient.fullName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{patient.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{patient.email}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                <p className="text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gender</label>
                <p className="text-sm text-gray-900 capitalize">{patient.gender}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-sm text-gray-900">{patient.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Insurance</label>
                <p className="text-sm text-gray-900">
                  {patient.insuranceInfo ? patient.insuranceInfo.provider : 'No insurance'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Treatment Details */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-sm text-gray-900">{treatment.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tooth/Teeth</label>
                <p className="text-sm text-gray-900">{treatment.tooth.join(', ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Assigned Doctor</label>
                <p className="text-sm text-gray-900">{treatment.assignedDoctorName}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <p className="text-sm text-gray-900">{formatDate(treatment.startDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Expected End</label>
                <p className="text-sm text-gray-900">{formatDate(treatment.expectedEndDate)}</p>
              </div>
              {treatment.actualEndDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Actual End</label>
                  <p className="text-sm text-gray-900">{formatDate(treatment.actualEndDate)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Duration</label>
                <p className="text-sm text-gray-900">
                  {Math.ceil((new Date(treatment.expectedEndDate).getTime() - new Date(treatment.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Total Cost</label>
            <p className="text-2xl font-bold text-gray-900">${treatment.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Paid Amount</label>
            <p className="text-2xl font-bold text-green-600">${treatment.paidAmount.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Remaining Balance</label>
            <p className="text-2xl font-bold text-red-600">
              ${(treatment.totalCost - treatment.paidAmount).toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(treatment.paidAmount / treatment.totalCost) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Payment Progress: {Math.round((treatment.paidAmount / treatment.totalCost) * 100)}%
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'stages', label: 'Treatment Stages', icon: Activity },
            { key: 'appointments', label: 'Appointments', icon: Calendar },
            { key: 'images', label: 'X-Rays & Images', icon: Camera },
            { key: 'notes', label: 'Notes', icon: FileText },
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
        <div className="space-y-6">
          {/* Treatment Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Progress</h3>
            <div className="space-y-4">
              {treatment.stages.map((stage, index) => {
                const progress = getChecklistProgress(stage.checklist);
                const isCurrentStage = stage.id === treatment.currentStageId;
                
                return (
                  <div key={stage.id} className={`p-4 rounded-lg border ${
                    isCurrentStage ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          stage.isCompleted ? 'bg-green-100 text-green-600' :
                          isCurrentStage ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {stage.order}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{stage.name}</h4>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        </div>
                      </div>
                      <Badge className={`${getStageStatusColor(stage)} border`}>
                        {stage.isCompleted ? 'Completed' : 
                         stage.startedAt ? 'In Progress' : 
                         'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="ml-11">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.completed}/{progress.total} tasks</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            stage.isCompleted ? 'bg-green-600' :
                            isCurrentStage ? 'bg-blue-600' : 'bg-gray-400'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Treatment Notes */}
          {treatment.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{treatment.notes}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="space-y-4">
          {treatment.stages.map((stage) => (
            <Card key={stage.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                  <p className="text-gray-600">{stage.description}</p>
                </div>
                <Badge className={`${getStageStatusColor(stage)} border`}>
                  {stage.isCompleted ? 'Completed' : 
                   stage.startedAt ? 'In Progress' : 
                   'Pending'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {stage.checklist.map((item) => (
                  <div key={item.id} className={`p-3 rounded-lg border ${
                    item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {item.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${
                            item.isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                          }`}>
                            {item.task}
                            {item.isRequired && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h4>
                          {item.isCompleted && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        {item.isCompleted && (
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>
                              <User className="inline h-3 w-3 mr-1" />
                              Completed by: {item.completedBy}
                            </p>
                            <p>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatDateTime(item.completedAt!)}
                            </p>
                            {item.notes && (
                              <p className="mt-2 p-2 bg-gray-100 rounded text-gray-700">
                                <strong>Notes:</strong> {item.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {treatmentAppointments.length > 0 ? (
            treatmentAppointments.map((appointment) => (
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
                    'bg-gray-100 text-gray-800 border-gray-200'
                  } border`}>
                    {appointment.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Duration</label>
                    <p className="text-sm text-gray-900">{appointment.duration} minutes</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Room</label>
                    <p className="text-sm text-gray-900">{appointment.room}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Priority</label>
                    <Badge className={`${getPriorityColor(appointment.priority)} border text-xs mt-1`}>
                      {appointment.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Reminder</label>
                    <p className="text-sm text-gray-900">
                      {appointment.reminderSent ? 'Sent' : 'Not sent'}
                    </p>
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
              <p className="text-gray-600">No appointments scheduled for this treatment.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="space-y-6">
          {/* X-Rays */}
          {treatment.xrays && treatment.xrays.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">X-Rays</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treatment.xrays.map((xray) => (
                  <div key={xray.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{xray.type}</h4>
                    <p className="text-sm text-gray-600 mb-2">{formatDate(xray.date)}</p>
                    {xray.notes && (
                      <p className="text-xs text-gray-500">{xray.notes}</p>
                    )}
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Images */}
          {treatment.images && treatment.images.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treatment.images.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{image.type}</h4>
                    <p className="text-sm text-gray-600 mb-2">{formatDate(image.date)}</p>
                    {image.notes && (
                      <p className="text-xs text-gray-500">{image.notes}</p>
                    )}
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {( !treatment.xrays || treatment.xrays.length === 0 ) && 
           ( !treatment.images || treatment.images.length === 0 ) && (
            <Card className="p-8 text-center">
              <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images</h3>
              <p className="text-gray-600">No X-rays or clinical images available for this treatment.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Treatment Notes</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
          
          {treatment.notes ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{treatment.notes}</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No notes</h4>
              <p className="text-gray-600">No treatment notes have been added yet.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

