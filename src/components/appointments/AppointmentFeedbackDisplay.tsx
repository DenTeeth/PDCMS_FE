"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeedbackResponse } from "@/types/appointmentFeedback";
import { formatDateTime } from "@/utils/formatters";

interface AppointmentFeedbackDisplayProps {
  feedback: FeedbackResponse;
  showAppointmentInfo?: boolean; // Show patient/doctor info (for admin view)
}

export function AppointmentFeedbackDisplay({
  feedback,
  showAppointmentInfo = false,
}: AppointmentFeedbackDisplayProps) {
  const { rating, comment, tags, patientName, employeeName, createdAt, appointmentCode } = feedback;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {showAppointmentInfo && (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {getInitials(patientName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-600">{rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          {appointmentCode && (
            <Badge variant="outline" className="font-mono text-xs">
              {appointmentCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show patient/doctor info for admin view */}
        {showAppointmentInfo && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <UserIcon className="h-3.5 w-3.5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bệnh nhân</p>
                <p className="text-sm font-semibold">{patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-full">
                <UserIcon className="h-3.5 w-3.5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bác sĩ</p>
                <p className="text-sm font-semibold">{employeeName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Comment */}
        {comment && (
          <div className="relative pl-4 border-l-4 border-yellow-400/30">
            <p className="text-sm leading-relaxed text-foreground italic">
              "{comment}"
            </p>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Nhãn đánh giá:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Created date */}
        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Đánh giá lúc {formatDateTime(createdAt)}
          </p>
          <Badge variant="outline" className="text-xs">
            ✓ Đã xác thực
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
