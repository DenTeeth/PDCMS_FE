"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Award, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { getFeedbackStatisticsByDoctor, DoctorStatistics } from '@/services/appointmentFeedbackService';
import { toast } from 'sonner';

interface FeedbacksTabProps {
  startDate: string;
  endDate: string;
}

export function FeedbacksTab({ startDate, endDate }: FeedbacksTabProps) {
  const [doctors, setDoctors] = useState<DoctorStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorStatistics();
  }, [startDate, endDate]);

  const fetchDoctorStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getFeedbackStatisticsByDoctor({
        startDate,
        endDate,
        top: 10,
        sortBy: 'rating',
      });
      
      setDoctors(response.doctors || []);
    } catch (err: any) {
      console.error('Error fetching doctor statistics:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
      toast.error('Không thể tải thống kê đánh giá bác sĩ');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateOverallStats = () => {
    if (doctors.length === 0) {
      return { totalDoctors: 0, avgRating: 0, totalFeedbacks: 0, topRatedCount: 0 };
    }
    
    const totalDoctors = doctors.length;
    const avgRating = doctors.reduce((sum, d) => sum + d.statistics.averageRating, 0) / totalDoctors;
    const totalFeedbacks = doctors.reduce((sum, d) => sum + d.statistics.totalFeedbacks, 0);
    const topRatedCount = doctors.filter(d => d.statistics.averageRating >= 4.5).length;

    return { totalDoctors, avgRating, totalFeedbacks, topRatedCount };
  };

  const stats = calculateOverallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600">Đang tải thống kê đánh giá...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={fetchDoctorStatistics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Đánh giá & Góp ý</h2>
          <p className="text-muted-foreground">
            Top bác sĩ có rating cao nhất từ {startDate} đến {endDate}
          </p>
        </div>
        <Award className="h-8 w-8 text-yellow-500" />
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor, index) => (
          <Card key={doctor.employeeId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={doctor.avatar || undefined} alt={doctor.employeeName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getInitials(doctor.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{doctor.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  </div>
                </div>
                {index === 0 && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    <Award className="h-3 w-3 mr-1" />
                    Top 1
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="space-y-2">
                {renderStars(doctor.statistics.averageRating)}
                <p className="text-sm text-muted-foreground">
                  {doctor.statistics.totalFeedbacks} đánh giá
                </p>
              </div>

              {/* Top Tags */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Tags phổ biến:</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.statistics.topTags.slice(0, 3).map((tag) => (
                    <Badge key={tag.tag} variant="outline" className="text-xs">
                      {tag.tag} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recent Comment */}
              {doctor.statistics.recentComments && doctor.statistics.recentComments.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-semibold">Đánh giá gần đây:</p>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{doctor.statistics.recentComments[0].patientName}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(doctor.statistics.recentComments[0].rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic line-clamp-2">
                      "{doctor.statistics.recentComments[0].comment}"
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tổng quan đánh giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {stats.totalFeedbacks}
              </p>
              <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Rating trung bình</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.totalDoctors}</p>
              <p className="text-sm text-muted-foreground">Bác sĩ được đánh giá</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{stats.topRatedCount}</p>
              <p className="text-sm text-muted-foreground">Bác sĩ rating ≥ 4.5</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
