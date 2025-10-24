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
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { ServiceRating } from '@/types/feedback';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ServiceRatingsProps {
  data: ServiceRating[];
  onViewReviews: (serviceCode: string) => void;
}

export default function ServiceRatings({ data, onViewReviews }: ServiceRatingsProps) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredData = data
    .filter((service) => {
      const matchesSearch = service.serviceName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === '4+' && service.averageRating >= 4) ||
        (ratingFilter === '3-4' && service.averageRating >= 3 && service.averageRating < 4) ||
        (ratingFilter === '<3' && service.averageRating < 3);
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
          <CardTitle>Service Ratings</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4+">4+ Stars</SelectItem>
                <SelectItem value="3-4">3-4 Stars</SelectItem>
                <SelectItem value="<3">&lt;3 Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">By Rating</SelectItem>
                <SelectItem value="reviews">By Reviews</SelectItem>
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
                <TableHead>Service Name</TableHead>
                <TableHead>Average Rating</TableHead>
                <TableHead>Total Reviews</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((service) => (
                <TableRow key={service.serviceCode}>
                  <TableCell className="font-medium">
                    {service.serviceName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${getRatingColor(
                          service.averageRating
                        )}`}
                      >
                        {service.averageRating.toFixed(1)}
                      </span>
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-yellow-500"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRatingBadge(service.averageRating)}>
                      {service.totalReviews} reviews
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div
                          key={star}
                          className="text-xs text-gray-600"
                          title={`${star}★: ${service.ratingDistribution[star as keyof typeof service.ratingDistribution]}`}
                        >
                          {star}★:{' '}
                          {
                            service.ratingDistribution[
                              star as keyof typeof service.ratingDistribution
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
                      onClick={() => onViewReviews(service.serviceCode)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      View Reviews
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No services found matching your filters
          </div>
        )}
      </CardContent>
    </Card>
  );
}
