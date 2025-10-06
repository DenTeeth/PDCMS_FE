export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  customerGroups?: string[];
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  receptionistId: string;
  customerGroupId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastVisit: string;
  totalVisits: number;
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorName: string;
  doctorId: string;
  service: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  receptionistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  receptionistId: string;
  customerCount: number;
  totalRevenue: number;
  averageVisitValue: number;
  createdAt: string;
}

export interface ReceptionistStats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  customerGroups: number;
  totalRevenue: number;
  averageCustomerValue: number;
  recentActivities: {
    id: string;
    type: 'appointment' | 'patient' | 'payment' | 'login';
    description: string;
    timestamp: string;
    user: string;
  }[];
}

export interface KPIMetrics {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  customerGroupId: string;
  notes?: string;
}
