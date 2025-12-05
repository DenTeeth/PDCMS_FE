/**
 * Time-Off Request Diagnostic Tool
 * Helps debug API response structure and identify data issues
 */

import { TimeOffRequest } from '@/types/timeOff';

export class TimeOffDiagnostics {
    /**
     * Validate if a time-off request has the expected nested structure
     */
    static validateStructure(request: any): {
        isValid: boolean;
        issues: string[];
        warnings: string[];
    } {
        const issues: string[] = [];
        const warnings: string[] = [];

        // Check if request exists
        if (!request) {
            issues.push('Request is null or undefined');
            return { isValid: false, issues, warnings };
        }

        // Check required fields
        if (!request.requestId) issues.push('Missing requestId');
        if (!request.status) issues.push('Missing status');
        if (!request.timeOffTypeId) issues.push('Missing timeOffTypeId');
        if (!request.startDate) issues.push('Missing startDate');
        if (!request.endDate) issues.push('Missing endDate');
        if (!request.reason) issues.push('Missing reason');
        if (!request.requestedAt) issues.push('Missing requestedAt');

        // Check nested employee object
        if (!request.employee) {
            issues.push('Missing employee object (flat structure detected)');
            if (request.employeeId) {
                warnings.push('Found employeeId - backend using old flat structure');
            }
            if (request.employeeName) {
                warnings.push('Found employeeName - backend using old flat structure');
            }
        } else {
            // Validate employee object structure
            if (!request.employee.employeeId) issues.push('employee.employeeId is missing');
            if (!request.employee.employeeCode) warnings.push('employee.employeeCode is missing');
            if (!request.employee.fullName) warnings.push('employee.fullName is missing');
        }

        // Check requestedBy object
        if (!request.requestedBy) {
            issues.push('Missing requestedBy object (flat structure detected)');
            if (request.requestedByName) {
                warnings.push('Found requestedByName - backend using old flat structure');
            }
        } else {
            if (!request.requestedBy.employeeId) issues.push('requestedBy.employeeId is missing');
            if (!request.requestedBy.fullName) warnings.push('requestedBy.fullName is missing');
        }

        // Check approvedBy if status is APPROVED
        if (request.status === 'APPROVED') {
            if (!request.approvedBy) {
                warnings.push('Status is APPROVED but approvedBy is missing');
            } else if (!request.approvedBy.employeeId) {
                warnings.push('approvedBy exists but employeeId is missing');
            }
        }

        // Check slot vs workShift
        if (request.slotId) {
            warnings.push('Found slotId - backend should use workShiftId instead');
        }
        if (request.slotName) {
            warnings.push('Found slotName - backend should use workShiftName instead');
        }

        return {
            isValid: issues.length === 0,
            issues,
            warnings
        };
    }

    /**
     * Log detailed structure analysis to console
     */
    static logStructure(request: any, label: string = 'Time-Off Request') {
        console.group(`� ${label} Structure Analysis`);

        const validation = this.validateStructure(request);

        console.log(' Raw Data:', JSON.stringify(request, null, 2));
        console.log(' Valid:', validation.isValid);

        if (validation.issues.length > 0) {
            console.error(' Issues:', validation.issues);
        }

        if (validation.warnings.length > 0) {
            console.warn(' Warnings:', validation.warnings);
        }

        // Log structure summary
        console.log(' Structure Summary:', {
            hasNestedEmployee: !!request?.employee,
            hasNestedRequestedBy: !!request?.requestedBy,
            hasNestedApprovedBy: !!request?.approvedBy,
            usesFlatStructure: !!(request?.employeeId || request?.employeeName),
            usesWorkShift: !!(request?.workShiftId || request?.workShiftName),
            usesOldSlot: !!(request?.slotId || request?.slotName)
        });

        console.groupEnd();
    }

