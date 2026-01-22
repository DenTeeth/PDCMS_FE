'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUserMd,
  faTooth,
  faComments,
  faBrain,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { feedbackService } from '@/services/feedbackService';
import {
  RatingsOverview as RatingsOverviewType,
  DentistRating,
  ServiceRating,
  Review,
  FeedbackAnalytics as FeedbackAnalyticsType,
  ReviewFilters,
} from '@/types/feedback';
import RatingsOverview from './components/RatingsOverview';
import DentistRatings from './components/DentistRatings';
import ServiceRatings from './components/ServiceRatings';
import ReviewsList from './components/ReviewsList';
import FeedbackAnalytics from './components/FeedbackAnalytics';

// Mock data generator (remove when backend is ready)
const generateMockData = () => {
  const overview: RatingsOverviewType = {
    overallRating: 4.3,
    totalReviews: 248,
    ratingDistribution: {
      5: 120,
      4: 80,
      3: 30,
      2: 12,
      1: 6,
    },
    trendData: [
      { date: '2025-01', rating: 4.1, count: 45 },
      { date: '2025-02', rating: 4.2, count: 52 },
      { date: '2025-03', rating: 4.0, count: 48 },
      { date: '2025-04', rating: 4.3, count: 58 },
      { date: '2025-05', rating: 4.4, count: 45 },
    ],
  };

  const dentists: DentistRating[] = [
    {
      dentistCode: 'D001',
      dentistName: 'Dr. Nguyen Van A',
      averageRating: 4.8,
      totalReviews: 85,
      ratingDistribution: { 5: 60, 4: 20, 3: 3, 2: 1, 1: 1 },
    },
    {
      dentistCode: 'D002',
      dentistName: 'Dr. Tran Thi B',
      averageRating: 4.5,
      totalReviews: 72,
      ratingDistribution: { 5: 40, 4: 25, 3: 5, 2: 2, 1: 0 },
    },
    {
      dentistCode: 'D003',
      dentistName: 'Dr. Le Van C',
      averageRating: 4.2,
      totalReviews: 58,
      ratingDistribution: { 5: 25, 4: 22, 3: 8, 2: 2, 1: 1 },
    },
  ];

  const services: ServiceRating[] = [
    {
      serviceCode: 'S001',
      serviceName: 'Teeth Cleaning',
      averageRating: 4.6,
      totalReviews: 95,
      ratingDistribution: { 5: 55, 4: 30, 3: 8, 2: 2, 1: 0 },
    },
    {
      serviceCode: 'S002',
      serviceName: 'Teeth Whitening',
      averageRating: 4.4,
      totalReviews: 68,
      ratingDistribution: { 5: 35, 4: 25, 3: 6, 2: 2, 1: 0 },
    },
    {
      serviceCode: 'S003',
      serviceName: 'Root Canal',
      averageRating: 4.0,
      totalReviews: 45,
      ratingDistribution: { 5: 18, 4: 15, 3: 8, 2: 3, 1: 1 },
    },
  ];

  const reviews: Review[] = [
    {
      reviewId: 'R001',
      patientName: 'Nguyen Van X',
      patientCode: 'PT001',
      dentistName: 'Dr. Nguyen Van A',
      dentistCode: 'D001',
      serviceName: 'Teeth Cleaning',
      serviceCode: 'S001',
      rating: 5,
      reviewText: 'Excellent service! Very professional and gentle.',
      createdAt: '2025-10-20T10:30:00Z',
      sentiment: 'POSITIVE',
    },
    {
      reviewId: 'R002',
      patientName: 'Tran Thi Y',
      patientCode: 'PT002',
      dentistName: 'Dr. Tran Thi B',
      dentistCode: 'D002',
      serviceName: 'Teeth Whitening',
      serviceCode: 'S002',
      rating: 4,
      reviewText: 'Good results, but the waiting time was a bit long.',
      createdAt: '2025-10-19T14:20:00Z',
      sentiment: 'POSITIVE',
    },
    {
      reviewId: 'R003',
      patientName: 'Le Van Z',
      patientCode: 'PT003',
      dentistName: 'Dr. Le Van C',
      dentistCode: 'D003',
      serviceName: 'Root Canal',
      serviceCode: 'S003',
      rating: 3,
      reviewText: 'Okay experience, could be better with more explanation.',
      createdAt: '2025-10-18T09:15:00Z',
      sentiment: 'NEUTRAL',
    },
  ];

  const analytics: FeedbackAnalyticsType = {
    keywords: [
      { text: 'professional', value: 85 },
      { text: 'gentle', value: 72 },
      { text: 'friendly', value: 68 },
      { text: 'clean', value: 62 },
      { text: 'comfortable', value: 58 },
      { text: 'waiting time', value: 45 },
      { text: 'expensive', value: 38 },
      { text: 'painful', value: 25 },
      { text: 'excellent', value: 90 },
      { text: 'recommended', value: 75 },
    ],
    sentimentAnalysis: {
      positive: 65,
      neutral: 25,
      negative: 10,
    },
    areasOfImprovement: [
      { area: 'Waiting Time', count: 45, averageRating: 3.2 },
      { area: 'Pricing', count: 38, averageRating: 3.5 },
      { area: 'Communication', count: 28, averageRating: 3.8 },
      { area: 'Pain Management', count: 25, averageRating: 3.4 },
    ],
    aiSummary: {
      positive:
        'Patients consistently praise the professionalism and gentleness of the dentists. The clinic environment is described as clean and comfortable, with friendly staff creating a welcoming atmosphere.',
      negative:
        'The main concerns revolve around waiting times and pricing. Some patients feel the services are expensive, and there are complaints about longer-than-expected wait times for appointments.',
      suggestions: [
        'Implement a better appointment scheduling system to reduce waiting times',
        'Consider offering package deals or payment plans to address pricing concerns',
        'Improve communication about treatment costs upfront',
        'Provide more detailed explanations of procedures to anxious patients',
      ],
    },
  };

  return { overview, dentists, services, reviews, analytics };
};

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<RatingsOverviewType | null>(null);
  const [dentists, setDentists] = useState<DentistRating[]>([]);
  const [services, setServices] = useState<ServiceRating[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsType | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ReviewFilters>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Try to fetch from backend, fallback to mock data
      try {
        const [overviewData, dentistsData, servicesData, reviewsData, analyticsData] =
          await Promise.all([
            feedbackService.getRatingsOverview(),
            feedbackService.getDentistRatings(),
            feedbackService.getServiceRatings(),
            feedbackService.getReviews({ page: currentPage, size: 10 }),
            feedbackService.getFeedbackAnalytics(),
          ]);

        setOverview(overviewData);
        setDentists(dentistsData);
        setServices(servicesData);
        setReviews(reviewsData.content);
        setTotalPages(reviewsData.totalPages);
        setAnalytics(analyticsData);
      } catch (error: any) {
        // Backend not ready, use mock data
        console.log('Using mock data, backend not available');
        const mockData = generateMockData();
        setOverview(mockData.overview);
        setDentists(mockData.dentists);
        setServices(mockData.services);
        setReviews(mockData.reviews);
        setTotalPages(1);
        setAnalytics(mockData.analytics);
      }
    } catch (error: any) {
      console.error('Failed to load feedback data:', error);
      toast.error('Không thể tải dữ liệu phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDentistReviews = (dentistCode: string) => {
    setFilters({ ...filters, dentistCode });
    toast.info(`Filtering reviews for dentist: ${dentistCode}`);
  };

  const handleViewServiceReviews = (serviceCode: string) => {
    setFilters({ ...filters, serviceCode });
    toast.info(`Filtering reviews for service: ${serviceCode}`);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FontAwesomeIcon
          icon={faRefresh}
          className="text-4xl text-gray-400 animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Phản hồi & Đánh giá</h1>
          <p className="text-gray-600 mt-1">
          Phân tích phản hồi và đánh giá chất lượng dịch vụ từ người bệnh
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <FontAwesomeIcon icon={faRefresh} className="mr-2" />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="dentists">
            <FontAwesomeIcon icon={faUserMd} className="mr-2" />
            Bác sĩ
          </TabsTrigger>
          <TabsTrigger value="services">
            <FontAwesomeIcon icon={faTooth} className="mr-2" />
            Dịch vụ
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            Đánh giá
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <FontAwesomeIcon icon={faBrain} className="mr-2" />
            Phân tích
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {overview && <RatingsOverview data={overview} />}
        </TabsContent>

        <TabsContent value="dentists">
          <DentistRatings
            data={dentists}
            onViewReviews={handleViewDentistReviews}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServiceRatings
            data={services}
            onViewReviews={handleViewServiceReviews}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsList
            reviews={reviews}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && <FeedbackAnalytics data={analytics} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
