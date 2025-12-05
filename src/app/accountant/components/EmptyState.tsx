import { FileText } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export default function EmptyState({
    title = 'Không có dữ liệu',
    description = 'Chưa có dữ liệu để hiển thị',
    icon
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-gray-400">
                {icon || <FileText className="h-16 w-16" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 max-w-sm">{description}</p>
        </div>
    );
}
