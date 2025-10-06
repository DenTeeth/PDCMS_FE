import { User, Blog, Appointment, Role, Permission, DashboardStats } from '@/types/admin';

// Empty arrays - data will be fetched from API
export const users: User[] = [];
export const blogs: Blog[] = [];
export const appointments: Appointment[] = [];
export const roles: Role[] = [];
export const permissions: Permission[] = [];

// Dashboard stats - will be fetched from API
export const dashboardStats: DashboardStats = {
  totalUsers: 0,
  totalEmployees: 0,
  totalPatients: 0,
  totalAppointments: 0,
  activeAppointments: 0,
  completedAppointments: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  newUsersThisMonth: 0,
  systemHealth: 'unknown'
};