/**
 * Treatment Plan Status Utilities
 * 
 * Purpose: Centralized logic for calculating phase statuses
 * 
 * Strategy:
 * - Trust BE status if available and valid
 * - Calculate phase status from items as fallback (for phase-level display)
 * - Note: Plan status is now auto-completed by BE (Issue #51 RESOLVED)
 * - See: docs/ISSUE_51.md for plan status auto-completion details
 */

import { PhaseDetailDTO, ItemDetailDTO, TreatmentPlanStatus } from '@/types/treatmentPlan';

/**
 * Calculate phase status from items
 * 
 * Logic:
 * - If BE status is COMPLETED → trust BE
 * - If all items are COMPLETED or SKIPPED → return COMPLETED
 * - Otherwise → return BE status or PENDING
 */
export function calculatePhaseStatus(phase: PhaseDetailDTO): string {
  // Trust BE if already COMPLETED
  if (phase.status?.toUpperCase() === 'COMPLETED') {
    return phase.status;
  }

  // Calculate from items if available
  if (phase.items && phase.items.length > 0) {
    const allItemsDone = phase.items.every(
      (item) => item.status === 'COMPLETED' || item.status === 'SKIPPED'
    );

    if (allItemsDone) {
      return 'COMPLETED';
    }
  }

  // Fallback to BE status
  return phase.status || 'PENDING';
}

/**
 * Calculate plan status from phases
 * 
 * NOTE: This function is kept for backward compatibility but is no longer needed for plan status.
 * Issue #51 RESOLVED: BE now auto-completes plan status when loading detail (API 5.2).
 * This function may still be useful for phase-level calculations or legacy code.
 * 
 * Logic:
 * - If BE status is COMPLETED or CANCELLED → trust BE
 * - If all phases are COMPLETED → return COMPLETED
 * - Otherwise → return BE status or NULL
 * 
 * @deprecated Plan status is now auto-completed by BE. Use plan.status directly.
 */
export function calculatePlanStatus(
  planStatus: TreatmentPlanStatus | null,
  phases: PhaseDetailDTO[]
): TreatmentPlanStatus | 'NULL' {
  // Trust BE if already COMPLETED or CANCELLED
  if (planStatus === TreatmentPlanStatus.COMPLETED || planStatus === TreatmentPlanStatus.CANCELLED) {
    return planStatus;
  }

  // If no phases, use BE status
  if (!phases || phases.length === 0) {
    return planStatus || 'NULL';
  }

  // Calculate phase statuses
  const phaseStatuses = phases.map((phase) => calculatePhaseStatus(phase));

  // Check if all phases are COMPLETED
  const allPhasesCompleted = phaseStatuses.every(
    (status) => status.toUpperCase() === 'COMPLETED'
  );

  if (allPhasesCompleted) {
    return TreatmentPlanStatus.COMPLETED;
  }

  // Fallback to BE status
  return planStatus || 'NULL';
}

/**
 * Check if phase is completed (using calculated status)
 */
export function isPhaseCompleted(phase: PhaseDetailDTO): boolean {
  return calculatePhaseStatus(phase).toUpperCase() === 'COMPLETED';
}

/**
 * Check if plan is completed (using calculated status)
 */
export function isPlanCompleted(
  planStatus: TreatmentPlanStatus | null,
  phases: PhaseDetailDTO[]
): boolean {
  return calculatePlanStatus(planStatus, phases) === TreatmentPlanStatus.COMPLETED;
}

/**
 * Get phase progress percentage
 */
export function getPhaseProgress(phase: PhaseDetailDTO): number {
  if (!phase.items || phase.items.length === 0) {
    return 0;
  }

  const completedItems = phase.items.filter(
    (item) => item.status === 'COMPLETED'
  ).length;

  return (completedItems / phase.items.length) * 100;
}

/**
 * Get plan progress percentage (based on completed phases)
 */
export function getPlanProgress(phases: PhaseDetailDTO[]): number {
  if (!phases || phases.length === 0) {
    return 0;
  }

  const completedPhases = phases.filter((phase) => isPhaseCompleted(phase)).length;

  return (completedPhases / phases.length) * 100;
}

/**
 * Get plan progress percentage (based on completed items across all phases)
 */
export function getPlanProgressByItems(phases: PhaseDetailDTO[]): number {
  if (!phases || phases.length === 0) {
    return 0;
  }

  let totalItems = 0;
  let completedItems = 0;

  phases.forEach((phase) => {
    if (phase.items) {
      totalItems += phase.items.length;
      completedItems += phase.items.filter(
        (item) => item.status === 'COMPLETED'
      ).length;
    }
  });

  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
}

