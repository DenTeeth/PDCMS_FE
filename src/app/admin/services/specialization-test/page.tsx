'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { specializationService } from '@/services/specializationService';

export default function SpecializationTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetSpecializations = async () => {
    setLoading(true);
    try {
      console.log('Testing GET /api/v1/specializations...');
      const response = await specializationService.getAll();
      console.log('Success! Response:', response);
      setResult({ success: true, data: response });
    } catch (error: any) {
      console.error('Error:', error);
      setResult({ 
        success: false, 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
    } finally {
      setLoading(false);
    }
  };

  const testDirectAxios = async () => {
    setLoading(true);
    try {
      console.log('Testing direct axios call...');
      const { apiClient } = await import('@/lib/api');
      const axios = apiClient.getAxiosInstance();
      const response = await axios.get('/specializations');
      console.log('Direct axios success! Response:', response.data);
      setResult({ success: true, data: response.data, method: 'direct-axios' });
    } catch (error: any) {
      console.error('Direct axios error:', error);
      setResult({ 
        success: false, 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: 'direct-axios'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Specialization API Test</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button onClick={testGetSpecializations} disabled={loading}>
          {loading ? 'Testing...' : 'Test SpecializationService.getAll()'}
        </Button>
        <Button onClick={testDirectAxios} disabled={loading}>
          {loading ? 'Testing...' : 'Test Direct Axios Call'}
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {result && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">
            {result.success ? '✅ Success' : '❌ Error'} 
            {result.method && ` (${result.method})`}
          </h3>
          
          {result.success ? (
            <div>
              <p className="text-green-600 font-medium mb-2">API call successful!</p>
              <div className="mb-2">
                <strong>Data Type:</strong> {Array.isArray(result.data) ? 'Array' : typeof result.data}
              </div>
              <div className="mb-2">
                <strong>Length:</strong> {Array.isArray(result.data) ? result.data.length : 'N/A'}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">View Full Response</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="text-red-600 font-medium mb-2">API call failed!</p>
              <div className="mb-2">
                <strong>Error:</strong> {result.error}
              </div>
              <div className="mb-2">
                <strong>Status:</strong> {result.status} - {result.statusText}
              </div>
              <div className="mb-2">
                <strong>URL:</strong> {result.url}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">View Error Details</summary>
                <pre className="mt-2 p-2 bg-red-50 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
