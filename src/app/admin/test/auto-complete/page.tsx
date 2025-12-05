'use client';

/**
 * Test Page: Phase và Plan Auto-Complete
 * 
 * Purpose: Test BE có auto-complete phase và plan đúng cách khi items completed
 * 
 * Usage:
 * 1. Nhập plan code hoặc chọn plan từ dropdown
 * 2. Click "Load Plan" để load plan details
 * 3. Complete items theo thứ tự
 * 4. Verify phase và plan status sau mỗi step
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Play } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { TreatmentPlanDetailResponse, PhaseDetailDTO, ItemDetailDTO, PlanItemStatus } from '@/types/treatmentPlan';
import { useAuth } from '@/contexts/AuthContext';

export default function AutoCompleteTestPage() {
  const { user } = useAuth();
  const [planCode, setPlanCode] = useState('');
  const [plan, setPlan] = useState<TreatmentPlanDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<{
    phase1Completed: boolean | null;
    phase2Completed: boolean | null;
    planCompleted: boolean | null;
  }>({
    phase1Completed: null,
    phase2Completed: null,
    planCompleted: null,
  });

  // Load plan details
  const loadPlan = async () => {
    if (!planCode.trim()) {
      toast.error('Vui lòng nhập plan code');
      return;
    }

    setLoading(true);
    try {
      // Extract patient code from plan code or use default
      // For testing, we'll try to get from plan detail
      const patientCode = 'BN-1001'; // Default, user can change if needed
      
      const planDetail = await TreatmentPlanService.getTreatmentPlanDetail(patientCode, planCode);
      setPlan(planDetail);
      setTestResults({
        phase1Completed: null,
        phase2Completed: null,
        planCompleted: null,
      });
      toast.success('Đã load plan thành công');
    } catch (error: any) {
      console.error('Error loading plan:', error);
      toast.error(error.message || 'Không thể load plan');
    } finally {
      setLoading(false);
    }
  };

  // Update item status
  const updateItemStatus = async (itemId: number, status: PlanItemStatus) => {
    setUpdating(itemId);
    try {
      await TreatmentPlanService.updateItemStatus(itemId, {
        status,
        notes: `Test auto-complete - ${new Date().toLocaleString()}`,
      });

      toast.success(`Đã cập nhật item ${itemId} thành ${status}`);
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload plan to see updated status
      await loadPlan();
    } catch (error: any) {
      console.error('Error updating item status:', error);
      toast.error(error.message || 'Không thể cập nhật item status');
    } finally {
      setUpdating(null);
    }
  };

  // Verify test results
  const verifyResults = () => {
    if (!plan || !plan.phases || plan.phases.length < 2) {
      toast.error('Plan cần có ít nhất 2 phases để test');
      return;
    }

    const phase1 = plan.phases[0];
    const phase2 = plan.phases[1];

    const results = {
      phase1Completed: phase1.status?.toUpperCase() === 'COMPLETED',
      phase2Completed: phase2.status?.toUpperCase() === 'COMPLETED',
      planCompleted: plan.status === 'COMPLETED',
    };

    setTestResults(results);

    // Show summary
    const allPass = results.phase1Completed && results.phase2Completed && results.planCompleted;
    
    if (allPass) {
      toast.success(' TẤT CẢ TEST PASS! BE auto-complete đang hoạt động đúng');
    } else {
      const failures = [];
      if (!results.phase1Completed) failures.push('Phase 1 không auto-complete');
      if (!results.phase2Completed) failures.push('Phase 2 không auto-complete');
      if (!results.planCompleted) failures.push('Plan không auto-complete');
      
      toast.error(` TEST FAILED: ${failures.join(', ')}`);
    }
  };

  // Auto test sequence
  const runAutoTest = async () => {
    if (!plan || !plan.phases || plan.phases.length < 2) {
      toast.error('Plan cần có ít nhất 2 phases để test');
      return;
    }

    const phase1 = plan.phases[0];
    const phase2 = plan.phases[1];

    if (!phase1.items || phase1.items.length === 0 || !phase2.items || phase2.items.length === 0) {
      toast.error('Mỗi phase cần có ít nhất 1 item để test');
      return;
    }

    toast.info('Bắt đầu auto test...');

    try {
      // Step 1: Complete all items in Phase 1
      for (const item of phase1.items) {
        if (item.status !== 'COMPLETED' && item.status !== 'SKIPPED') {
          await updateItemStatus(item.itemId, PlanItemStatus.COMPLETED);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for processing
        }
      }

      // Verify Phase 1
      await loadPlan();
      await new Promise(resolve => setTimeout(resolve, 1000));
      verifyResults();

      // Step 2: Complete all items in Phase 2
      for (const item of phase2.items) {
        if (item.status !== 'COMPLETED' && item.status !== 'SKIPPED') {
          await updateItemStatus(item.itemId, PlanItemStatus.COMPLETED);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for processing
        }
      }

      // Final verification
      await loadPlan();
      await new Promise(resolve => setTimeout(resolve, 1000));
      verifyResults();

      toast.success(' Auto test hoàn thành!');
    } catch (error: any) {
      console.error('Error in auto test:', error);
      toast.error('Auto test failed: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">NULL</Badge>;
    
    const statusUpper = status.toUpperCase();
    const colors: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: '#10B981', text: 'white' },
      PENDING: { bg: '#9CA3AF', text: 'white' },
      IN_PROGRESS: { bg: '#3B82F6', text: 'white' },
    };

    const color = colors[statusUpper] || { bg: '#6B7280', text: 'white' };
    
    return (
      <Badge style={{ backgroundColor: color.bg, color: color.text }}>
        {statusUpper}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test: Phase & Plan Auto-Complete</h1>
          <p className="text-muted-foreground mt-2">
            Test BE có auto-complete phase và plan đúng cách khi items completed
          </p>
        </div>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="planCode">Plan Code</Label>
              <Input
                id="planCode"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                placeholder="PLAN-20251203-002"
                onKeyDown={(e) => e.key === 'Enter' && loadPlan()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadPlan} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Plan
                  </>
                )}
              </Button>
            </div>
            {plan && (
              <div className="flex items-end">
                <Button onClick={runAutoTest} variant="default">
                  <Play className="mr-2 h-4 w-4" />
                  Run Auto Test
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Phase 1</div>
                {testResults.phase1Completed === null ? (
                  <Badge variant="outline">Not Tested</Badge>
                ) : testResults.phase1Completed ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">PASS</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">FAIL</span>
                  </div>
                )}
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Phase 2</div>
                {testResults.phase2Completed === null ? (
                  <Badge variant="outline">Not Tested</Badge>
                ) : testResults.phase2Completed ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">PASS</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">FAIL</span>
                  </div>
                )}
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Plan</div>
                {testResults.planCompleted === null ? (
                  <Badge variant="outline">Not Tested</Badge>
                ) : testResults.planCompleted ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">PASS</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">FAIL</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={verifyResults} variant="outline" size="sm">
                Verify Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Details */}
      {plan && (
        <div className="space-y-4">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Code</Label>
                  <div className="font-mono">{plan.planCode}</div>
                </div>
                <div>
                  <Label>Plan Status</Label>
                  <div>{getStatusBadge(plan.status)}</div>
                </div>
                <div>
                  <Label>Approval Status</Label>
                  <div>{plan.approvalStatus}</div>
                </div>
                <div>
                  <Label>Phases Count</Label>
                  <div>{plan.phases?.length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {plan.phases?.map((phase, phaseIndex) => (
            <Card key={phase.phaseId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Phase {phase.phaseNumber}: {phase.phaseName}
                  </CardTitle>
                  {getStatusBadge(phase.status)}
                </div>
                {phase.completionDate && (
                  <div className="text-sm text-muted-foreground">
                    Completed: {new Date(phase.completionDate).toLocaleDateString()}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {phase.items?.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          #{item.sequenceNumber} {item.itemName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Status: {getStatusBadge(item.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status !== 'COMPLETED' && item.status !== 'SKIPPED' && (
                          <Button
                            size="sm"
                            onClick={() => updateItemStatus(item.itemId, PlanItemStatus.COMPLETED)}
                            disabled={updating === item.itemId}
                          >
                            {updating === item.itemId ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Complete'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Manual Test:</strong>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Nhập plan code và click "Load Plan"</li>
              <li>Complete từng item trong Phase 1</li>
              <li>Verify Phase 1 status = COMPLETED</li>
              <li>Complete từng item trong Phase 2</li>
              <li>Verify Phase 2 status = COMPLETED</li>
              <li>Verify Plan status = COMPLETED</li>
              <li>Click "Verify Results" để xem test results</li>
            </ol>
          </div>
          <div className="mt-4">
            <strong>Auto Test:</strong>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Load plan</li>
              <li>Click "Run Auto Test"</li>
              <li>Script sẽ tự động complete tất cả items</li>
              <li>Verify results sau khi test hoàn thành</li>
            </ol>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <strong>Expected Results:</strong>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li> Phase 1 auto-completes khi tất cả items completed</li>
              <li> Phase 2 auto-completes khi tất cả items completed</li>
              <li> Plan auto-completes khi tất cả phases completed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

