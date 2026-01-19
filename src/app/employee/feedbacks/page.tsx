"use client";



import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentFeedbackDisplay } from "@/components/appointments/AppointmentFeedbackDisplay";
import { getFeedbacksList } from "@/services/appointmentFeedbackService";
import { FeedbackListFilters } from "@/types/appointmentFeedback";
import { Star, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminFeedbackListPage() {
  // Filters state
  const [filters, setFilters] = useState<FeedbackListFilters>({
    page: 0,
    size: 20,
    sort: "createdAt,desc",
  });

  const [searchEmployeeCode, setSearchEmployeeCode] = useState("");
  const [searchPatientCode, setSearchPatientCode] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Fetch feedbacks
  const {
    data: feedbacksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["feedbacks", filters],
    queryFn: () => getFeedbacksList(filters),
  });

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      employeeCode: searchEmployeeCode || undefined,
      patientCode: searchPatientCode || undefined,
      rating: ratingFilter === "all" ? undefined : parseInt(ratingFilter),
      page: 0, // Reset to first page
    }));
  };

  const handleClearFilters = () => {
    setSearchEmployeeCode("");
    setSearchPatientCode("");
    setRatingFilter("all");
    setFilters({
      page: 0,
      size: 20,
      sort: "createdAt,desc",
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
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
            <h1 className="text-3xl font-bold">Danh sách đánh giá</h1>
            <p className="text-muted-foreground mt-1">
              Xem và quản lý đánh giá từ bệnh nhân
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Số sao
                </label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="5">5 sao</SelectItem>
                    <SelectItem value="4">4 sao</SelectItem>
                    <SelectItem value="3">3 sao</SelectItem>
                    <SelectItem value="2">2 sao</SelectItem>
                    <SelectItem value="1">1 sao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Code Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mã bác sĩ
                </label>
                <Input
                  placeholder="Nhập mã bác sĩ..."
                  value={searchEmployeeCode}
                  onChange={(e) => setSearchEmployeeCode(e.target.value)}
                />
              </div>

              {/* Patient Code Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mã bệnh nhân
                </label>
                <Input
                  placeholder="Nhập mã bệnh nhân..."
                  value={searchPatientCode}
                  onChange={(e) => setSearchPatientCode(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="gap-2">
                <Search className="h-4 w-4" />
                Áp dụng
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-destructive">Không thể tải danh sách đánh giá</p>
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
        ) : feedbacksData && feedbacksData.content.length > 0 ? (
          <>
            {/* Results Info */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hiển thị {feedbacksData.content.length} / {feedbacksData.totalElements} kết quả
              </p>
              <p className="text-sm text-muted-foreground">
                Trang {feedbacksData.number + 1} / {feedbacksData.totalPages}
              </p>
            </div>

            {/* Feedback List */}
            <div className="grid gap-4">
              {feedbacksData.content.map((feedback: any) => (
                <AppointmentFeedbackDisplay
                  key={feedback.feedbackId}
                  feedback={feedback}
                  showAppointmentInfo={true}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={feedbacksData.number === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="text-sm">
                Trang {feedbacksData.number + 1} / {feedbacksData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={feedbacksData.number >= feedbacksData.totalPages - 1}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Không tìm thấy đánh giá
                </h3>
                <p className="text-muted-foreground">
                  Thử thay đổi bộ lọc hoặc kiểm tra lại sau
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
