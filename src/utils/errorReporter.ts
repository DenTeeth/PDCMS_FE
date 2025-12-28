/**
 * Error Reporter Utility
 * Captures and formats errors for reporting to backend team
 */

export interface ErrorReport {
    timestamp: string;
    page: string;
    userAgent: string;
    error: {
        message: string;
        stack?: string;
        name: string;
    };
    apiError?: {
        url: string;
        method: string;
        status: number;
        statusText: string;
        response: any;
        headers: any;
    };
    context?: any;
}

/**
 * Capture and format error for reporting
 */
export function captureError(
    error: any,
    context?: {
        page?: string;
        action?: string;
        additionalInfo?: any;
    }
): ErrorReport {
    const report: ErrorReport = {
        timestamp: new Date().toISOString(),
        page: context?.page || window.location.pathname,
        userAgent: navigator.userAgent,
        error: {
            message: error.message || 'Unknown error',
            stack: error.stack,
            name: error.name || 'Error',
        },
        context: context?.additionalInfo,
    };

    // If it's an Axios error, capture API details
    if (error.response) {
        report.apiError = {
            url: error.config?.url || 'Unknown URL',
            method: error.config?.method?.toUpperCase() || 'Unknown',
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
            headers: error.response.headers,
        };
    }

    return report;
}

/**
 * Format error report as markdown for easy sharing
 */
export function formatErrorAsMarkdown(report: ErrorReport): string {
    let markdown = `# 🐛 Error Report\n\n`;
    markdown += `**Timestamp:** ${report.timestamp}\n`;
    markdown += `**Page:** ${report.page}\n`;
    markdown += `**User Agent:** ${report.userAgent}\n\n`;

    markdown += `## Error Details\n\n`;
    markdown += `**Type:** ${report.error.name}\n`;
    markdown += `**Message:** ${report.error.message}\n\n`;

    if (report.error.stack) {
        markdown += `**Stack Trace:**\n\`\`\`\n${report.error.stack}\n\`\`\`\n\n`;
    }

    if (report.apiError) {
        markdown += `## API Error\n\n`;
        markdown += `**Endpoint:** \`${report.apiError.method} ${report.apiError.url}\`\n`;
        markdown += `**Status:** ${report.apiError.status} ${report.apiError.statusText}\n\n`;
        markdown += `**Response:**\n\`\`\`json\n${JSON.stringify(report.apiError.response, null, 2)}\n\`\`\`\n\n`;
    }

    if (report.context) {
        markdown += `## Additional Context\n\n`;
        markdown += `\`\`\`json\n${JSON.stringify(report.context, null, 2)}\n\`\`\`\n`;
    }

    return markdown;
}

/**
 * Copy error report to clipboard
 */
export async function copyErrorToClipboard(report: ErrorReport): Promise<boolean> {
    try {
        const markdown = formatErrorAsMarkdown(report);
        await navigator.clipboard.writeText(markdown);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}

/**
 * Download error report as file
 */
export function downloadErrorReport(report: ErrorReport, filename?: string): void {
    const markdown = formatErrorAsMarkdown(report);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `error-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Log error to console with formatting
 */
export function logError(report: ErrorReport): void {
    console.group('🐛 Error Report');
    console.log('Timestamp:', report.timestamp);
    console.log('Page:', report.page);
    console.error('Error:', report.error);
    if (report.apiError) {
        console.group('API Error');
        console.log('Endpoint:', `${report.apiError.method} ${report.apiError.url}`);
        console.log('Status:', report.apiError.status, report.apiError.statusText);
        console.log('Response:', report.apiError.response);
        console.groupEnd();
    }
    if (report.context) {
        console.log('Context:', report.context);
    }
    console.groupEnd();
}
