'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TodoItem {
    id: string;
    type: 'payment' | 'debt' | 'approval';
    title: string;
    count: number;
    link: string;
    priority: 'high' | 'medium' | 'low';
}

interface Props {
    items: TodoItem[];
}

export default function TodoList({ items }: Props) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Cần Xử Lý
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={item.link}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 hover:shadow-md transition-all ${getPriorityColor(item.priority)}`}
                        >
                            <div className="flex items-center gap-3">
                                {item.priority === 'high' && (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-xs opacity-75">Click để xem chi tiết</p>
                                </div>
                            </div>
                            <div className="text-2xl font-bold">
                                {item.count}
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
