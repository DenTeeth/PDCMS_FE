/**
 * Time Off Type Management Types
 * Based on Time_Off_Type.md specification (BE-306)
 */

export interface TimeOffType {
  typeId: string;
  typeName: string;
  typeCode: string;
  description: string;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeOffTypeDto {
  typeName: string;
  typeCode: string;
  description: string;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
}

export interface UpdateTimeOffTypeDto {
  typeName: string;
  typeCode: string;
  description: string;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
}

export interface TimeOffTypeListResponse {
  content: TimeOffType[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

// Default Time Off Types from API documentation
export const DEFAULT_TIME_OFF_TYPES = [
  {
    typeId: 'TOT001',
    typeName: 'Nghi phep nam',
    typeCode: 'ANNUAL_LEAVE',
    description: 'Nghi phep hang nam (12 ngay/nam)',
    requiresBalance: true,
    defaultDaysPerYear: 12.0,
    isPaid: true,
  },
  {
    typeId: 'TOT002',
    typeName: 'Nghi om',
    typeCode: 'SICK_LEAVE',
    description: 'Nghi om dau benh',
    requiresBalance: false,
    defaultDaysPerYear: null,
    isPaid: true,
  },
  {
    typeId: 'TOT003',
    typeName: 'Nghi hieu',
    typeCode: 'BEREAVEMENT_LEAVE',
    description: 'Nghi tang (3 ngay cho cha me/vo chong, 1 ngay cho ong ba/anh chi em)',
    requiresBalance: false,
    defaultDaysPerYear: null,
    isPaid: true,
  },
  {
    typeId: 'TOT004',
    typeName: 'Nghi thai san',
    typeCode: 'MATERNITY_LEAVE',
    description: 'Nghi sinh con (6 thang)',
    requiresBalance: false,
    defaultDaysPerYear: null,
    isPaid: true,
  },
] as const;
