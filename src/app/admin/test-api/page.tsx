'use client';

/**
 * Test API Page
 * 
 * Temporary page to test all the new/updated API changes
 * Should be removed or moved to a test-only route after Phase 1
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RoomService } from '@/services/roomService';
import { ServiceService } from '@/services/serviceService';
import { appointmentService } from '@/services/appointmentService';
import { EmployeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import { specializationService } from '@/services/specializationService';
import { Room } from '@/types/room';
import { Service, CreateServiceRequest } from '@/types/service';
import { Specialization } from '@/types/specialization';
import { Employee } from '@/types/employee';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';

export default function TestAPIPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Data from database
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selected values
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>('');
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('');
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>('');
  const [selectedPatientCode, setSelectedPatientCode] = useState<string>('');
  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);
  const [selectedParticipantCodes, setSelectedParticipantCodes] = useState<string[]>([]);

  // Load data from database on mount
  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  const loadDataFromDatabase = async () => {
    setLoadingData(true);
    try {
      // Load rooms
      const roomsData = await RoomService.getActiveRooms();
      setRooms(roomsData);
      if (roomsData.length > 0) {
        setSelectedRoomCode(roomsData[0].roomCode);
      }

      // Load services
      const servicesResponse = await ServiceService.getServices({
        isActive: 'true',
        page: 0,
        size: 100
      });
      setServices(servicesResponse.content);
      if (servicesResponse.content.length > 0) {
        setSelectedServiceCode(servicesResponse.content[0].serviceCode);
        setSelectedServiceCodes([servicesResponse.content[0].serviceCode]);
      }

      // Load employees
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true
      });
      setEmployees(employeesResponse.content);
      if (employeesResponse.content.length > 0) {
        setSelectedEmployeeCode(employeesResponse.content[0].employeeCode);
      }

      // Load patients
      const patientsResponse = await patientService.getPatients({
        page: 0,
        size: 100,
        isActive: true
      });
      setPatients(patientsResponse.content);
      if (patientsResponse.content.length > 0) {
        setSelectedPatientCode(patientsResponse.content[0].patientCode);
      }

      // Load specializations
      const specializationsData = await specializationService.getAll();
      setSpecializations(specializationsData);

      toast.success('Đã tải dữ liệu từ database!');
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingData(false);
    }
  };

  // Room Service Tests
  const testGetRoomByCode = async () => {
    if (!selectedRoomCode) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    setLoading(true);
    try {
      const result = await RoomService.getRoomByCode(selectedRoomCode);
      setResults({ type: 'RoomService.getRoomByCode', success: true, data: result });
      toast.success('Kiểm tra thành công!');
    } catch (error: any) {
      setResults({ type: 'RoomService.getRoomByCode', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testGetRoomServices = async () => {
    if (!selectedRoomCode) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    setLoading(true);
    try {
      const result = await RoomService.getRoomServices(selectedRoomCode);
      setResults({ type: 'RoomService.getRoomServices', success: true, data: result });
      toast.success('Kiểm tra thành công!');
    } catch (error: any) {
      setResults({ type: 'RoomService.getRoomServices', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testUpdateRoomServices = async () => {
    if (!selectedRoomCode) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    if (selectedServiceCodes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    setLoading(true);
    try {
      const result = await RoomService.updateRoomServices(selectedRoomCode, {
        serviceCodes: selectedServiceCodes
      });
      setResults({ type: 'RoomService.updateRoomServices', success: true, data: result });
      toast.success('Kiểm tra thành công!');
      // Reload room services after update
      await testGetRoomServices();
    } catch (error: any) {
      setResults({ type: 'RoomService.updateRoomServices', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Service Service Tests
  const testUpdateService = async () => {
    if (!selectedServiceCode) {
      toast.error('Vui lòng chọn dịch vụ');
      return;
    }
    setLoading(true);
    try {
      const result = await ServiceService.updateService(selectedServiceCode, {
        serviceName: 'Test Updated Service',
        price: 350000
      });
      setResults({ type: 'ServiceService.updateService', success: true, data: result });
      toast.success('Kiểm tra thành công!');
    } catch (error: any) {
      setResults({ type: 'ServiceService.updateService', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testDeleteService = async () => {
    if (!selectedServiceCode) {
      toast.error('Vui lòng chọn dịch vụ');
      return;
    }
    setLoading(true);
    try {
      await ServiceService.deleteService(selectedServiceCode);
      setResults({ type: 'ServiceService.deleteService', success: true, data: 'Dịch vụ đã được xóa thành công' });
      toast.success('Kiểm tra thành công!');
      // Reload services after delete
      await loadDataFromDatabase();
    } catch (error: any) {
      setResults({ type: 'ServiceService.deleteService', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Appointment Service Tests
  const [availableDate, setAvailableDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');

  const testFindAvailableTimes = async () => {
    if (!selectedEmployeeCode) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }
    if (selectedServiceCodes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    setLoading(true);
    try {
      // Build query params for display
      const params = new URLSearchParams();
      params.append('date', availableDate);
      params.append('employeeCode', selectedEmployeeCode);
      selectedServiceCodes.forEach(code => {
        params.append('serviceCodes', code);
      });
      if (selectedParticipantCodes.length > 0) {
        selectedParticipantCodes.forEach(code => {
          params.append('participantCodes', code);
        });
      }
      const queryString = params.toString();
      const fullUrl = `http://localhost:8080/api/v1/appointments/available-times?${queryString}`;
      
      console.log(' Calling API:', fullUrl);
      console.log(' Query Params:', {
        date: availableDate,
        employeeCode: selectedEmployeeCode,
        serviceCodes: selectedServiceCodes,
        participantCodes: selectedParticipantCodes.length > 0 ? selectedParticipantCodes : undefined
      });
      
      const result = await appointmentService.findAvailableTimes({
        date: availableDate,
        employeeCode: selectedEmployeeCode,
        serviceCodes: selectedServiceCodes,
        participantCodes: selectedParticipantCodes.length > 0 ? selectedParticipantCodes : undefined
      });
      
      console.log(' Response:', result);
      console.log('� Total Duration:', result.totalDurationNeeded);
      console.log('� Available Slots:', result.availableSlots.length);
      
      // Include the URL in results for debugging
      setResults({ 
        type: 'appointmentService.findAvailableTimes', 
        success: true, 
        data: {
          ...result,
          _requestUrl: fullUrl,
          _queryParams: {
            date: availableDate,
            employeeCode: selectedEmployeeCode,
            serviceCodes: selectedServiceCodes,
            participantCodes: selectedParticipantCodes.length > 0 ? selectedParticipantCodes : undefined
          }
        }
      });
      toast.success(`Kiểm tra thành công! Tìm thấy ${result.availableSlots.length} khung giờ trống.`);
      
      // Auto-select first slot if available
      if (result.availableSlots && result.availableSlots.length > 0) {
        const firstSlot = result.availableSlots[0];
        setAppointmentStartTime(firstSlot.startTime);
        if (firstSlot.availableCompatibleRoomCodes.length > 0) {
          setSelectedRoomCode(firstSlot.availableCompatibleRoomCodes[0]);
        }
      }
    } catch (error: any) {
      console.error(' Error:', error);
      setResults({ type: 'appointmentService.findAvailableTimes', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testCreateAppointment = async () => {
    if (!selectedPatientCode) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }
    if (!selectedEmployeeCode) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }
    if (!selectedRoomCode) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    if (selectedServiceCodes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    if (!appointmentStartTime) {
      toast.error('Vui lòng chọn giờ bắt đầu (sử dụng Tìm khung giờ trống trước)');
      return;
    }
    setLoading(true);
    try {
      const request = {
        patientCode: selectedPatientCode,
        employeeCode: selectedEmployeeCode,
        roomCode: selectedRoomCode,
        serviceCodes: selectedServiceCodes,
        appointmentStartTime: appointmentStartTime,
        participantCodes: selectedParticipantCodes.length > 0 ? selectedParticipantCodes : undefined,
        notes: appointmentNotes || undefined
      };
      
      const result = await appointmentService.createAppointment(request);
      setResults({ type: 'appointmentService.createAppointment', success: true, data: result });
      toast.success('Đã tạo lịch hẹn!');
    } catch (error: any) {
      setResults({ type: 'appointmentService.createAppointment', success: false, error: error.response?.data || error.message });
      toast.error('Kiểm tra thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Toggle service selection for multi-select
  const toggleServiceSelection = (serviceCode: string) => {
    setSelectedServiceCodes(prev =>
      prev.includes(serviceCode)
        ? prev.filter(code => code !== serviceCode)
        : [...prev, serviceCode]
    );
  };

  // Toggle participant selection for multi-select
  const toggleParticipantSelection = (employeeCode: string) => {
    setSelectedParticipantCodes(prev =>
      prev.includes(employeeCode)
        ? prev.filter(code => code !== employeeCode)
        : [...prev, employeeCode]
    );
  };

  // Create Service state
  const [createServiceForm, setCreateServiceForm] = useState<Omit<CreateServiceRequest, 'isActive'>>({
    serviceCode: '',
    serviceName: '',
    description: '',
    defaultDurationMinutes: 30,
    defaultBufferMinutes: 10,
    price: 300000,
    specializationId: undefined
  });

  // Test Create Service
  const testCreateService = async () => {
    if (!createServiceForm.serviceCode.trim()) {
      toast.error('Please enter service code');
      return;
    }
    if (!createServiceForm.serviceName.trim()) {
      toast.error('Please enter service name');
      return;
    }
    if (createServiceForm.defaultDurationMinutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }
    if (createServiceForm.price < 0) {
      toast.error('Price must be >= 0');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare request body - isActive is optional in backend, so we don't send it
      // Backend will default to true
      const requestBody: any = {
        serviceCode: createServiceForm.serviceCode.trim(),
        serviceName: createServiceForm.serviceName.trim(),
        description: createServiceForm.description?.trim() || undefined,
        defaultDurationMinutes: createServiceForm.defaultDurationMinutes,
        defaultBufferMinutes: createServiceForm.defaultBufferMinutes,
        price: createServiceForm.price,
        specializationId: createServiceForm.specializationId || undefined
      };
      
      // Remove undefined fields
      Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });
      
      const result = await ServiceService.createService(requestBody as CreateServiceRequest);
      setResults({ type: 'ServiceService.createService', success: true, data: result });
      toast.success('Tạo dịch vụ thành công!');
      
      // Reset form
      setCreateServiceForm({
        serviceCode: '',
        serviceName: '',
        description: '',
        defaultDurationMinutes: 30,
        defaultBufferMinutes: 10,
        price: 300000,
        specializationId: undefined
      });
      
      // Reload services
      const servicesResponse = await ServiceService.getServices({
        isActive: 'true',
        page: 0,
        size: 100
      });
      setServices(servicesResponse.content);
    } catch (error: any) {
      setResults({ type: 'ServiceService.createService', success: false, error: error.response?.data || error.message });
      toast.error('Test failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Testing Page</h1>
          <p className="text-muted-foreground mt-2">
            Test all new/updated API changes before Phase 1
            {loadingData && <span className="ml-2 text-sm">(Loading data from database...)</span>}
          </p>
        </div>
        <Button onClick={loadDataFromDatabase} disabled={loadingData} variant="outline">
          {loadingData ? 'Đang tải...' : 'Tải lại dữ liệu'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Service Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Room Service Tests</CardTitle>
            <CardDescription>Test Room Management APIs (BE-401)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Room Code</Label>
              <Select value={selectedRoomCode} onValueChange={setSelectedRoomCode} disabled={loadingData || rooms.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingData ? "Loading..." : rooms.length === 0 ? "No rooms available" : "Select a room"} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.roomId} value={room.roomCode}>
                      {room.roomCode} - {room.roomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={testGetRoomByCode} disabled={loading || !selectedRoomCode}>
                Test Get Room by Code
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Room Code (for services)</Label>
              <Select value={selectedRoomCode} onValueChange={setSelectedRoomCode} disabled={loadingData || rooms.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingData ? "Loading..." : rooms.length === 0 ? "No rooms available" : "Select a room"} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.roomId} value={room.roomCode}>
                      {room.roomCode} - {room.roomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={testGetRoomServices} disabled={loading || !selectedRoomCode}>
                Test Get Room Services
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Room Code</Label>
              <Select value={selectedRoomCode} onValueChange={setSelectedRoomCode} disabled={loadingData || rooms.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingData ? "Đang tải..." : rooms.length === 0 ? "Không có phòng" : "Chọn phòng"} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.roomId} value={room.roomCode}>
                      {room.roomCode} - {room.roomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Service Codes (multi-select)</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {loadingData ? (
                  <p className="text-sm text-muted-foreground">Loading services...</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services available</p>
                ) : (
                  services.map((service) => (
                    <div key={service.serviceId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.serviceId}`}
                        checked={selectedServiceCodes.includes(service.serviceCode)}
                        onCheckedChange={() => toggleServiceSelection(service.serviceCode)}
                      />
                      <Label
                        htmlFor={`service-${service.serviceId}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {service.serviceCode} - {service.serviceName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <Button onClick={testUpdateRoomServices} disabled={loading || !selectedRoomCode || selectedServiceCodes.length === 0}>
                Test Update Room Services
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Service Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Service Service Tests</CardTitle>
            <CardDescription>Test Service Management APIs (BE-402)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Service */}
            <div className="border rounded-md p-4 space-y-3 bg-muted/50">
              <h3 className="font-semibold">Tạo dịch vụ mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Service Code *</Label>
                  <Input
                    value={createServiceForm.serviceCode}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, serviceCode: e.target.value }))}
                    placeholder="SV-TESTING12346"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Name *</Label>
                  <Input
                    value={createServiceForm.serviceName}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, serviceName: e.target.value }))}
                    placeholder="Cạo vôi răng cho Mít tơ Bít"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={createServiceForm.description || ''}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Lấy sạch vôi răng..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={createServiceForm.defaultDurationMinutes}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, defaultDurationMinutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buffer (minutes) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={createServiceForm.defaultBufferMinutes}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, defaultBufferMinutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (VND) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={createServiceForm.price}
                    onChange={(e) => setCreateServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization (optional)</Label>
                  <Select
                    value={createServiceForm.specializationId?.toString() || 'none-selected'}
                    onValueChange={(value) => {
                      if (value === 'none-selected') {
                        setCreateServiceForm(prev => ({ ...prev, specializationId: undefined }));
                      } else if (value) {
                        // Parse specializationId string to number
                        // Specialization API returns string ID, but Service API needs number
                        const numericId = parseInt(value);
                        setCreateServiceForm(prev => ({ ...prev, specializationId: isNaN(numericId) ? undefined : numericId }));
                      } else {
                        setCreateServiceForm(prev => ({ ...prev, specializationId: undefined }));
                      }
                    }}
                    disabled={loadingData || specializations.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Đang tải..." : specializations.length === 0 ? "Không có chuyên khoa" : "Chọn chuyên khoa"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">None</SelectItem>
                      {specializations.map((spec) => {
                        // Use index + 1 as numeric ID if specializationId is string UUID
                        // Or try to parse the string ID directly
                        const numericId = isNaN(parseInt(spec.specializationId)) ? specializations.indexOf(spec) + 1 : parseInt(spec.specializationId);
                        return (
                          <SelectItem key={spec.specializationId} value={numericId.toString()}>
                            {spec.specializationName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={testCreateService} disabled={loading} className="w-full">
                Test Create Service
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Service Code</Label>
              <Select value={selectedServiceCode} onValueChange={setSelectedServiceCode} disabled={loadingData || services.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingData ? "Đang tải..." : services.length === 0 ? "Không có dịch vụ" : "Chọn dịch vụ"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.serviceId} value={service.serviceCode}>
                      {service.serviceCode} - {service.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={testUpdateService} disabled={loading || !selectedServiceCode}>
                Test Update Service (by Code)
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Service Code (to delete)</Label>
              <Select value={selectedServiceCode} onValueChange={setSelectedServiceCode} disabled={loadingData || services.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingData ? "Đang tải..." : services.length === 0 ? "Không có dịch vụ" : "Chọn dịch vụ"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.serviceId} value={service.serviceCode}>
                      {service.serviceCode} - {service.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={testDeleteService} disabled={loading || !selectedServiceCode} variant="destructive">
                Test Delete Service (by Code)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Service Tests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Service Tests</CardTitle>
            <CardDescription>Test Appointment Management APIs (BE-403)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date (YYYY-MM-DD)</Label>
                <Input type="date" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mã nhân viên</Label>
                <Select value={selectedEmployeeCode} onValueChange={setSelectedEmployeeCode} disabled={loadingData || employees.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingData ? "Đang tải..." : employees.length === 0 ? "Không có nhân viên" : "Chọn nhân viên"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.employeeId} value={employee.employeeCode}>
                        {employee.employeeCode} - {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Codes (multi-select)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {loadingData ? (
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                  ) : services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services available</p>
                  ) : (
                    services.map((service) => (
                      <div key={service.serviceId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`available-service-${service.serviceId}`}
                          checked={selectedServiceCodes.includes(service.serviceCode)}
                          onCheckedChange={() => toggleServiceSelection(service.serviceCode)}
                        />
                        <Label
                          htmlFor={`available-service-${service.serviceId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {service.serviceCode} - {service.serviceName}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Participant Codes (optional, multi-select)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {loadingData ? (
                    <p className="text-sm text-muted-foreground">Loading employees...</p>
                  ) : employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No employees available</p>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.employeeId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`participant-${employee.employeeId}`}
                          checked={selectedParticipantCodes.includes(employee.employeeCode)}
                          onCheckedChange={() => toggleParticipantSelection(employee.employeeCode)}
                        />
                        <Label
                          htmlFor={`participant-${employee.employeeId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {employee.employeeCode} - {employee.fullName}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <Button onClick={testFindAvailableTimes} disabled={loading || !selectedEmployeeCode || selectedServiceCodes.length === 0} className="w-full">
              Test Find Available Times (P3.1)
            </Button>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Create Appointment (P3.2)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã bệnh nhân</Label>
                  <Select value={selectedPatientCode} onValueChange={setSelectedPatientCode} disabled={loadingData || patients.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Đang tải..." : patients.length === 0 ? "Không có bệnh nhân" : "Chọn bệnh nhân"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.patientId} value={patient.patientCode}>
                          {patient.patientCode} - {patient.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mã nhân viên</Label>
                  <Select value={selectedEmployeeCode} onValueChange={setSelectedEmployeeCode} disabled={loadingData || employees.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Đang tải..." : employees.length === 0 ? "Không có nhân viên" : "Chọn nhân viên"} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.employeeId} value={employee.employeeCode}>
                          {employee.employeeCode} - {employee.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room Code</Label>
                  <Select value={selectedRoomCode} onValueChange={setSelectedRoomCode} disabled={loadingData || rooms.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Đang tải..." : rooms.length === 0 ? "Không có phòng" : "Chọn phòng"} />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.roomId} value={room.roomCode}>
                          {room.roomCode} - {room.roomName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Codes (multi-select)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {loadingData ? (
                      <p className="text-sm text-muted-foreground">Loading services...</p>
                    ) : services.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No services available</p>
                    ) : (
                      services.map((service) => (
                        <div key={service.serviceId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-service-${service.serviceId}`}
                            checked={selectedServiceCodes.includes(service.serviceCode)}
                            onCheckedChange={() => toggleServiceSelection(service.serviceCode)}
                          />
                          <Label
                            htmlFor={`create-service-${service.serviceId}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {service.serviceCode} - {service.serviceName}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Start Time (ISO 8601) - Auto-filled from available times</Label>
                  <Input
                    type="datetime-local"
                    value={appointmentStartTime ? new Date(appointmentStartTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setAppointmentStartTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    placeholder="Chọn giờ từ các khung giờ trống"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Participant Codes (optional, multi-select)</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {loadingData ? (
                      <p className="text-sm text-muted-foreground">Loading employees...</p>
                    ) : employees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No employees available</p>
                    ) : (
                      employees.map((employee) => (
                        <div key={employee.employeeId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-participant-${employee.employeeId}`}
                            checked={selectedParticipantCodes.includes(employee.employeeCode)}
                            onCheckedChange={() => toggleParticipantSelection(employee.employeeCode)}
                          />
                          <Label
                            htmlFor={`create-participant-${employee.employeeId}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {employee.employeeCode} - {employee.fullName}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    placeholder="Ghi chú kiểm tra lịch hẹn"
                  />
                </div>
              </div>
              <Button onClick={testCreateAppointment} disabled={loading || !selectedPatientCode || !selectedEmployeeCode || !selectedRoomCode || selectedServiceCodes.length === 0 || !appointmentStartTime} className="w-full mt-4">
                Test Create Appointment (P3.2)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Test Cases */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Test Cases from Database</CardTitle>
            <CardDescription>
              Test cases với data thực tế từ database. Copy vào checklist để test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Data Summary */}
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold mb-2">� Data Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Rooms:</span> {rooms.length}
                  </div>
                  <div>
                    <span className="font-medium">Services:</span> {services.length}
                  </div>
                  <div>
                    <span className="font-medium">Employees:</span> {employees.length}
                  </div>
                  <div>
                    <span className="font-medium">Patients:</span> {patients.length}
                  </div>
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-4">
                {/* Room Test Cases */}
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">1⃣ Room Service Test Cases</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>TC1.1.1 - Get Room by Code (Valid):</strong>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Room Code: ${rooms[0]?.roomCode || 'N/A'}
Room Name: ${rooms[0]?.roomName || 'N/A'}
Expected: 200 OK
Response fields: roomCode, roomName, roomType, isActive`}
                      </pre>
                    </div>
                    {rooms[1] && (
                      <div>
                        <strong>TC1.1.2 - Get Room by Code (Invalid):</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Invalid Room Code: ${rooms[0]?.roomCode || 'N/A'}-INVALID
Expected: 404 Not Found
Error message: "Room not found with code: [code]"`}
                        </pre>
                      </div>
                    )}
                    {rooms[0] && (
                      <div>
                        <strong>TC1.2.1 - Get Room Services:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Room Code: ${rooms[0].roomCode}
Room Name: ${rooms[0].roomName}
Expected: 200 OK
Response: RoomServicesResponse with compatibleServices[] array`}
                        </pre>
                      </div>
                    )}
                    {rooms[0] && services.length >= 2 && (
                      <div>
                        <strong>TC1.3.1 - Update Room Services:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Room Code: ${rooms[0].roomCode}
Service Codes: [${services.slice(0, 2).map(s => s.serviceCode).join(', ')}]
Expected: 200 OK
Response: Updated RoomServicesResponse`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Test Cases */}
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">2⃣ Service Service Test Cases</h3>
                  <div className="space-y-2 text-sm">
                    {services[0] && (
                      <div>
                        <strong>TC2.1.1 - Get Service by Code (Valid):</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Service Code: ${services[0].serviceCode}
Service Name: ${services[0].serviceName}
Expected: 200 OK
Response fields: serviceCode, serviceName, price, defaultDurationMinutes`}
                        </pre>
                      </div>
                    )}
                    {services[0] && (
                      <div>
                        <strong>TC2.1.1 - Create Service:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Request Body:
{
  "serviceCode": "SV-TESTING12346",
  "serviceName": "Cạo vôi răng cho Mít tơ Bít",
  "description": "Lấy sạch vôi răng...",
  "defaultDurationMinutes": 30,
  "defaultBufferMinutes": 10,
  "price": 300000,
  "specializationId": 1
}
Expected: 201 Created
Response fields: serviceId, serviceCode, serviceName, description, defaultDurationMinutes, defaultBufferMinutes, price, specializationId, specializationName, isActive, createdAt, updatedAt
 WARNING: This will create actual service in database`}
                        </pre>
                      </div>
                    )}
                    {services[0] && (
                      <div>
                        <strong>TC2.2.1 - Update Service:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Service Code: ${services[0].serviceCode}
Update Data: { serviceName: "Test Updated Service", price: 350000 }
Expected: 200 OK
 WARNING: This will update actual data in database`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Test Cases */}
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">3⃣ Appointment Service Test Cases</h3>
                  <div className="space-y-2 text-sm">
                    {employees[0] && services[0] && (
                      <div>
                        <strong>TC3.1.1 - Find Available Times:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Date: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]} (tomorrow)
Employee Code: ${employees[0].employeeCode}
Employee Name: ${employees[0].fullName}
Service Codes: [${services[0].serviceCode}]
Expected: 200 OK
Response: AvailableTimesResponse with availableSlots[]`}
                        </pre>
                      </div>
                    )}
                    {employees[0] && services.length >= 2 && (
                      <div>
                        <strong>TC3.1.2 - Find Available Times (Multiple Services):</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Date: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
Employee Code: ${employees[0].employeeCode}
Service Codes: [${services.slice(0, 2).map(s => s.serviceCode).join(', ')}]
Expected: 200 OK
Verify: totalDurationNeeded = sum of all service durations + buffers`}
                        </pre>
                      </div>
                    )}
                    {patients[0] && employees[0] && rooms[0] && services[0] && (
                      <div>
                        <strong>TC3.2.1 - Create Appointment:</strong>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{`Patient Code: ${patients[0].patientCode}
Employee Code: ${employees[0].employeeCode}
Room Code: ${rooms[0].roomCode}
Service Codes: [${services[0].serviceCode}]
Appointment Start Time: [From available times result]
Expected: 201 Created
Response: CreateAppointmentResponse with appointmentCode
 WARNING: This will create actual appointment in database`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Mẫu cho Checklist */}
                <div className="border rounded-md p-4 bg-blue-50 dark:bg-blue-950">
                  <h3 className="font-semibold mb-2"> Data Mẫu cho Checklist</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Rooms:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{rooms.length > 0 ? rooms.slice(0, 3).map((room, idx) => 
  `- Room Code ${idx + 1}: ${room.roomCode} - ${room.roomName}`
).join('\n') + `\n- Invalid Room Code: ${rooms[0]?.roomCode || 'P-99'}-INVALID` : 'No rooms available'}
                      </pre>
                    </div>
                    <div>
                      <strong>Services:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{services.length > 0 ? services.slice(0, 3).map((service, idx) => 
  `- Service Code ${idx + 1}: ${service.serviceCode} - ${service.serviceName}`
).join('\n') + `\n- Invalid Service Code: INVALID-${services[0]?.serviceCode || 'SV'}` : 'No services available'}
                      </pre>
                    </div>
                    <div>
                      <strong>Employees/Doctors:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{employees.length > 0 ? employees.slice(0, 2).map((emp, idx) => 
  `- Employee Code ${idx + 1}: ${emp.employeeCode} - ${emp.fullName}`
).join('\n') + (employees[2] ? `\n- Participant Code 1: ${employees[2].employeeCode} - ${employees[2].fullName}` : '') + `\n- Invalid Employee Code: INVALID-${employees[0]?.employeeCode || 'BS'}` : 'No employees available'}
                      </pre>
                    </div>
                    <div>
                      <strong>Patients:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
{patients.length > 0 ? patients.slice(0, 2).map((patient, idx) => 
  `- Patient Code ${idx + 1}: ${patient.patientCode} - ${patient.fullName}`
).join('\n') + `\n- Invalid Patient Code: INVALID-${patients[0]?.patientCode || 'BN'}` : 'No patients available'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Last test result</CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${results.success ? 'text-green-600' : 'text-red-600'}`}>
                    {results.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${results.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(results.data || results.error, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground">No test results yet. Run a test above.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

