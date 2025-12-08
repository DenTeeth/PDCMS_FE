'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faChartLine } from '@fortawesome/free-solid-svg-icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RatingsOverview as RatingsOverviewType } from '@/types/feedback';

interface RatingsOverviewProps {
  data: RatingsOverviewType;
}

export default function RatingsOverview({ data }: RatingsOverviewProps) {
  // Prepare distribution data for bar chart
  const distributionData = [
    { rating: '5 Sao', count: data.ratingDistribution[5], percentage: ((data.ratingDistribution[5] / data.totalReviews) * 100).toFixed(1) },
    { rating: '4 Sao', count: data.ratingDistribution[4], percentage: ((data.ratingDistribution[4] / data.totalReviews) * 100).toFixed(1) },
    { rating: '3 Sao', count: data.ratingDistribution[3], percentage: ((data.ratingDistribution[3] / data.totalReviews) * 100).toFixed(1) },
    { rating: '2 Sao', count: data.ratingDistribution[2], percentage: ((data.ratingDistribution[2] / data.totalReviews) * 100).toFixed(1) },
    { rating: '1 Sao', count: data.ratingDistribution[1], percentage: ((data.ratingDistribution[1] / data.totalReviews) * 100).toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đánh giá tổng thể</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-bold">{data.overallRating.toFixed(1)}</p>
                  <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-2xl" />
                </div>
                <p className="text-xs text-gray-500 mt-1">trên 5.0</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <FontAwesomeIcon icon={faStar} className="text-yellow-600 text-3xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng số đánh giá</p>
                <p className="text-4xl font-bold">{data.totalReviews.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">tất cả thời gian</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-3xl" />
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
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-medium">{payload[0].payload.rating}</p>
                        <p className="text-sm text-gray-600">
                          {payload[0].value} reviews ({payload[0].payload.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Số lượng đánh giá" />
            </BarChart>
          </ResponsiveContainer>

          {/* Percentage bars */}
          <div className="mt-6 space-y-3">
            {distributionData.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">{item.rating}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng đánh giá theo thời gian</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-medium">{payload[0].payload.date}</p>
                        <p className="text-sm text-blue-600">
                          Rating: {payload[0].value}
                        </p>
                        <p className="text-sm text-gray-600">
                          Reviews: {payload[0].payload.count}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Đánh giá trung bình"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
