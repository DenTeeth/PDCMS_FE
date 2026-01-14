import { apiClient } from '@/lib/api';
import { 
  Room, 
  CreateRoomRequest, 
  UpdateRoomRequest, 
  RoomFilters, 
  RoomListResponse,
  ApiResponse,
  RoomServicesResponse,
  UpdateRoomServicesRequest
} from '@/types/room';

export class RoomService {
  private static readonly BASE_URL = '/rooms';

  /**
   * Lấy danh sách phòng active (đơn giản)
   */
  static async getActiveRooms(): Promise<Room[]> {
    const url = `${this.BASE_URL}/active`;
    console.log('Active Rooms API URL:', url);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<any>(url);
    
    console.log('Active Rooms API Response:', response.data);
    console.log('Response status:', response.status);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: [...] }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const data = extractApiResponse<Room[]>(response);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Lấy danh sách phòng với filters, search và pagination
   */
  static async getRooms(filters?: RoomFilters, page: number = 0, size: number = 10): Promise<RoomListResponse> {
    const queryParams = new URLSearchParams();
    
    // Pagination params
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    
    // Sorting params
    queryParams.append('sortBy', filters?.sortBy || 'roomId');
    queryParams.append('sortDirection', filters?.sortDirection || 'ASC');
    
    // Filter params
    if (filters?.roomType && filters.roomType !== '') {
      queryParams.append('roomType', filters.roomType);
    }
    
    if (filters?.isActive !== undefined && filters.isActive !== '') {
      queryParams.append('isActive', filters.isActive.toString());
    }

    // Search param (backend uses 'keyword' instead of 'search')
    if (filters?.keyword && filters.keyword.trim() !== '') {
      queryParams.append('keyword', filters.keyword.trim());
    }

    const url = `${this.BASE_URL}?${queryParams.toString()}`;

    console.log('Room API URL:', url);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<any>(url);
    
    console.log('Room API Response:', response.data);
    console.log('Response status:', response.status);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: { content, ... } }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<RoomListResponse>(response);
  }

  /**
   * Lấy danh sách phòng đơn giản (chỉ trả về array Room[])
   * Để backward compatibility với code hiện tại
   */
  static async getRoomsSimple(filters?: RoomFilters): Promise<Room[]> {
    const response = await this.getRooms(filters, 0, 1000); // Lấy tối đa 1000 items
    return response.content;
  }

  /**
   * Test API call without any parameters
   */
  static async testApiCall(): Promise<RoomListResponse> {
    const url = this.BASE_URL;
    console.log('Test API URL (no params):', url);

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<RoomListResponse>(url);
    
    console.log('Test API Response:', response.data);
    console.log('Test Response status:', response.status);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<RoomListResponse>(response);
  }

  /**
   * Lấy chi tiết phòng theo ID
   * @deprecated Consider using getRoomByCode() instead - docs specify using roomCode
   */
  static async getRoomById(roomId: string): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Room>(`${this.BASE_URL}/${roomId}`);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Room>(response);
  }

  /**
   * Lấy chi tiết phòng theo Code
   * P1.2 - GET /api/v1/rooms/code/{roomCode}
   * Note: Backend uses /rooms/code/{roomCode} path, not /rooms/{roomCode}
   */
  static async getRoomByCode(roomCode: string): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Room>(`${this.BASE_URL}/code/${roomCode}`);
    
    return response.data;
  }

  /**
   * Tạo phòng mới
   */
  static async createRoom(roomData: CreateRoomRequest): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<Room>(this.BASE_URL, roomData);
    
    console.log('Create Room Response:', response.data);
    
    // Return the room data directly
    return response.data;
  }

  /**
   * Cập nhật phòng
   */
  static async updateRoom(roomId: string, roomData: UpdateRoomRequest): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.put<Room>(`${this.BASE_URL}/${roomId}`, roomData);
    
    console.log('Update Room Response:', response.data);
    
    // Return the room data directly
    return response.data;
  }

  /**
   * Vô hiệu hóa/Kích hoạt phòng (Toggle status)
   * P1.5 - DELETE /api/v1/rooms/{roomId}
   */
  static async toggleRoomStatus(roomId: string): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<Room>(`${this.BASE_URL}/${roomId}`);
    
    console.log('Toggle Room Status Response:', response.data);
    
    // Return the room data directly
    return response.data;
  }

  /**
   * P1.5 - Get Room Services (NEW - V16)
   * GET /api/v1/rooms/{roomCode}/services
   * Lấy danh sách dịch vụ mà phòng này hỗ trợ
   */
  static async getRoomServices(roomCode: string): Promise<RoomServicesResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<RoomServicesResponse>(
      `${this.BASE_URL}/${roomCode}/services`
    );
    
    return response.data;
  }

  /**
   * P1.6 - Update Room Services (NEW - V16)
   * PUT /api/v1/rooms/{roomCode}/services
   * Cấu hình danh sách dịch vụ mà phòng này có thể thực hiện
   * Note: API này REPLACE (thay thế hoàn toàn) danh sách services hiện tại
   */
  static async updateRoomServices(
    roomCode: string,
    request: UpdateRoomServicesRequest
  ): Promise<RoomServicesResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.put<RoomServicesResponse>(
      `${this.BASE_URL}/${roomCode}/services`,
      request
    );
    
    return response.data;
  }

  /**
   * Get Rooms by Services (NEW - Phase Scheduling)
   * GET /api/v1/rooms/by-services?serviceCodes={codes}
   * 
   * Returns only rooms that support ALL specified services (AND logic).
   * - Normal services (e.g., GEN_EXAM) → returns all rooms
   * - Specialized services (e.g., IMPL_SURGERY_KR) → returns only compatible rooms
   * - Mixed services → returns rooms that support ALL services
   * 
   * @param serviceCodes Array of service codes (e.g., ["GEN_EXAM", "IMPL_CONSULT"])
   * @returns Array of compatible rooms
   * 
   * @example
   * // Normal services - returns all 4 rooms
   * const rooms = await RoomService.getRoomsByServices(["GEN_EXAM", "SCALING_L1"]);
   * 
   * // Specialized services - returns only implant room
   * const rooms = await RoomService.getRoomsByServices(["IMPL_SURGERY_KR"]);
   * 
   * // Mixed services - returns only rooms supporting both
   * const rooms = await RoomService.getRoomsByServices(["GEN_EXAM", "IMPL_CONSULT"]);
   */
  static async getRoomsByServices(serviceCodes: string[]): Promise<Room[]> {
    if (!serviceCodes || serviceCodes.length === 0) {
      // If no services, return all active rooms (backward compatibility)
      return this.getActiveRooms();
    }

    const axios = apiClient.getAxiosInstance();
    const queryParams = new URLSearchParams();
    queryParams.append('serviceCodes', serviceCodes.join(','));
    
    const url = `${this.BASE_URL}/by-services?${queryParams.toString()}`;
    const response = await axios.get<Room[]>(url);
    
    return response.data;
  }
}
