'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faStar,
  faSearch,
  faFilter,
  faSort,
  faChartBar,
  faComment,
  faUser,
  faTooth,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

// Mock data for demo
const mockRatings = {
  overall: 4.7,
  totalReviews: 528,
  distribution: {
    5: 68,
    4: 22,
    3: 7,
    2: 2,
    1: 1
  },
  trend: [
    { month: 'Jan', rating: 4.5 },
    { month: 'Feb', rating: 4.6 },
    { month: 'Mar', rating: 4.4 },
    { month: 'Apr', rating: 4.6 },
    { month: 'May', rating: 4.7 },
    { month: 'Jun', rating: 4.8 }
  ]
}

const mockDentists = [
  { id: 1, name: 'Dr. Sarah Johnson', rating: 4.9, reviews: 156 },
  { id: 2, name: 'Dr. Michael Lee', rating: 4.7, reviews: 98 },
  { id: 3, name: 'Dr. Emily Chen', rating: 4.8, reviews: 124 },
  { id: 4, name: 'Dr. David Williams', rating: 4.5, reviews: 87 },
  { id: 5, name: 'Dr. Jessica Taylor', rating: 4.6, reviews: 63 }
]

const mockServices = [
  { id: 1, name: 'Dental Cleaning', rating: 4.8, reviews: 203 },
  { id: 2, name: 'Root Canal', rating: 4.5, reviews: 87 },
  { id: 3, name: 'Tooth Extraction', rating: 4.6, reviews: 112 },
  { id: 4, name: 'Orthodontics', rating: 4.9, reviews: 76 },
  { id: 5, name: 'Teeth Whitening', rating: 4.7, reviews: 50 }
]

const mockReviews = [
  {
    id: 1,
    patient: 'John Doe',
    date: '2023-09-30',
    rating: 5,
    text: 'Excellent service, Dr. Johnson was very professional and made me feel comfortable.',
    dentist: 'Dr. Sarah Johnson',
    service: 'Dental Cleaning'
  },
  {
    id: 2,
    patient: 'Emma Wilson',
    date: '2023-09-25',
    rating: 4,
    text: 'Good experience overall. The clinic was clean and staff was friendly.',
    dentist: 'Dr. Michael Lee',
    service: 'Tooth Extraction'
  },
  {
    id: 3,
    patient: 'Robert Brown',
    date: '2023-09-20',
    rating: 5,
    text: 'Dr. Chen was amazing with my child. Very patient and gentle.',
    dentist: 'Dr. Emily Chen',
    service: 'Orthodontics'
  },
  {
    id: 4,
    patient: 'Alice Martin',
    date: '2023-09-18',
    rating: 3,
    text: 'The procedure was fine but I had to wait too long for my appointment.',
    dentist: 'Dr. David Williams',
    service: 'Root Canal'
  },
  {
    id: 5,
    patient: 'Thomas Garcia',
    date: '2023-09-15',
    rating: 5,
    text: 'Very happy with my results! The team was professional and caring.',
    dentist: 'Dr. Jessica Taylor',
    service: 'Teeth Whitening'
  }
]

const mockKeywords = [
  { text: 'Professional', count: 87 },
  { text: 'Friendly', count: 72 },
  { text: 'Clean', count: 65 },
  { text: 'Gentle', count: 51 },
  { text: 'Efficient', count: 48 },
  { text: 'Waiting time', count: 38 },
  { text: 'Helpful', count: 33 },
  { text: 'Knowledgeable', count: 30 },
  { text: 'Caring', count: 28 },
  { text: 'Modern', count: 26 }
]

const mockSentiment = {
  positive: 78,
  neutral: 16,
  negative: 6
}

