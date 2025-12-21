/**
 * Custom hook for Auto-Schedule Treatment Plans
 * 
 * Issue: ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS
 * Issue: ISSUE_BE_EMPLOYEE_CONTRACT_END_DATE_VALIDATION
 * 
 * Handles automatic appointment scheduling from treatment plans with:
 * - Holiday adjustments
 * - Spacing rules validation
 * - Employee contract validation
 */

'use client';

import { useState, useCallback } from 'react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import {
  AutoScheduleRequest,
  AutoScheduleResponse,
  AppointmentSuggestion,
} from '@/types/treatmentPlan';
import { toast } from 'sonner';

interface UseAutoScheduleReturn {
  suggestions: AppointmentSuggestion[];
  summary: AutoScheduleResponse['summary'] | null;
  isLoading: boolean;
  error: string | null;
  totalItemsProcessed: number;
  successfulSuggestions: number;
  failedItems: number;
  // Actions
  generateSchedule: (planId: number, request: AutoScheduleRequest) => Promise<void>;
  clearSuggestions: () => void;
  retry: () => Promise<void>;
  // Helpers
  hasWarnings: boolean;
  hasReassignRequired: boolean;
  // Last request for retry
  lastRequest: { planId: number; request: AutoScheduleRequest } | null;
}

export const useAutoSchedule = (): UseAutoScheduleReturn => {
  const [suggestions, setSuggestions] = useState<AppointmentSuggestion[]>([]);
  const [summary, setSummary] = useState<AutoScheduleResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItemsProcessed, setTotalItemsProcessed] = useState(0);
  const [successfulSuggestions, setSuccessfulSuggestions] = useState(0);
  const [failedItems, setFailedItems] = useState(0);
  const [lastRequest, setLastRequest] = useState<{ planId: number; request: AutoScheduleRequest } | null>(null);

  /**
   * Generate automatic appointment suggestions for a treatment plan
   */
  const generateSchedule = useCallback(
    async (planId: number, request: AutoScheduleRequest) => {
      setIsLoading(true);
      setError(null);
      
      // Store last request for retry
      setLastRequest({ planId, request });

      try {
        const response = await TreatmentPlanService.autoSchedule(planId, request);

        setSuggestions(response.suggestions);
        setSummary(response.summary);
        setTotalItemsProcessed(response.totalItemsProcessed);
        setSuccessfulSuggestions(response.successfulSuggestions);
        setFailedItems(response.failedItems);

        // Show success message with summary
        if (response.successfulSuggestions > 0) {
          toast.success(
            `Đã tạo ${response.successfulSuggestions} gợi ý lịch hẹn`,
            {
              description: `Tổng cộng ${response.totalItemsProcessed} item đã được xử lý`,
            }
          );
        }

        // Show warnings if any
        const warningsCount = response.suggestions.filter((s) => s.warning).length;
        if (warningsCount > 0) {
          toast.warning(
            `Có ${warningsCount} gợi ý cần chú ý`,
            {
              description: 'Vui lòng xem chi tiết các cảnh báo về bác sĩ hoặc ngày lễ',
            }
          );
        }

        // Show errors if any
        if (response.failedItems > 0) {
          toast.error(
            `${response.failedItems} item không thể tạo gợi ý`,
            {
              description: 'Vui lòng kiểm tra lại thông tin dịch vụ hoặc conflicts',
            }
          );
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Không thể tạo gợi ý lịch hẹn tự động';
        setError(errorMessage);
        console.error('[AutoSchedule] Error:', err);
        toast.error('Lỗi khi tạo gợi ý lịch hẹn', {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSummary(null);
    setTotalItemsProcessed(0);
    setSuccessfulSuggestions(0);
    setFailedItems(0);
    setError(null);
    setLastRequest(null);
  }, []);

  /**
   * Retry last failed request
   */
  const retry = useCallback(async () => {
    if (!lastRequest) {
      toast.error('Không có yêu cầu nào để thử lại');
      return;
    }
    
    await generateSchedule(lastRequest.planId, lastRequest.request);
  }, [lastRequest, generateSchedule]);

  /**
   * Check if any suggestions have warnings
   */
  const hasWarnings = suggestions.some((s) => !!s.warning);

  /**
   * Check if any suggestions require doctor reassignment
   */
  const hasReassignRequired = suggestions.some((s) => s.requiresReassign === true);

  return {
    suggestions,
    summary,
    isLoading,
    error,
    totalItemsProcessed,
    successfulSuggestions,
    failedItems,
    generateSchedule,
    clearSuggestions,
    retry,
    hasWarnings,
    hasReassignRequired,
    lastRequest,
  };
};

