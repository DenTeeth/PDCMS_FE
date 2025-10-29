// Room Management Types

export enum RoomType {
  STANDARD = 'STANDARD',
  SURGERY = 'SURGERY',
}

export interface Room {
  roomId: string;
  roomCode: string;
  roomName: string;
  roomType: RoomType;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Request Types
export interface CreateRoomRequest {
  roomCode: string;
  roomName: string;
  roomType: RoomType;
  isActive: boolean;
}

export interface UpdateRoomRequest {
  roomCode?: string;
  roomName?: string;
  roomType?: RoomType;
  isActive?: boolean;
}

export interface RoomFilters {
  roomType?: RoomType | string;
  isActive?: boolean | string;
  keyword?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// API Response Types
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface Sort {
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface RoomListResponse {
  content: Room[];
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: Sort;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

// Error Types
export enum RoomErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_CODE_CONFLICT = 'ROOM_CODE_CONFLICT',
  ROOM_IN_USE = 'ROOM_IN_USE',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// UI Types
export interface RoomFormData {
  roomCode: string;
  roomName: string;
  roomType: RoomType | '';
  isActive: boolean;
}

// Room Type Labels
export const ROOM_TYPE_LABELS = {
  [RoomType.STANDARD]: 'Phòng tiêu chuẩn',
  [RoomType.SURGERY]: 'Phòng phẫu thuật',
} as const;

// Status Labels
export const ROOM_STATUS_LABELS = {
  true: 'Đang hoạt động',
  false: 'Đã vô hiệu hóa',
} as const;
