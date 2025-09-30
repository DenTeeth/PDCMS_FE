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
  type: 'login' | 'appointment' | 'blog' | 'user' | 'role' | 'inventory';
  description: string;
  timestamp: string;
  user?: string;
}

// Warehouse/Inventory types
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'medicine' | 'equipment' | 'material' | 'consumable';
  supplier: string;
  supplierId: string;
  expiryDate?: string;
  manufacturingDate: string;
  dentalPurpose: string;
  storageConditions: string;
  warranty?: string;
  warrantyPeriod?: number; // months
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  totalValue: number;
  batchNumber: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'import' | 'usage' | 'adjustment' | 'expired';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: string;
  performedById: string;
  date: string;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  expiringItems: number; // expiring in 30 days
  monthlyUsage: {
    month: string;
    totalUsed: number;
    totalImported: number;
    totalValue: number;
  }[];
  topUsedItems: {
    itemId: string;
    itemName: string;
    usageCount: number;
  }[];
  recentTransactions: InventoryTransaction[];
}

// Accountant/Financial types
export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  duration: number; // minutes
  description: string;
  requiredSupplies: string[]; // inventory item IDs
  isActive: boolean;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  period: string; // YYYY-MM
  totalCases: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  servicesPerformed: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
    supplyCost: number;
  }[];
  efficiency: number; // percentage
  patientSatisfaction: number; // rating out of 5
}

export interface PatientBill {
  id: string;
  patientName: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  services: {
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentMethod: 'cash' | 'card' | 'insurance' | 'bank_transfer';
  insuranceClaim?: {
    insuranceProvider: string;
    claimNumber: string;
    approvedAmount: number;
    status: 'pending' | 'approved' | 'rejected';
  };
  createdAt: string;
  dueDate: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'supplies' | 'equipment' | 'utilities' | 'salary' | 'maintenance' | 'other';
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  relatedInventoryId?: string;
  relatedDoctorId?: string;
  receiptNumber?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check';
  status: 'pending' | 'approved' | 'paid';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface FinancialSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueBreakdown: {
    serviceCategory: string;
    amount: number;
    percentage: number;
  }[];
  expenseBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  topPerformingDoctors: {
    doctorId: string;
    doctorName: string;
    revenue: number;
    cases: number;
  }[];
  outstandingPayments: number;
  cashFlow: {
    date: string;
    inflow: number;
    outflow: number;
    netFlow: number;
  }[];
}

// Dentist/Patient Management types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    expiryDate: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    previousSurgeries: string[];
    familyHistory: string[];
  };
  dentalHistory: {
    previousDentist: string;
    lastVisit: string;
    cleaningFrequency: string;
    oralHygiene: 'excellent' | 'good' | 'fair' | 'poor';
    habits: string[]; // smoking, grinding, etc.
  };
  assignedDoctorId: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  lastVisit?: string;
  nextAppointment?: string;
}

export interface TreatmentStage {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDuration: number; // days
  checklist: {
    id: string;
    task: string;
    description: string;
    isRequired: boolean;
    isCompleted: boolean;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
  }[];
  prerequisites: string[]; // stage IDs that must be completed first
  isCompleted: boolean;
  completedAt?: string;
  startedAt?: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  patientName: string;
  type: string; // Root Canal, Crown, Cleaning, etc.
  category: 'preventive' | 'restorative' | 'surgical' | 'orthodontic' | 'cosmetic';
  description: string;
  tooth: string[]; // tooth numbers
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  stages: TreatmentStage[];
  currentStageId?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  totalCost: number;
  paidAmount: number;
  notes: string;
  assignedDoctorId: string;
  assignedDoctorName: string;
  xrays: {
    id: string;
    url: string;
    type: string;
    date: string;
    notes: string;
  }[];
  images: {
    id: string;
    url: string;
    type: 'before' | 'progress' | 'after';
    date: string;
    notes: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DentistAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  treatmentId?: string;
  treatmentType?: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: 'checkup' | 'consultation' | 'treatment' | 'follow_up' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'urgent';
  room: string;
  notes: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  symptoms?: string[];
  diagnosis?: string;
  treatmentPlan?: string;
  nextAppointment?: {
    suggestedDate: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  };
}

export interface FollowUpSchedule {
  id: string;
  patientId: string;
  patientName: string;
  treatmentId: string;
  treatmentType: string;
  currentStage: string;
  reason: string;
  suggestedDate: string;
  urgency: 'routine' | 'soon' | 'urgent';
  status: 'pending' | 'scheduled' | 'completed' | 'overdue';
  instructions: string;
  assignedDoctorId: string;
  createdAt: string;
  remindersSent: number;
  lastReminderDate?: string;
}

export interface DentistStats {
  todayAppointments: DentistAppointment[];
  weeklySchedule: {
    date: string;
    appointments: DentistAppointment[];
  }[];
  activePatients: number;
  activeTreatments: number;
  completedTreatmentsThisMonth: number;
  pendingFollowUps: number;
  upcomingDeadlines: {
    patientName: string;
    treatmentType: string;
    deadline: string;
    urgency: string;
  }[];
  patientSatisfactionAvg: number;
  treatmentSuccessRate: number;
}

