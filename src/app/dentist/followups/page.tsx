'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Calendar,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Bell,
  CalendarPlus,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Mail,
  MessageSquare,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { followUpSchedules, patients, treatments } from '@/data/dentist-data';

export default function FollowUpSchedulePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);

  const filteredFollowUps = followUpSchedules.filter(followUp => {
    const matchesSearch = 
      followUp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.treatmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || followUp.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || followUp.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const selectedFollowUpData = followUpSchedules.find(f => f.id === selectedFollowUp);

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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'soon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'routine':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPatientInfo = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  const getTreatmentInfo = (treatmentId: string) => {
    return treatments.find(t => t.id === treatmentId);
  };

  const overdueCount = followUpSchedules.filter(f => f.status === 'overdue').length;
  const pendingCount = followUpSchedules.filter(f => f.status === 'pending').length;
  const scheduledCount = followUpSchedules.filter(f => f.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow-up Schedule</h1>
          <p className="text-gray-600 mt-2">
            Manage patient follow-up appointments and reminders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{followUpSchedules.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients or treatments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Urgency</option>
            <option value="urgent">Urgent</option>
            <option value="soon">Soon</option>
            <option value="routine">Routine</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follow-up List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredFollowUps.map((followUp) => {
              const daysUntilDue = getDaysUntilDue(followUp.suggestedDate);
              const patientInfo = getPatientInfo(followUp.patientId);
              const treatmentInfo = getTreatmentInfo(followUp.treatmentId);
              
              return (
                <Card
                  key={followUp.id}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedFollowUp === followUp.id ? 'ring-2 ring-purple-200 border-purple-200' : ''
                  }`}
                  onClick={() => setSelectedFollowUp(followUp.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{followUp.patientName}</h3>
                        <Badge className={`${getStatusColor(followUp.status)} border text-xs`}>
                          {followUp.status}
                        </Badge>
                        <Badge className={`${getUrgencyColor(followUp.urgency)} border text-xs`}>
                          {followUp.urgency}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-1">{followUp.treatmentType}</p>
                      <p className="text-sm text-gray-500 mb-2">Current Stage: {followUp.currentStage}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(followUp.suggestedDate)}
                      </p>
                      <p className={`text-xs ${
                        daysUntilDue < 0 ? 'text-red-600' :
                        daysUntilDue <= 7 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                         daysUntilDue === 0 ? 'Due today' :
                         `${daysUntilDue} days until due`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{followUp.reason}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 font-medium mb-1">Instructions:</p>
                    <p className="text-sm text-gray-600">{followUp.instructions}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {patientInfo?.phone || 'No phone'}
                      </span>
                      <span className="flex items-center">
                        <Bell className="h-3 w-3 mr-1" />
                        {followUp.remindersSent} reminder{followUp.remindersSent !== 1 ? 's' : ''} sent
                      </span>
                      {followUp.lastReminderDate && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Last: {formatDate(followUp.lastReminderDate)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <CalendarPlus className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bell className="h-3 w-3 mr-1" />
                        Remind
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredFollowUps.length === 0 && (
              <Card className="p-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups found</h3>
                <p className="text-gray-600">
                  No follow-up appointments match your current filters.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Follow-up Details */}
        <div className="lg:col-span-1">
          {selectedFollowUpData ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedFollowUpData.patientName}</span>
                  </div>
                  
                  {getPatientInfo(selectedFollowUpData.patientId) && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {getPatientInfo(selectedFollowUpData.patientId)?.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {getPatientInfo(selectedFollowUpData.patientId)?.email}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Treatment Details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Treatment Type</label>
                    <p className="text-sm text-gray-900">{selectedFollowUpData.treatmentType}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Stage</label>
                    <p className="text-sm text-gray-900">{selectedFollowUpData.currentStage}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Follow-up Reason</label>
                    <p className="text-sm text-gray-900">{selectedFollowUpData.reason}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full">
                    <Stethoscope className="h-3 w-3 mr-2" />
                    View Treatment Plan
                  </Button>
                </div>
              </Card>

              {/* Schedule Details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Suggested Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedFollowUpData.suggestedDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Urgency</label>
                    <Badge className={`${getUrgencyColor(selectedFollowUpData.urgency)} border text-xs mt-1`}>
                      {selectedFollowUpData.urgency}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`${getStatusColor(selectedFollowUpData.status)} border text-xs mt-1`}>
                      {selectedFollowUpData.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedFollowUpData.createdAt)}</p>
                  </div>
                </div>
              </Card>

              {/* Reminder History */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminder History</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reminders Sent:</span>
                    <span className="font-medium text-gray-900">{selectedFollowUpData.remindersSent}</span>
                  </div>
                  
                  {selectedFollowUpData.lastReminderDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Reminder:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedFollowUpData.lastReminderDate)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <Button size="sm" className="w-full">
                    <Bell className="h-3 w-3 mr-2" />
                    Send Reminder Now
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <CalendarPlus className="h-3 w-3 mr-2" />
                    Schedule Appointment
                  </Button>
                </div>
              </Card>

              {/* Instructions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Instructions</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">{selectedFollowUpData.instructions}</p>
                </div>
                
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full">
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Instructions
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a follow-up</h3>
              <p className="text-gray-600">
                Choose a follow-up appointment from the list to view detailed information.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

