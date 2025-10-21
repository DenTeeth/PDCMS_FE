// Specialization types based on API response

export interface Specialization {
  specializationId: string;
  specializationCode: string;
  specializationName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  employees: SpecializationEmployee[];
}

export interface SpecializationEmployee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  roleId: string;
  specializations: string[];
  account?: any;
  role?: any;
}

export interface CreateSpecializationRequest {
  specializationCode: string;
  specializationName: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSpecializationRequest {
  specializationCode?: string;
  specializationName?: string;
  description?: string;
  isActive?: boolean;
}
