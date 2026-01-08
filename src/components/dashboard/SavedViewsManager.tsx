'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardSavedView } from '@/types/dashboard';
import { Save, Eye, Trash2, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SavedViewsManagerProps {
  views: DashboardSavedView[];
  onSaveView: (view: Omit<DashboardSavedView, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onLoadView: (view: DashboardSavedView) => void;
  onDeleteView: (viewId: number) => void;
  onSetDefaultView: (viewId: number) => void;
  currentFilters: any;
  currentDateRange: { startDate: string; endDate: string };
}

export const SavedViewsManager: React.FC<SavedViewsManagerProps> = ({
  views,
  onSaveView,
  onLoadView,
  onDeleteView,
  onSetDefaultView,
  currentFilters,
  currentDateRange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');

  const handleSaveView = () => {
    if (!viewName.trim()) return;

    onSaveView({
      name: viewName,
      description: viewDescription || undefined,
      filters: currentFilters,
      dateRange: currentDateRange,
      isDefault: false,
    });

    setViewName('');
    setViewDescription('');
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Chế độ xem đã lưu
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Lưu chế độ xem hiện tại
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lưu chế độ xem mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="view-name">Tên chế độ xem *</Label>
                  <Input
                    id="view-name"
                    placeholder="VD: Báo cáo tháng 1"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="view-description">Mô tả (tùy chọn)</Label>
                  <Input
                    id="view-description"
                    placeholder="Mô tả ngắn về chế độ xem này"
                    value={viewDescription}
                    onChange={(e) => setViewDescription(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p className="font-medium mb-1">Sẽ lưu:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Bộ lọc hiện tại</li>
                    <li>Khoảng thời gian: {currentDateRange.startDate} - {currentDateRange.endDate}</li>
                    <li>Cấu hình hiển thị</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveView} disabled={!viewName.trim()}>
                  Lưu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {views.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Chưa có chế độ xem nào được lưu</p>
            <p className="text-sm">Lưu cấu hình hiện tại để sử dụng lại sau</p>
          </div>
        ) : (
          <div className="space-y-2">
            {views.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {view.name}
                      {view.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h4>
                  </div>
                  {view.description && (
                    <p className="text-xs text-gray-600 mt-1">{view.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {view.dateRange.startDate} - {view.dateRange.endDate}
                    </span>
                    <span>
                      Tạo: {format(new Date(view.createdAt), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadView(view)}
                    title="Áp dụng chế độ xem này"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!view.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetDefaultView(view.id)}
                      title="Đặt làm mặc định"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteView(view.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Xóa chế độ xem"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
