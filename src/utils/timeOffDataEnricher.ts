/**
 * Time-Off Request Data Enricher
 * Enriches API responses with missing data (timeOffTypeName, workShiftName, totalDays)
 */

import { TimeOffRequest } from '@/types/timeOff';
import { TimeOffType } from '@/types/timeOff';
import { WorkShift } from '@/types/workShift';
import { differenceInDays } from 'date-fns';
import { formatTimeToHHMM } from '@/lib/utils';

export class TimeOffDataEnricher {
    /**
     * Enrich a single time-off request with missing data
     */
    static enrichRequest(
        request: TimeOffRequest,
        timeOffTypes: TimeOffType[],
        workShifts: WorkShift[]
    ): TimeOffRequest {
        return {
            ...request,
            // Add timeOffTypeName from timeOffTypes array
            timeOffTypeName: this.getTimeOffTypeName(request.timeOffTypeId, timeOffTypes),
            // Add workShiftName from workShifts array
            workShiftName: request.workShiftId
                ? this.getWorkShiftName(request.workShiftId, workShifts)
                : null,
            // Calculate totalDays
            totalDays: this.calculateTotalDays(request.startDate, request.endDate, !!request.workShiftId)
        };
    }

    /**
     * Enrich multiple time-off requests
     */
    static enrichRequests(
        requests: TimeOffRequest[],
        timeOffTypes: TimeOffType[],
        workShifts: WorkShift[]
    ): TimeOffRequest[] {
        return requests.map(request =>
            this.enrichRequest(request, timeOffTypes, workShifts)
        );
    }

    /**
     * Get time-off type name by ID
     */
    private static getTimeOffTypeName(
        typeId: string,
        timeOffTypes: TimeOffType[]
    ): string {
        const type = timeOffTypes.find(t => t.typeId === typeId);
        return type?.typeName || typeId; // Fallback to ID if not found
    }

    /**
     * Get work shift name by ID
     */
    private static getWorkShiftName(
        shiftId: string,
        workShifts: WorkShift[]
    ): string | null {
        const shift = workShifts.find(s => s.workShiftId === shiftId);
        return shift?.shiftName || null;
    }

    /**
     * Calculate total days between start and end date
     */
    private static calculateTotalDays(
        startDate: string,
        endDate: string,
        isHalfDay: boolean
    ): number {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Full days difference + 1 (inclusive)
            const days = differenceInDays(end, start) + 1;

            // If it's a half-day shift, divide by 2
            return isHalfDay ? 0.5 : days;
        } catch (error) {
            console.error('Error calculating total days:', error);
            return 0;
        }
    }

    /**
     * Get a human-readable shift display name with time
     */
    static getShiftDisplay(
        shiftId: string | null,
        workShifts: WorkShift[]
    ): string | null {
        if (!shiftId) return null;

        const shift = workShifts.find(s => s.workShiftId === shiftId);
        if (!shift) return shiftId;

        return `${shift.shiftName} (${formatTimeToHHMM(shift.startTime)} - ${formatTimeToHHMM(shift.endTime)})`;
    }
}
