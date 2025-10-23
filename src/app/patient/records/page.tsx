'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faDownload,
  faEye,
  faCalendarAlt,
  faUser,
  faStethoscope,
  faSearch,
  faFilter,
  faFilePdf,
  faFileImage,
  faFileWord,
  faTimes,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

// Sample medical records data
const medicalRecords = [
  {
    id: '1',
    title: 'Blood Test Results',
    type: 'Lab Results',
    date: '2024-01-15',
    doctor: 'Dr. Nguyen Van A',
    department: 'Laboratory',
    status: 'available',
    fileType: 'pdf',
    description: 'Complete blood count and metabolic panel results',
    size: '2.3 MB'
  },
  {
    id: '2',
    title: 'X-Ray - Chest',
    type: 'Imaging',
    date: '2024-01-10',
    doctor: 'Dr. Le Thi B',
    department: 'Radiology',
    status: 'available',
    fileType: 'image',
    description: 'Chest X-ray showing clear lungs and normal heart size',
    size: '5.7 MB'
  },
  {
    id: '3',
    title: 'Prescription - Lisinopril',
    type: 'Prescription',
    date: '2024-01-08',
    doctor: 'Dr. Tran Van C',
    department: 'Cardiology',
    status: 'available',
    fileType: 'pdf',
    description: 'Prescription for blood pressure medication',
    size: '0.8 MB'
  },
  {
    id: '4',
    title: 'Dental Cleaning Report',
    type: 'Treatment Report',
    date: '2024-01-05',
    doctor: 'Dr. Pham Thi D',
    department: 'Dentistry',
    status: 'processing',
    fileType: 'pdf',
    description: 'Comprehensive dental cleaning and examination report',
    size: '1.2 MB'
  },
  {
    id: '5',
    title: 'MRI - Brain',
    type: 'Imaging',
    date: '2024-01-03',
    doctor: 'Dr. Hoang Van E',
    department: 'Neurology',
    status: 'available',
    fileType: 'image',
    description: 'Brain MRI showing normal structure and no abnormalities',
    size: '15.2 MB'
  },
  {
    id: '6',
    title: 'Vaccination Record',
    type: 'Immunization',
    date: '2023-12-20',
    doctor: 'Dr. Nguyen Thi F',
    department: 'General Medicine',
    status: 'available',
    fileType: 'pdf',
    description: 'Updated vaccination record including COVID-19 booster',
    size: '1.5 MB'
  }
];

const recordTypes = ['All', 'Lab Results', 'Imaging', 'Prescription', 'Treatment Report', 'Immunization'];
const fileTypeIcons = {
  pdf: faFilePdf,
  image: faFileImage,
  word: faFileWord
};

export default function UserRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || record.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getFileTypeIcon = (fileType) => {
    const IconComponent = fileTypeIcons[fileType] || faFileAlt;
    return <FontAwesomeIcon icon={IconComponent} className="h-5 w-5" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="flex items-center"><FontAwesomeIcon icon={faCheckCircle} className="mr-1 h-3 w-3" />Available</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">Access and download your medical documents</p>
        </div>
        <Button variant="outline">
          <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {recordTypes.map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  onClick={() => setTypeFilter(type)}
                  size="sm"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getFileTypeIcon(record.fileType)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    <CardDescription>{record.type}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{record.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{record.doctor}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{record.date}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faStethoscope} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{record.department}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-muted-foreground">{record.size}</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={record.status !== 'available'}
                    >
                      <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FontAwesomeIcon icon={faFileAlt} className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No records found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'All' 
                ? 'Try adjusting your search or filter criteria'
                : 'You don\'t have any medical records yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Record Detail Modal would go here */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Record Details</CardTitle>
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Record detail content would go here */}
              <p>Record details would be displayed here...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

