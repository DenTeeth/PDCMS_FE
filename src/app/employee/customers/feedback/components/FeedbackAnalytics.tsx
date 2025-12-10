'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSmile,
  faMeh,
  faFrown,
  faLightbulb,
  faExclamationTriangle,
  faRobot,
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FeedbackAnalytics as FeedbackAnalyticsType } from '@/types/feedback';

interface FeedbackAnalyticsProps {
  data: FeedbackAnalyticsType;
}

export default function FeedbackAnalytics({ data }: FeedbackAnalyticsProps) {
  // Sentiment data for pie chart
  const sentimentData = [
    { name: 'Positive', value: data.sentimentAnalysis.positive, color: '#10b981' },
    { name: 'Neutral', value: data.sentimentAnalysis.neutral, color: '#6b7280' },
    { name: 'Negative', value: data.sentimentAnalysis.negative, color: '#ef4444' },
  ];

  // Top keywords (limited to 20)
  const topKeywords = data.keywords.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích cảm xúc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <FontAwesomeIcon
                  icon={faSmile}
                  className="text-green-600 text-3xl"
                />
                <div>
                  <p className="text-sm text-gray-600">Positive Reviews</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.sentimentAnalysis.positive}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <FontAwesomeIcon
                  icon={faMeh}
                  className="text-gray-600 text-3xl"
                />
                <div>
                  <p className="text-sm text-gray-600">Neutral Reviews</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {data.sentimentAnalysis.neutral}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                <FontAwesomeIcon
                  icon={faFrown}
                  className="text-red-600 text-3xl"
                />
                <div>
                  <p className="text-sm text-gray-600">Negative Reviews</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.sentimentAnalysis.negative}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Từ khóa phổ biến từ đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((keyword, index) => (
              <Badge
                key={keyword.text}
                variant={index < 5 ? 'default' : 'secondary'}
                className="text-sm py-2 px-4"
                style={{
                  fontSize: `${Math.min(12 + keyword.value / 5, 20)}px`,
                }}
              >
                {keyword.text} ({keyword.value})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas of Improvement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-orange-600"
            />
            <CardTitle>Các khu vực cần cải thiện</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.areasOfImprovement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Number of Issues" />
              <Bar
                dataKey="averageRating"
                fill="#ef4444"
                name="Đánh giá trung bình"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.areasOfImprovement.map((area) => (
              <div
                key={area.area}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{area.area}</p>
                  <p className="text-sm text-gray-600">
                    {area.count} mentions • Avg rating: {area.averageRating.toFixed(1)}★
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {data.aiSummary && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faRobot} className="text-blue-600" />
              <CardTitle>Tóm tắt do AI tạo ra</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faSmile} className="text-green-600" />
                <h4 className="font-semibold text-green-900">Positive Feedback</h4>
              </div>
              <p className="text-gray-700">{data.aiSummary.positive}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faFrown} className="text-red-600" />
                <h4 className="font-semibold text-red-900">Negative Feedback</h4>
              </div>
              <p className="text-gray-700">{data.aiSummary.negative}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900">Suggestions</h4>
              </div>
              <ul className="space-y-2">
                {data.aiSummary.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
