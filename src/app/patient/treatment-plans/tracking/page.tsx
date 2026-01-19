'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { TreatmentPlanSummaryDTO, TreatmentPlanDetailResponse } from '@/types/treatmentPlan';
import TreatmentPlanProgressCard from '@/components/treatment-plans/TreatmentPlanProgressCard';
import TreatmentPlanTimeline from '@/components/treatment-plans/TreatmentPlanTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, FileText, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';

export default function PatientTreatmentPlanTrackingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  const [plans, setPlans] = useState<TreatmentPlanSummaryDTO[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlanDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeView, setActiveView] = useState<'cards' | 'timeline'>('cards');

  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;

  // Load treatment plans
  useEffect(() => {
    if (!canView) return;

    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await TreatmentPlanService.getAllTreatmentPlansWithRBAC({
          page: 0,
          size: 100,
        });
        setPlans(response.content || []);
      } catch (error: any) {
        if (error.response?.status === 403) {
          return; // UnauthorizedMessage will be shown
        }
        handleError(error);
        toast.error('Không thể tải danh sách lộ trình điều trị');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [canView, is403Error, handleError]);

  // Load plan detail when selected
  const handlePlanSelect = async (planCode: string) => {
    try {
      setLoadingDetail(true);
      // Get patientCode from plan or extract from planCode
      // But for detail, we need patientCode - try to get from selected plan or use a workaround
      const patientCode = selectedPlan?.patient?.patientCode;
      if (!patientCode) {
        // If we don't have patientCode, we can't load detail - this is a limitation
        toast.error('Không thể tải chi tiết - thiếu thông tin bệnh nhân');
        return;
      }
      const plan = await TreatmentPlanService.getTreatmentPlanDetail(patientCode, planCode);
      setSelectedPlan(plan);
      setActiveView('timeline');
    } catch (error: any) {
      handleError(error);
      toast.error('Không thể tải chi tiết lộ trình điều trị');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = (planCode: string) => {
    router.push(`/patient/treatment-plans/${planCode}`);
  };

  const handleItemClick = (item: any) => {
    if (item.linkedAppointments && item.linkedAppointments.length > 0) {
      const appointmentCode = item.linkedAppointments[0].code;
      router.push(`/patient/appointments/${appointmentCode}`);
    }
  };

  if (!canView) {
    return (
      <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
        <UnauthorizedMessage />
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Đang tải lộ trình điều trị...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const activePlans = plans.filter(p => p.status === 'IN_PROGRESS');
  const completedPlans = plans.filter(p => p.status === 'COMPLETED');

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/patient/treatment-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Theo dõi lộ trình điều trị</h1>
              <p className="text-muted-foreground mt-1">
                Xem tiến độ và chi tiết các lộ trình điều trị của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng số lộ trình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đang điều trị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activePlans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedPlans.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="cards" value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList>
            <TabsTrigger value="cards">
              <FileText className="h-4 w-4 mr-2" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="timeline" disabled={!selectedPlan}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            {activePlans.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Đang điều trị</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePlans.map((plan) => (
                    <TreatmentPlanProgressCard
                      key={plan.planCode}
                      plan={plan}
                      onViewDetail={handlePlanSelect}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedPlans.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Đã hoàn thành</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedPlans.map((plan) => (
                    <TreatmentPlanProgressCard
                      key={plan.planCode}
                      plan={plan}
                      onViewDetail={handleViewDetail}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {plans.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Bạn chưa có lộ trình điều trị nào
                  </p>
                  <Button onClick={() => router.push('/patient/treatment-plans')}>
                    Xem tất cả lộ trình
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedPlan.planName}</h2>
                    <p className="text-sm text-muted-foreground">Mã: {selectedPlan.planCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(null);
                      setActiveView('cards');
                    }}
                  >
                    Quay lại danh sách
                  </Button>
                </div>
                <TreatmentPlanTimeline
                  plan={selectedPlan}
                  onItemClick={handleItemClick}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Vui lòng chọn một lộ trình điều trị để xem timeline
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}


