'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Stethoscope,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  UserCheck,
  Activity,
  Star,
  Plus,
  Eye
} from 'lucide-react';
import { dentistStats, dentistAppointments, treatments, followUpSchedules, patients } from '@/data/dentist-data';
import Link from 'next/link';

export default function DentistDashboard() {
  const formatTime = (time: string) => {
    return new Date(`2024-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
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
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const todayAppointments = dentistStats.todayAppointments;
  const upcomingAppointments = dentistAppointments.filter(apt => 
    new Date(apt.date) > new Date() && apt.status === 'scheduled'
  ).slice(0, 3);

  const activeTreatments = treatments.filter(t => t.status === 'in_progress');
  const overdueFollowUps = followUpSchedules.filter(f => f.status === 'overdue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dentist Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, Dr. Nguyen Van A • {formatDate(new Date().toISOString())}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dentist/patients">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Patient
            </Button>
          </Link>
          <Link href="/dentist/schedule">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Today's Appointments</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {todayAppointments.filter(apt => apt.status === 'completed').length} completed
          </p>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Patients</h3>
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dentistStats.activePatients}</p>
          <p className="text-sm text-gray-500 mt-1">
            {patients.filter(p => p.nextAppointment).length} with upcoming appointments
          </p>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Treatments</h3>
            <Stethoscope className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dentistStats.activeTreatments}</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeTreatments.filter(t => t.priority === 'high' || t.priority === 'urgent').length} high priority
          </p>
        </Card>

        <Card className="p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending Follow-ups</h3>
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dentistStats.pendingFollowUps}</p>
          <p className="text-sm text-red-600 mt-1">
            {overdueFollowUps.length} overdue
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
            <Link href="/dentist/schedule">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
          
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{appointment.patientName}</h3>
                      <Badge className={`${getStatusColor(appointment.status)} border text-xs`}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{appointment.treatmentType || appointment.type}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(appointment.time)}
                      </span>
                      <span>{appointment.duration} min</span>
                      <span>{appointment.room}</span>
                    </div>
                  </div>
                  {appointment.priority === 'urgent' && (
                    <AlertTriangle className="h-5 w-5 text-red-500 ml-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Treatments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Treatments</h2>
            <Link href="/dentist/treatments">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {activeTreatments.slice(0, 4).map((treatment) => (
              <div key={treatment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{treatment.patientName}</h3>
                  <Badge className={`${getPriorityColor(treatment.priority)} border text-xs`}>
                    {treatment.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{treatment.type}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tooth: {treatment.tooth.join(', ')}</span>
                  <span>Stage: {treatment.stages.find(s => s.id === treatment.currentStageId)?.name}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
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
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
            <UserCheck className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 text-sm">{appointment.patientName}</h3>
                  <span className="text-xs text-gray-500">{formatDate(appointment.date)}</span>
                </div>
                <p className="text-xs text-gray-600">{appointment.treatmentType || appointment.type}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{formatTime(appointment.time)}</span>
                  <span>{appointment.duration} min</span>
                </div>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </Card>

        {/* Overdue Follow-ups */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-amber-800">Overdue Follow-ups</h2>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          
          <div className="space-y-3">
            {overdueFollowUps.map((followUp) => (
              <div key={followUp.id} className="p-3 bg-white rounded-lg border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 text-sm">{followUp.patientName}</h3>
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                    Overdue
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{followUp.treatmentType}</p>
                <p className="text-xs text-amber-700">Due: {formatDate(followUp.suggestedDate)}</p>
                <p className="text-xs text-gray-500 mt-1">{followUp.reason}</p>
              </div>
            ))}
            {overdueFollowUps.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 text-sm">All follow-ups are up to date!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Performance Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Summary</h2>
            <TrendingUp className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Patient Satisfaction</span>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-600">{dentistStats.patientSatisfactionAvg}</span>
                <span className="text-sm text-gray-500">/5.0</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(dentistStats.patientSatisfactionAvg / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Treatment Success Rate</span>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">{dentistStats.treatmentSuccessRate}%</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${dentistStats.treatmentSuccessRate}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Completed This Month</span>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">{dentistStats.completedTreatmentsThisMonth}</span>
                <span className="text-sm text-gray-500">treatments</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dentist/schedule">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Calendar className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Schedule</div>
                <div className="text-xs text-gray-500">View appointments</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/dentist/patients">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Users className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Patients</div>
                <div className="text-xs text-gray-500">Manage records</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/dentist/treatments">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Stethoscope className="h-5 w-5 mr-3 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Treatments</div>
                <div className="text-xs text-gray-500">Active cases</div>
              </div>
            </Button>
          </Link>
          
          <Link href="/dentist/followups">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <Clock className="h-5 w-5 mr-3 text-orange-600" />
              <div className="text-left">
                <div className="font-medium">Follow-ups</div>
                <div className="text-xs text-gray-500">Schedule reminders</div>
              </div>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