export default function FeedbackAndRatings() {
  const [selectedReviews, setSelectedReviews] = useState(mockReviews)
  const [filterRating, setFilterRating] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDentist, setSelectedDentist] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Filter and sort reviews
  useEffect(() => {
    let filteredResults = [...mockReviews]
    
    // Filter by rating
    if (filterRating > 0) {
      filteredResults = filteredResults.filter(review => review.rating === filterRating)
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredResults = filteredResults.filter(
        review =>
          review.patient.toLowerCase().includes(term) ||
          review.text.toLowerCase().includes(term)
      )
    }
    
    // Filter by dentist
    if (selectedDentist) {
      filteredResults = filteredResults.filter(review => review.dentist === selectedDentist)
    }
    
    // Filter by service
    if (selectedService) {
      filteredResults = filteredResults.filter(review => review.service === selectedService)
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filteredResults = filteredResults.filter(review => {
        return review.date >= dateRange.start && review.date <= dateRange.end
      })
    }
    
    // Sort reviews
    filteredResults.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === 'rating') {
        return sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating
      }
      return 0
    })
    
    setSelectedReviews(filteredResults)
  }, [filterRating, searchTerm, selectedDentist, selectedService, dateRange, sortBy, sortOrder])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Function to render star ratings
  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}
        />
      )
    }
    return stars
  }

  // Calculate percentage for distribution
  const calculatePercentage = (count: number) => {
    return (count / mockRatings.totalReviews) * 100
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feedback & Ratings</h1>
        <div className="flex space-x-4">
          <button className="btn btn-outline">Export Report</button>
          <button className="btn btn-primary">Response Templates</button>
        </div>
      </div>
      
      {/* Overall Rating Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Overall Rating</h2>
          <div className="flex items-center space-x-4">
            <span className="text-4xl font-bold">{mockRatings.overall}</span>
            <div className="text-lg flex">{renderStars(Math.round(mockRatings.overall))}</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Based on {mockRatings.totalReviews} reviews</p>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Rating Distribution</h2>
          <div className="space-y-2">
            {Object.entries(mockRatings.distribution)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([rating, count]) => (
                <div key={rating} className="flex items-center">
                  <span className="w-4">{rating}</span>
                  <FontAwesomeIcon icon={faStar} className="text-yellow-400 ml-1 mr-2" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${calculatePercentage(count)}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm">{count}%</span>
                </div>
              ))}
          </div>
        </Card>
        
        <Card className="p-6 col-span-2">
          <h2 className="text-lg font-semibold mb-2">Rating Trend</h2>
          <div className="h-40 flex items-end justify-between">
            {mockRatings.trend.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="w-8 bg-primary rounded-t"
                  style={{
                    height: `${(data.rating / 5) * 100}%`,
                  }}
                ></div>
                <span className="text-xs mt-1">{data.month}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dentist Ratings */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Dentist Ratings</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Dentist Name</th>
                  <th className="text-left p-4">Average Rating</th>
                  <th className="text-left p-4">Total Reviews</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockDentists.map((dentist) => (
                  <tr key={dentist.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{dentist.name}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="mr-2">{dentist.rating}</span>
                        <div className="flex text-sm">{renderStars(Math.round(dentist.rating))}</div>
                      </div>
                    </td>
                    <td className="p-4">{dentist.reviews}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedDentist(dentist.name)
                          setFilterRating(0)
                          setSelectedService(null)
                        }}
                        className="text-primary hover:underline"
                      >
                        View Reviews
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Service Ratings */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Service Ratings</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Service Name</th>
                  <th className="text-left p-4">Average Rating</th>
                  <th className="text-left p-4">Total Reviews</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockServices.map((service) => (
                  <tr key={service.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{service.name}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="mr-2">{service.rating}</span>
                        <div className="flex text-sm">{renderStars(Math.round(service.rating))}</div>
                      </div>
                    </td>
                    <td className="p-4">{service.reviews}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedService(service.name)
                          setFilterRating(0)
                          setSelectedDentist(null)
                        }}
                        className="text-primary hover:underline"
                      >
                        View Reviews
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Reviews List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Reviews List</h2>
          <div className="flex space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-64"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            
            {/* Filter by Rating */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(Number(e.target.value))}
              className="border rounded-md px-3 py-2"
            >
              <option value={0}>All Ratings</option>
              <option value={5}>5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={2}>2 Stars</option>
              <option value={1}>1 Star</option>
            </select>
            
            {/* Filter by Dentist */}
            <select
              value={selectedDentist || ''}
              onChange={(e) => setSelectedDentist(e.target.value || null)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Dentists</option>
              {mockDentists.map((dentist) => (
                <option key={dentist.id} value={dentist.name}>
                  {dentist.name}
                </option>
              ))}
            </select>
            
            {/* Filter by Service */}
            <select
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value || null)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Services</option>
              {mockServices.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-')
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }}
              className="border rounded-md px-3 py-2"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
            </select>
          </div>
        </div>
        
        {selectedReviews.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-lg">No reviews match your filter criteria.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {selectedReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-primary" />
                      {review.patient}
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <FontAwesomeIcon icon={faTooth} className="mr-2" />
                      {review.dentist} • {review.service}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex text-yellow-400 mb-1">{renderStars(review.rating)}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-end">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                      {formatDate(review.date)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700">{review.text}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="text-primary text-sm hover:underline mr-4">Reply</button>
                  <button className="text-primary text-sm hover:underline">Flag</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Analytics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Feedback Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Common Keywords */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Common Keywords</h3>
            <div className="flex flex-wrap">
              {mockKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full m-1"
                  style={{ fontSize: `${Math.max(0.8, Math.min(1.5, keyword.count / 30))}rem` }}
                >
                  {keyword.text}
                </span>
              ))}
            </div>
          </Card>
          
          {/* Sentiment Analysis */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Sentiment Analysis</h3>
            <div className="flex items-center mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-4"
                  style={{ width: `${mockSentiment.positive}%` }}
                ></div>
              </div>
              <span className="ml-2 font-medium">{mockSentiment.positive}%</span>
            </div>
            <div className="flex items-center mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-4"
                  style={{ width: `${mockSentiment.neutral}%` }}
                ></div>
              </div>
              <span className="ml-2 font-medium">{mockSentiment.neutral}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-red-500 h-4"
                  style={{ width: `${mockSentiment.negative}%` }}
                ></div>
              </div>
              <span className="ml-2 font-medium">{mockSentiment.negative}%</span>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 inline-block bg-green-500 rounded-full mr-2"></span>
                <span>Positive</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 inline-block bg-blue-500 rounded-full mr-2"></span>
                <span>Neutral</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 inline-block bg-red-500 rounded-full mr-2"></span>
                <span>Negative</span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Areas of Improvement & AI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mr-2 mt-0.5">
                  1
                </span>
                <span>Waiting time for appointments needs to be reduced</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mr-2 mt-0.5">
                  2
                </span>
                <span>More clear explanation of procedures and costs</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-red-100 text-red-500 mr-2 mt-0.5">
                  3
                </span>
                <span>Better follow-up communication after procedures</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">AI Feedback Summary</h3>
            <p className="mb-4 text-gray-700">
              <strong>Positive Highlights:</strong> Patients consistently praise the professionalism and 
              friendliness of dentists, particularly Dr. Sarah Johnson and Dr. Emily Chen. 
              The cleanliness of facilities and modern equipment are frequently mentioned positives.
            </p>
            <p className="text-gray-700">
              <strong>Areas to Address:</strong> Waiting times are mentioned in multiple negative reviews. 
              Some patients request more detailed explanations about procedures and costs. 
              Consider implementing an improved appointment system and providing clearer cost breakdowns.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}