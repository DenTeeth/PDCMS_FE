"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFeedback, CreateFeedbackRequest } from "@/services/appointmentFeedbackService";

interface AppointmentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentCode: string;
  doctorName: string;
  onSuccess?: () => void;
}

// Các tag gợi ý cho feedback
const SUGGESTED_TAGS = [
  "Bác sĩ tận tâm",
  "Kỹ thuật tốt",
  "Không đau",
  "Giải thích rõ ràng",
  "Thân thiện",
  "Chuyên nghiệp",
  "Đúng giờ",
  "Tư vấn chi tiết",
  "Phòng khám sạch sẽ",
  "Giá cả hợp lý",
];

export function AppointmentFeedbackModal({
  isOpen,
  onClose,
  appointmentCode,
  doctorName,
  onSuccess,
}: AppointmentFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateFeedbackRequest) => createFeedback(data),
    onSuccess: () => {
      toast.success("Đánh giá của bạn đã được gửi thành công!");
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentCode] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Không thể gửi đánh giá";
      toast.error(errorMessage);
    },
  });

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    setSelectedTags([]);
    onClose();
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      // Maximum 10 tags
      if (prev.length >= 10) {
        toast.warning("Bạn chỉ có thể chọn tối đa 10 tags");
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (comment.length > 1000) {
      toast.error("Nội dung đánh giá không được vượt quá 1000 ký tự");
      return;
    }

    const feedbackData: CreateFeedbackRequest = {
      appointmentCode,
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };

    mutation.mutate(feedbackData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Đánh giá lịch hẹn</DialogTitle>
          <DialogDescription>
            Đánh giá của bạn về bác sĩ <strong>{doctorName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium">Mức độ hài lòng</p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && "Xuất sắc"}
                {rating === 4 && "Tốt"}
                {rating === 3 && "Trung bình"}
                {rating === 2 && "Tệ"}
                {rating === 1 && "Rất tệ"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Nhận xét (không bắt buộc)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000
            </p>
          </div>

          {/* Suggested Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags gợi ý (tối đa 10 tags)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Đã chọn {selectedTags.length}/10 tags
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || rating === 0}>
            {mutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
