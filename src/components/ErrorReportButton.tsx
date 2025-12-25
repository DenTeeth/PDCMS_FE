/**
 * Error Report Button Component
 * Shows a button to copy/download error details when an error occurs
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { ErrorReport, copyErrorToClipboard, downloadErrorReport } from '@/utils/errorReporter';

interface ErrorReportButtonProps {
    error: ErrorReport;
    className?: string;
}

export function ErrorReportButton({ error, className }: ErrorReportButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyErrorToClipboard(error);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        downloadErrorReport(error);
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
            >
                {copied ? (
                    <>
                        <Check className="h-4 w-4 text-green-600" />
                        Đã copy!
                    </>
                ) : (
                    <>
                        <Copy className="h-4 w-4" />
                        Copy lỗi
                    </>
                )}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                Tải xuống
            </Button>
        </div>
    );
}
