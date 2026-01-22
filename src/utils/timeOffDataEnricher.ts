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
        if (!typeId) {
            return 'N/A';
        }

        // Try to find in timeOffTypes array first
        if (timeOffTypes && timeOffTypes.length > 0) {
            // Try exact match by typeId first
            const type = timeOffTypes.find(t => t.typeId === typeId);
            if (type?.typeName) {
                return type.typeName;
            }

            // Try matching by typeCode as fallback (in case backend uses typeCode instead of typeId)
            const typeByCode = timeOffTypes.find(t => t.typeCode === typeId);
            if (typeByCode?.typeName) {
                return typeByCode.typeName;
            }
        }

        // Fallback: Map common type codes to Vietnamese names
        return this.formatTypeCodeToName(typeId);
    }

    /**
     * Format type code to readable name (fallback when type not found in list)
     * This is a last resort - ideally all types should be in the timeOffTypes array
     */
    private static formatTypeCodeToName(typeCode: string): string {
        // If not found in timeOffTypes array, format the code to a readable name
        // Convert UNPAID_PERSONAL -> Unpaid Personal
        // This is just a fallback - the real data should come from timeOffTypes array
        return typeCode
            .split('_')
            .map(word => {
                // Capitalize first letter of each word
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
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
     * @param startDate - Start date in YYYY-MM-DD format
     * @param endDate - End date in YYYY-MM-DD format
     * @param hasWorkShiftId - Whether the request has a workShiftId (half-day shift)
     */
    private static calculateTotalDays(
        startDate: string,
        endDate: string,
        hasWorkShiftId: boolean
    ): number {
        try {
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T00:00:00');

            // Check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Invalid date format:', { startDate, endDate });
                }
                return 0;
            }

            // Full days difference + 1 (inclusive)
            const days = differenceInDays(end, start) + 1;

            // If it's a half-day shift AND startDate === endDate, it's 0.5 days
            // If it's a half-day shift but dates are different, calculate normally
            // (each day is 0.5, so total = days * 0.5)
            if (hasWorkShiftId) {
                if (days === 1) {
                    // Single day half-day request
                    return 0.5;
                } else {
                    // Multiple days half-day request (each day is 0.5)
                    return days * 0.5;
                }
            }

            // Full-day request
            return days;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error calculating total days:', error, { startDate, endDate, hasWorkShiftId });
            }
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
