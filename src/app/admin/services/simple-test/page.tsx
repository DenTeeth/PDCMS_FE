'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ServiceService } from '@/services/serviceService';

export default function SimpleServiceTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetServices = async () => {
    setLoading(true);
    try {
      console.log('Testing GET /api/v1/services with default params...');
      const response = await ServiceService.getServices({
        page: 0,
        size: 5,
        sortBy: 'serviceName',
        sortDirection: 'ASC'
      });
      console.log('Success! Response:', response);
      setResult({ success: true, data: response });
    } catch (error: any) {
      console.error('Error:', error);
      setResult({ 
        success: false, 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Service API Test</h1>
      
      <div className="mb-6">
        <Button onClick={testGetServices} disabled={loading}>
          {loading ? 'Testing...' : 'Test GET /api/v1/services'}
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
          </h3>
          
          {result.success ? (
            <div>
              <p className="text-green-600 font-medium mb-2">API call successful!</p>
              <div className="mb-2">
                <strong>Total Elements:</strong> {result.data?.totalElements || 'N/A'}
              </div>
              <div className="mb-2">
                <strong>Total Pages:</strong> {result.data?.totalPages || 'N/A'}
              </div>
              <div className="mb-2">
                <strong>Services Count:</strong> {result.data?.content?.length || 0}
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
