'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { workSlotService } from '@/services/workSlotService';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { DayOfWeek } from '@/types/workSlot';

export default function WorkSlotsTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testGetWorkSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing getWorkSlots...');
      
      const response = await workSlotService.getWorkSlots({
        page: 0,
        size: 10,
        sortBy: 'slotId',
        sortDirection: 'ASC'
      });
      
      console.log('Work slots response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCreateWorkSlot = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing createWorkSlot...');
      
      const response = await workSlotService.createWorkSlot({
        workShiftId: 'WKS_MORNING_02',
        dayOfWeek: DayOfWeek.MONDAY,
        quota: 5
      });
      
      console.log('Create work slot response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing getAvailableSlots...');
      
      const response = await shiftRegistrationService.getAvailableSlots();
      
      console.log('Available slots response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing getRegistrations...');
      
      const response = await shiftRegistrationService.getRegistrations({
        page: 0,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      });
      
      console.log('Registrations response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Work Slots API Test</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={testGetWorkSlots} disabled={loading}>
          Test Get Work Slots
        </Button>
        
        <Button onClick={testCreateWorkSlot} disabled={loading}>
          Test Create Work Slot
        </Button>
        
        <Button onClick={testGetAvailableSlots} disabled={loading}>
          Test Get Available Slots
        </Button>
        
        <Button onClick={testGetRegistrations} disabled={loading}>
          Test Get Registrations
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-4">
            <p>Loading...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
