'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faEye,
  faSort,
  faFilter,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { DentistRating } from '@/types/feedback';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DentistRatingsProps {
  data: DentistRating[];
  onViewReviews: (dentistCode: string) => void;
}

export default function DentistRatings({ data, onViewReviews }: DentistRatingsProps) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort data
  const filteredData = data
    .filter((dentist) => {
      const matchesSearch = dentist.dentistName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === '4+' && dentist.averageRating >= 4) ||
        (ratingFilter === '3-4' && dentist.averageRating >= 3 && dentist.averageRating < 4) ||
        (ratingFilter === '<3' && dentist.averageRating < 3);
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortBy === 'rating') {
        return (a.averageRating - b.averageRating) * multiplier;
      } else {
        return (a.totalReviews - b.totalReviews) * multiplier;
      }
    });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-blue-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return 'default';
    if (rating >= 4) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Đánh giá nha sĩ</CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Tìm kiếm nha sĩ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đánh giá</SelectItem>
                <SelectItem value="4+">4+ Sao</SelectItem>
                <SelectItem value="3-4">3-4 Sao</SelectItem>
                <SelectItem value="<3">&lt;3 Sao</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Theo xếp hạng</SelectItem>
                <SelectItem value="reviews">Theo đánh giá</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
              }
            >
              <FontAwesomeIcon icon={faSort} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nha sĩ</TableHead>
                <TableHead>Đánh giá trung bình</TableHead>
                <TableHead>Tổng số đánh giá</TableHead>
                <TableHead>Phân phối</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((dentist) => (
                <TableRow key={dentist.dentistCode}>
                  <TableCell className="font-medium">
                    {dentist.dentistName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          dentist.averageRating
                        )}`}
                      >
                        {dentist.averageRating.toFixed(1)}
                      </span>
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-yellow-500"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRatingBadge(dentist.averageRating)}>
                      {dentist.totalReviews} đánh giá
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div
                          key={star}
                          className="text-xs text-gray-600"
                          title={`${star}★: ${dentist.ratingDistribution[star as keyof typeof dentist.ratingDistribution]}`}
                        >
                          {star}★:{' '}
                          {
                            dentist.ratingDistribution[
                              star as keyof typeof dentist.ratingDistribution
                            ]
                          }
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewReviews(dentist.dentistCode)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Xem đánh giá
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy nha sĩ nào phù hợp với bộ lọc của bạn
          </div>
        )}
      </CardContent>
    </Card>
  );
}
