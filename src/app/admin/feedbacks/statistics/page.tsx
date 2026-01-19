"use client";


import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getFeedbackStatistics } from "@/services/appointmentFeedbackService";
import { Star, TrendingUp, Award, Tag, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackStatisticsPage() {
  const [employeeCode, setEmployeeCode] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<{
    employeeCode?: string;
    fromDate?: string;
    toDate?: string;
  }>({});

  // Fetch statistics
  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["feedbackStatistics", appliedFilters],
    queryFn: () =>
      getFeedbackStatistics({
        startDate: appliedFilters.fromDate,
        endDate: appliedFilters.toDate,
      }),
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      employeeCode: employeeCode || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setEmployeeCode("");
    setFromDate("");
    setToDate("");
    setAppliedFilters({});
  };

  // Calculate percentage for rating distribution
  const getRatingPercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <ProtectedRoute
      requiredPermissions={["VIEW_FEEDBACK"]}
      requireAll={false}
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Thống kê đánh giá</h1>
            <p className="text-muted-foreground mt-1">
              Phân tích và thống kê đánh giá từ bệnh nhân
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mã bác sĩ (tùy chọn)
                </label>
                <Input
                  placeholder="Nhập mã bác sĩ..."
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Áp dụng</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Đang tải thống kê...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-destructive">Không thể tải thống kê</p>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : statistics ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Feedbacks */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng số đánh giá
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statistics.totalFeedbacks}
                  </div>
                </CardContent>
              </Card>

              {/* Average Rating */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Điểm trung bình
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold">
                      {statistics.averageRating.toFixed(2)}
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(statistics.averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = Number(statistics.ratingDistribution[rating.toString() as keyof typeof statistics.ratingDistribution]) || 0;
                  const percentage = getRatingPercentage(
                    count,
                    Number(statistics.totalFeedbacks)
                  );
                  return (
                    <div key={rating} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rating} sao</span>
                        </div>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Top Tags */}
            {statistics.topTags && statistics.topTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags phổ biến
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {statistics.topTags.map((tagCount: any, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        {tagCount.tag} ({tagCount.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
