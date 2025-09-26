// User/Account types
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
  lastLogin?: string;
}

// Blog types
export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  status: 'published' | 'draft' | 'archived';
  tags: string[];
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorName: string;
  doctorId: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// Role and Permission types
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  totalBlogs: number;
  totalRoles: number;
  todayAppointments: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'login' | 'appointment' | 'blog' | 'user' | 'role';
  description: string;
  timestamp: string;
  user?: string;
}

