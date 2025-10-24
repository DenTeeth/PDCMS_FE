import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: IconDefinition;
    change?: number;
    changeLabel?: string;
    iconColor?: string;
}

export default function KPICard({
    title,
    value,
    icon,
    change,
    changeLabel = 'vs last month',
    iconColor = 'text-blue-600',
}: KPICardProps) {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <FontAwesomeIcon icon={icon} className={`text-2xl ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change !== undefined && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <span
                            className={
                                isPositive
                                    ? 'text-green-600'
                                    : isNegative
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                            }
                        >
                            {isPositive && '+'}{change}%
                        </span>
                        <span>{changeLabel}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
