'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  faSearch,
  faFilter,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { Review } from '@/types/feedback';
import { format } from 'date-fns';

interface ReviewsListProps {
  reviews: Review[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: any) => void;
}

export default function ReviewsList({
  reviews,
  totalPages,
  currentPage,
  onPageChange,
  onFilterChange,
}: ReviewsListProps) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value });
  };

  const handleRatingChange = (value: string) => {
    setRatingFilter(value);
    onFilterChange({ rating: value === 'all' ? undefined : parseInt(value) });
  };

  const handleSentimentChange = (value: string) => {
    setSentimentFilter(value);
    onFilterChange({ sentiment: value === 'all' ? undefined : value });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesomeIcon
            key={star}
            icon={faStar}
            className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      POSITIVE: 'default',
      NEUTRAL: 'secondary',
      NEGATIVE: 'destructive',
    };
    return (
      <Badge variant={variants[sentiment] || 'secondary'}>
        {sentiment}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Reviews</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filters
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search by patient name or review text..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
              <Select value={ratingFilter} onValueChange={handleRatingChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={handleSentimentChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="POSITIVE">Positive</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="NEGATIVE">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.reviewId}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{review.patientName}</h4>
                    {renderStars(review.rating)}
                    {getSentimentBadge(review.sentiment)}
                  </div>

                  <p className="text-gray-700 mb-3">{review.reviewText}</p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {review.dentistName && (
                      <span>
                         <strong>Dentist:</strong> {review.dentistName}
                      </span>
                    )}
                    {review.serviceName && (
                      <span>
                        🦷 <strong>Service:</strong> {review.serviceName}
                      </span>
                    )}
                    <span>
                      � {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No reviews found
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
