'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';
import { Specialization } from '@/types/specialization';
import { specializationService } from '@/services/specializationService';
import { toast } from 'sonner';

export default function SpecializationsPage() {
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSpecializations();
    }, []);

    const fetchSpecializations = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching specializations...');
            console.log('🔑 Access Token:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');

            const data = await specializationService.getAll();
            console.log('✅ Specializations data:', data);
            console.log('📊 Is array?', Array.isArray(data));
            console.log('📊 Length:', data?.length);
            setSpecializations(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('❌ Failed to fetch specializations:', error);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error data:', error.response?.data);

            if (error.response?.status === 401) {
                toast.error('Please login first to view specializations');
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch specializations');
            }
            setSpecializations([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading specializations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Specializations</h1>
                    <p className="text-gray-600 mt-1">List of medical specializations</p>
                </div>
                {/* <Button onClick={() => toast.info('Create feature coming soon')}>
          <Plus className="h-4 w-4 mr-2" />
          New Specialization
        </Button> */}
            </div>

            {/* Simple Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Specialization Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(specializations || []).map((spec) => (
                                    <tr key={spec.specializationCode} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {spec.specializationCode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {spec.specializationName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {spec.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(spec.createdAt).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                            {/* {spec.createdAt}     */}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                variant={spec.isActive ? 'default' : 'secondary'}
                                                className={
                                                    spec.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }
                                            >
                                                {spec.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty state */}
                    {(!specializations || specializations.length === 0) && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">No specializations found</p>
                            <p className="text-sm mt-1">No data available</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