    /**
     * Compare expected vs actual structure
     */
    static compareStructures(request: any): string {
        const expected = {
            requestId: 'string',
            employee: {
                employeeId: 'number',
                employeeCode: 'string',
                firstName: 'string',
                lastName: 'string',
                fullName: 'string'
            },
            requestedBy: {
                employeeId: 'number',
                employeeCode: 'string',
                fullName: 'string'
            },
            timeOffTypeId: 'string',
            timeOffTypeName: 'string',
            startDate: 'string',
            endDate: 'string',
            workShiftId: 'string | null',
            workShiftName: 'string | null',
            totalDays: 'number',
            reason: 'string',
            status: 'TimeOffStatus',
            requestedAt: 'string',
            approvedBy: 'EmployeeInfo | null',
            approvedAt: 'string | null'
        };

        const actual = this.getActualStructure(request);

        return `Expected Structure:\n${JSON.stringify(expected, null, 2)}\n\nActual Structure:\n${JSON.stringify(actual, null, 2)}`;
    }

    /**
     * Get the actual structure of a request object
     */
    private static getActualStructure(obj: any, depth: number = 2): any {
        if (depth === 0 || obj === null || obj === undefined) {
            return typeof obj;
        }

        if (Array.isArray(obj)) {
            return obj.length > 0 ? [this.getActualStructure(obj[0], depth - 1)] : [];
        }

        if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result[key] = this.getActualStructure(obj[key], depth - 1);
                }
            }
            return result;
        }

        return typeof obj;
    }

    /**
     * Generate migration suggestions based on current structure
     */
    static getMigrationSuggestions(request: any): string[] {
        const suggestions: string[] = [];
        const validation = this.validateStructure(request);

        if (!request?.employee && request?.employeeId) {
            suggestions.push(
                ' Backend Migration Needed:\n' +
                '   Change from: { employeeId: number, employeeName: string }\n' +
                '   Change to:   { employee: { employeeId, employeeCode, firstName, lastName, fullName } }'
            );
        }

        if (!request?.requestedBy && request?.requestedByName) {
            suggestions.push(
                ' Backend Migration Needed:\n' +
                '   Change from: { requestedBy: number, requestedByName: string }\n' +
                '   Change to:   { requestedBy: { employeeId, fullName } }'
            );
        }

        if (request?.slotId || request?.slotName) {
            suggestions.push(
                ' Backend Migration Needed:\n' +
                '   Change from: { slotId: string, slotName: string }\n' +
                '   Change to:   { workShiftId: string, workShiftName: string }'
            );
        }

        if (validation.issues.length > 0) {
            suggestions.push(
                ' Critical Issues Found:\n' +
                validation.issues.map(issue => `   - ${issue}`).join('\n')
            );
        }

        return suggestions;
    }

    /**
     * Auto-fix common structure issues (frontend adaptation)
     */
    static adaptLegacyStructure(request: any): TimeOffRequest | null {
        if (!request) return null;

        try {
            return {
                requestId: request.requestId,
                employee: request.employee || {
                    employeeId: request.employeeId,
                    employeeCode: request.employeeCode || `EMP${request.employeeId}`,
                    firstName: request.firstName || '',
                    lastName: request.lastName || '',
                    fullName: request.employeeName || `Employee ${request.employeeId}`
                },
                requestedBy: request.requestedBy || {
                    employeeId: request.requestedBy || 0,
                    employeeCode: '',
                    firstName: '',
                    lastName: '',
                    fullName: request.requestedByName || 'Unknown'
                },
                timeOffTypeId: request.timeOffTypeId,
                timeOffTypeName: request.timeOffTypeName,
                startDate: request.startDate,
                endDate: request.endDate,
                workShiftId: request.workShiftId || request.slotId || null,
                workShiftName: request.workShiftName || request.slotName || null,
                totalDays: request.totalDays,
                reason: request.reason,
                status: request.status,
                requestedAt: request.requestedAt,
                approvedBy: request.approvedBy || (request.approvedByName ? {
                    employeeId: request.approvedBy || 0,
                    employeeCode: '',
                    firstName: '',
                    lastName: '',
                    fullName: request.approvedByName
                } : null),
                approvedAt: request.approvedAt || null,
                rejectedReason: request.rejectedReason,
                cancellationReason: request.cancellationReason
            };
        } catch (error) {
            console.error(' Failed to adapt legacy structure:', error);
            return null;
        }
    }
}
