'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoomService } from '@/services/roomService';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const { user } = useAuth();
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApiCall = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing Active Rooms API...');
      
      // Test direct axios call to active rooms endpoint
      const axios = (await import('axios')).default;
      const response = await axios.get('http://localhost:8080/api/v1/rooms/active');
      
      console.log('Active Rooms API Response:', response.data);
      console.log('Response status:', response.status);
      setApiResult(response.data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setError(`HTTP ${err.response.status}: ${err.response.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testApiCallWithService = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing Full Rooms API with service...');
      
      const result = await RoomService.getRooms({}, 0, 10);
      console.log('Service API Result:', result);
      setApiResult(result);
    } catch (err: any) {
      console.error('Service API Error:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setError(`HTTP ${err.response.status}: ${err.response.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testApiCallServiceNoParams = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing API call with service (no params)...');
      
      const result = await RoomService.testApiCall();
      console.log('Service No Params Result:', result);
      setApiResult(result);
    } catch (err: any) {
      console.error('Service No Params Error:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        setError(`HTTP ${err.response.status}: ${err.response.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Room Management Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Info:</h2>
          <p>Base Role: {user?.baseRole}</p>
          <p>Roles: {user?.roles?.join(', ')}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Room Permissions:</h2>
          <p>VIEW_ROOM: {user?.permissions?.includes('VIEW_ROOM') ? '' : ''}</p>
          <p>CREATE_ROOM: {user?.permissions?.includes('CREATE_ROOM') ? '' : ''}</p>
          <p>UPDATE_ROOM: {user?.permissions?.includes('UPDATE_ROOM') ? '' : ''}</p>
          <p>DELETE_ROOM: {user?.permissions?.includes('DELETE_ROOM') ? '' : ''}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">API Test:</h2>
          <div className="space-x-2 space-y-2">
            <Button onClick={testApiCall} disabled={loading}>
              {loading ? 'Testing...' : 'Test Active Rooms API'}
            </Button>
            <Button onClick={testApiCallWithService} disabled={loading}>
              {loading ? 'Testing...' : 'Test Full Rooms API'}
            </Button>
          </div>
          
          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {apiResult && (
            <div className="mt-2">
              <h3 className="font-medium mb-2">API Response:</h3>
              <div className="bg-green-100 p-3 rounded mb-2">
                <strong>Success!</strong> API call completed successfully.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Total Elements:</strong> {apiResult?.totalElements || (Array.isArray(apiResult) ? apiResult.length : 'N/A')}
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Total Pages:</strong> {apiResult?.totalPages || 'N/A'}
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Current Page:</strong> {apiResult?.number ? apiResult.number + 1 : 'N/A'}
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Page Size:</strong> {apiResult?.size || 'N/A'}
                </div>
                {apiResult?.content && apiResult.content.length > 0 && (
                  <>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>First Room:</strong> {apiResult.content[0].roomName}
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Room Type:</strong> {apiResult.content[0].roomType}
                    </div>
                  </>
                )}
                {Array.isArray(apiResult) && apiResult.length > 0 && (
                  <>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>First Room:</strong> {apiResult[0].roomName}
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Room Type:</strong> {apiResult[0].roomType}
                    </div>
                  </>
                )}
              </div>
              <div className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                <h4 className="font-medium mb-2">Full Response:</h4>
                <pre>{JSON.stringify(apiResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Grouped Permissions:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user?.groupedPermissions?.ROOM_MANAGEMENT, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
