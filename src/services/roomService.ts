import { apiClient } from '@/lib/api';
import { 
  Room, 
  CreateRoomRequest, 
  UpdateRoomRequest, 
  RoomFilters, 
  RoomListResponse,
  ApiResponse 
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
    const response = await axios.get<Room[]>(url);
    
    console.log('Active Rooms API Response:', response.data);
    console.log('Response status:', response.status);
    
    return response.data;
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
    const response = await axios.get<RoomListResponse>(url);
    
    console.log('Room API Response:', response.data);
    console.log('Response status:', response.status);
    
    // Return the response directly - API returns the correct format
    return response.data;
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
    
    return response.data;
  }

  /**
   * Lấy chi tiết phòng theo ID
   */
  static async getRoomById(roomId: string): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Room>(`${this.BASE_URL}/${roomId}`);
    
    // Return the room data directly
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
   */
  static async toggleRoomStatus(roomId: string): Promise<Room> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<Room>(`${this.BASE_URL}/${roomId}`);
    
    console.log('Toggle Room Status Response:', response.data);
    
    // Return the room data directly
    return response.data;
  }
}
