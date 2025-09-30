'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Stethoscope,
  Search,
  Filter,
  Eye,
  Edit,
  Calendar,
  User,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Circle,
  Plus
} from 'lucide-react';
import { treatments, patients } from '@/data/dentist-data';
import Link from 'next/link';

export default function TreatmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = 
      treatment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patients.find(p => p.id === treatment.patientId)?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || treatment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || treatment.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getChecklistProgress = (checklist: any[]) => {
    const completed = checklist.filter(item => item.isCompleted).length;
    return { completed, total: checklist.length, percentage: (completed / checklist.length) * 100 };
  };

  const getOverallProgress = (treatment: any) => {
    const totalProgress = treatment.stages.reduce((acc: number, stage: any) => {
      const progress = getChecklistProgress(stage.checklist);
      return acc + progress.percentage;
    }, 0);
    return totalProgress / treatment.stages.length;
  };

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.fullName || 'Unknown Patient';
  };

  const completedCount = treatments.filter(t => t.status === 'completed').length;
  const inProgressCount = treatments.filter(t => t.status === 'in_progress').length;
  const pendingCount = treatments.filter(t => t.status === 'pending').length;
  const urgentCount = treatments.filter(t => t.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Treatments</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all patient treatments and their progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Treatment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
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
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search treatments or patients..."
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
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Treatments List */}
      <div className="space-y-4">
        {filteredTreatments.map((treatment) => {
          const patientName = getPatientName(treatment.patientId);
          const overallProgress = getOverallProgress(treatment);
          const currentStage = treatment.stages.find(s => s.id === treatment.currentStageId);
          
          return (
            <Card key={treatment.id} className="p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{treatment.type}</h3>
                    <Badge className={`${getStatusColor(treatment.status)} border`}>
                      {treatment.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${getPriorityColor(treatment.priority)} border`}>
                      {treatment.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{treatment.description}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    Patient: {patientName} • Tooth: {treatment.tooth.join(', ')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link href={`/dentist/treatments/${treatment.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Treatment Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Start Date</label>
                  <p className="text-sm text-gray-900">{formatDate(treatment.startDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Expected End</label>
                  <p className="text-sm text-gray-900">{formatDate(treatment.expectedEndDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Current Stage</label>
                  <p className="text-sm text-gray-900">{currentStage?.name || 'Not started'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Assigned Doctor</label>
                  <p className="text-sm text-gray-900">{treatment.assignedDoctorName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Total Cost</label>
                  <p className="text-sm font-bold text-gray-900">${treatment.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Paid Amount</label>
                  <p className="text-sm font-bold text-green-600">${treatment.paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Remaining</label>
                  <p className="text-sm font-bold text-red-600">
                    ${(treatment.totalCost - treatment.paidAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Stage Progress */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Treatment Stages</h4>
                <div className="space-y-2">
                  {treatment.stages.map((stage) => {
                    const progress = getChecklistProgress(stage.checklist);
                    const isCurrentStage = stage.id === treatment.currentStageId;
                    
                    return (
                      <div key={stage.id} className={`p-3 rounded-lg border ${
                        isCurrentStage ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              stage.isCompleted ? 'bg-green-100 text-green-600' :
                              isCurrentStage ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {stage.order}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                          </div>
                          <Badge className={`${
                            stage.isCompleted ? 'bg-green-100 text-green-800 border-green-200' :
                            stage.startedAt ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          } border text-xs`}>
                            {stage.isCompleted ? 'Completed' : 
                             stage.startedAt ? 'In Progress' : 
                             'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="ml-8">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{progress.completed}/{progress.total} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
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
              </div>

              {/* Treatment Notes */}
              {treatment.notes && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {treatment.notes}
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {filteredTreatments.length === 0 && (
          <Card className="p-12 text-center">
            <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No treatments found</h3>
            <p className="text-gray-600">
              No treatments match your current filters.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

