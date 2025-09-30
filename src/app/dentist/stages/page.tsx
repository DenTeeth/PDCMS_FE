'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, 
  CheckCircle,
  Circle,
  Clock,
  User,
  CalendarDays,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Plus,
  Edit,
  Eye,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { treatments, patients } from '@/data/dentist-data';

export default function TreatmentStagesPage() {
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const activeTreatments = treatments.filter(t => t.status === 'in_progress');
  const selectedTreatmentData = treatments.find(t => t.id === selectedTreatment);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const toggleStageExpanded = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const handleChecklistItemToggle = (treatmentId: string, stageId: string, itemId: string) => {
    // In a real app, this would update the backend
    console.log('Toggle checklist item:', { treatmentId, stageId, itemId });
  };

  const canStartStage = (stage: any, allStages: any[]) => {
    if (stage.prerequisites.length === 0) return true;
    return stage.prerequisites.every(prereqId => 
      allStages.find(s => s.id === prereqId)?.isCompleted
    );
  };

  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.fullName || 'Unknown Patient';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Treatment Stages</h1>
          <p className="text-gray-600 mt-2">
            Manage treatment progress with detailed checklists and stage tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Stage Templates
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Treatments List */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Treatments</h2>
            <Badge variant="outline" className="text-xs">
              {activeTreatments.length} treatments
            </Badge>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {activeTreatments.map((treatment) => {
              const progress = getChecklistProgress(
                treatment.stages.flatMap(stage => stage.checklist)
              );
              const currentStage = treatment.stages.find(s => s.id === treatment.currentStageId);
              
              return (
                <div
                  key={treatment.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedTreatment === treatment.id
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTreatment(treatment.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{treatment.type}</h3>
                    <Badge className={`${
                      treatment.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                      treatment.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    } border text-xs`}>
                      {treatment.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{getPatientName(treatment.patientId)}</p>
                  <p className="text-xs text-gray-500 mb-3">Tooth: {treatment.tooth.join(', ')}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress.completed}/{progress.total} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Current: {currentStage?.name || 'Not started'}</span>
                    <span>{treatment.stages.filter(s => s.isCompleted).length}/{treatment.stages.length} stages</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Treatment Stages Detail */}
        <div className="lg:col-span-2">
          {selectedTreatmentData ? (
            <div className="space-y-6">
              {/* Treatment Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTreatmentData.type}</h2>
                    <p className="text-gray-600">
                      Patient: {getPatientName(selectedTreatmentData.patientId)} • 
                      Tooth: {selectedTreatmentData.tooth.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${
                      selectedTreatmentData.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    } border`}>
                      {selectedTreatmentData.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Start Date</label>
                    <p className="font-medium text-gray-900">{formatDate(selectedTreatmentData.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Expected End</label>
                    <p className="font-medium text-gray-900">{formatDate(selectedTreatmentData.expectedEndDate)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Priority</label>
                    <Badge className={`${
                      selectedTreatmentData.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                      selectedTreatmentData.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    } border text-xs mt-1`}>
                      {selectedTreatmentData.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-gray-600">Assigned Doctor</label>
                    <p className="font-medium text-gray-900">{selectedTreatmentData.assignedDoctorName}</p>
                  </div>
                </div>
              </Card>

              {/* Treatment Stages */}
              <div className="space-y-4">
                {selectedTreatmentData.stages.map((stage, index) => {
                  const isExpanded = expandedStages.has(stage.id);
                  const progress = getChecklistProgress(stage.checklist);
                  const canStart = canStartStage(stage, selectedTreatmentData.stages);
                  const isCurrentStage = stage.id === selectedTreatmentData.currentStageId;
                  
                  return (
                    <Card key={stage.id} className={`overflow-hidden ${
                      isCurrentStage ? 'ring-2 ring-purple-200 border-purple-200' : ''
                    }`}>
                      {/* Stage Header */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => toggleStageExpanded(stage.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                stage.isCompleted ? 'bg-green-100 text-green-600' :
                                isCurrentStage ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {stage.order}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                              <p className="text-sm text-gray-600">{stage.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {progress.completed}/{progress.total} tasks
                              </div>
                              <div className="text-xs text-gray-500">
                                Est. {stage.estimatedDuration} day{stage.estimatedDuration !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <Badge className={`${getStageStatusColor(stage)} border`}>
                              {stage.isCompleted ? 'Completed' : 
                               stage.startedAt ? 'In Progress' : 
                               canStart ? 'Ready' : 'Pending'}
                            </Badge>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
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

                      {/* Stage Details (Expanded) */}
                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {/* Stage Info */}
                          <div className="p-4 bg-gray-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {stage.startedAt && (
                                <div>
                                  <label className="text-gray-600">Started</label>
                                  <p className="font-medium text-gray-900">{formatDate(stage.startedAt)}</p>
                                </div>
                              )}
                              {stage.completedAt && (
                                <div>
                                  <label className="text-gray-600">Completed</label>
                                  <p className="font-medium text-gray-900">{formatDate(stage.completedAt)}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-gray-600">Prerequisites</label>
                                <p className="font-medium text-gray-900">
                                  {stage.prerequisites.length === 0 ? 'None' : 
                                   stage.prerequisites.map(prereq => 
                                     selectedTreatmentData.stages.find(s => s.id === prereq)?.name
                                   ).join(', ')
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Checklist */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-semibold text-gray-900">Checklist</h4>
                              <div className="flex items-center space-x-2">
                                {!stage.isCompleted && canStart && (
                                  <Button size="sm" variant="outline">
                                    <Play className="h-3 w-3 mr-1" />
                                    Start Stage
                                  </Button>
                                )}
                                {stage.isCompleted && (
                                  <Button size="sm" variant="outline">
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reopen
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {stage.checklist.map((item) => (
                                <div key={item.id} className={`p-3 rounded-lg border ${
                                  item.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}>
                                  <div className="flex items-start space-x-3">
                                    <button
                                      onClick={() => handleChecklistItemToggle(
                                        selectedTreatmentData.id, stage.id, item.id
                                      )}
                                      className="mt-0.5"
                                      disabled={!canStart || stage.isCompleted}
                                    >
                                      {item.isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                      )}
                                    </button>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <h5 className={`font-medium ${
                                          item.isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                                        }`}>
                                          {item.task}
                                          {item.isRequired && (
                                            <span className="text-red-500 ml-1">*</span>
                                          )}
                                        </h5>
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
                                            {formatDate(item.completedAt!)}
                                          </p>
                                          {item.notes && (
                                            <p className="mt-2 p-2 bg-gray-100 rounded text-gray-700">
                                              <strong>Notes:</strong> {item.notes}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      
                                      {!item.isCompleted && canStart && !stage.isCompleted && (
                                        <div className="mt-2">
                                          <Input
                                            placeholder="Add notes (optional)"
                                            value={notes[item.id] || ''}
                                            onChange={(e) => setNotes(prev => ({
                                              ...prev,
                                              [item.id]: e.target.value
                                            }))}
                                            className="text-xs"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Required Tasks Warning */}
                            {stage.checklist.some(item => item.isRequired && !item.isCompleted) && (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-amber-800">Required Tasks Pending</p>
                                    <p className="text-xs text-amber-700">
                                      Complete all required tasks (*) to proceed to the next stage.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a treatment</h3>
              <p className="text-gray-600">
                Choose an active treatment from the list to view and manage its stages and checklists.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

