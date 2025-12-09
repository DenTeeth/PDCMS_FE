'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ServiceService, SpecializationService } from '@/services/serviceService';

export default function ServiceTestPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetServices = async () => {
    setLoading(true);
    try {
      const response = await ServiceService.getServices({
        page: 0,
        size: 5,
        keyword: '',
        isActive: '',
        specializationId: '',
        sortBy: 'serviceName',
        sortDirection: 'ASC'
      });
      setResults({ type: 'getServices', data: response });
    } catch (error: any) {
      setResults({ type: 'getServices', error: error.message, details: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  const testGetSpecializations = async () => {
    setLoading(true);
    try {
      const response = await SpecializationService.getActiveSpecializations();
      setResults({ type: 'getSpecializations', data: response });
    } catch (error: any) {
      setResults({ type: 'getSpecializations', error: error.message, details: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  const testGetServiceById = async () => {
    setLoading(true);
    try {
      const response = await ServiceService.getServiceById(1);
      setResults({ type: 'getServiceById', data: response });
    } catch (error: any) {
      setResults({ type: 'getServiceById', error: error.message, details: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  const testCreateService = async () => {
    setLoading(true);
    try {
      const testData = {
        serviceCode: 'TEST_SERVICE_' + Date.now(),
        serviceName: 'Test Service',
        description: 'Test description',
        defaultDurationMinutes: 30,
        defaultBufferMinutes: 15,
        price: 100000,
        specializationId: 1,
        isActive: true
      };
      const response = await ServiceService.createService(testData);
      setResults({ type: 'createService', data: response });
    } catch (error: any) {
      setResults({ type: 'createService', error: error.message, details: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Service Management API Test</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button onClick={testGetServices} disabled={loading}>
          Test Get Services
        </Button>
        <Button onClick={testGetSpecializations} disabled={loading}>
          Test Get Specializations
        </Button>
        <Button onClick={testGetServiceById} disabled={loading}>
          Test Get Service By ID
        </Button>
        <Button onClick={testCreateService} disabled={loading}>
          Test Create Service
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {results && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Test Result: {results.type}</h3>
          {results.error ? (
            <div>
              <p className="text-red-600 font-medium">Error: {results.error}</p>
              <pre className="mt-2 p-2 bg-red-50 rounded text-sm overflow-auto">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            </div>
          ) : (
            <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          )}
        </Card>
      )}
    </div>
  );
}
