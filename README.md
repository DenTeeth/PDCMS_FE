# Private Dental Clinic Management System - Frontend

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

**A modern, high-performance dental clinic management system built with Next.js 16, React 19, TypeScript, and Tailwind CSS.**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Authentication & Authorization](#-authentication--authorization)
- [Key Features](#-key-features)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Support](#-support)

---

## 🎯 Overview

Private Dental Clinic Management System (PDCMS) is a comprehensive web application designed to manage all aspects of a dental clinic's operations. The system provides role-based access control for different user types including administrators, managers, dentists, receptionists, accountants, warehouse staff, and patients.

### Project Information
- **Project Name**: SEP193_PRIVATEDENTALCLINIC
- **Institution**: FPT University
- **Repository**: [GitLab](http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/fe.git)
- **Version**: 0.1.0

---

## 🚀 Features

### 🌐 Public Website
- **Modern Homepage** with impressive animations using Framer Motion
- **Responsive Design** optimized for all devices (mobile, tablet, desktop)
- **Performance Optimized** with lazy loading, code splitting, and image optimization
- **SEO Friendly** with proper meta tags and structured data
- **Sections**: Hero, About, Stats, Services, Doctors, Testimonials, FAQ, Appointment Booking

### 👨‍💼 Admin Dashboard (`/admin`)
Full system management capabilities:
- **Dashboard**: System overview with statistics and recent activities
- **Account Management**: User and employee account management
- **Blog Management**: Content management for clinic blog
- **Appointment Management**: View and manage all appointments
- **Role & Permission Management**: RBAC system with granular permissions
- **Holiday Management**: Define and manage national/company holidays
- **Shift Calendar**: Manage employee shifts and schedules
- **System Settings**: Configure clinic information and system preferences

### 👔 Employee Dashboard (`/employee`)
Unified dashboard for all employee roles with permission-based menu filtering:

#### Manager
- Analytics and reporting
- Appointment management
- Employee management
- Customer feedback and reviews
- Patient records
- System settings

#### Dentist
- Personal schedule and calendar
- Patient management
- Treatment plans and procedures
- Clinical records
- Follow-up appointments

#### Receptionist
- Appointment booking and management
- Customer management (groups & contacts)
- Patient registration
- KPI tracking
- Settings

#### Accountant
- Financial performance monitoring
- Revenue and expense tracking
- Payment management
- Financial reports

#### Warehouse Staff
- Inventory management
- Product and consumable tracking
- Stock statistics
- Supplier management

### 👤 Patient Portal (`/patient`)
Patient-facing features:
- **Appointment Booking**: Schedule appointments online
- **Treatment Plans**: View and track treatment progress
- **Medical Records**: Access clinical records and history
- **Billing**: View invoices and payment history
- **Notifications**: Real-time updates via WebSocket

### 🎨 Advanced Features

#### Holiday Management
- **Holiday Definitions**: Create and manage national/company holidays
- **Holiday Dates**: Manage specific holiday dates
- **Calendar Integration**: Holidays displayed on all calendar views
- **Auto-Schedule Integration**: Automatically avoids scheduling on holidays

#### Auto-Schedule System
- **Intelligent Scheduling**: Automatic appointment suggestions based on:
  - Doctor availability and shifts
  - Room availability
  - Service spacing rules
  - Holiday avoidance
- **Smart Suggestions**: Multiple time slot suggestions with conflict detection
- **Retry Mechanism**: Retry failed scheduling attempts
- **Warning System**: Clear warnings for "no doctor shifts" and availability issues

#### Calendar System
- **FullCalendar Integration**: Interactive calendar with multiple views
- **Holiday Display**: Visual indication of holidays with custom styling
- **Shift Management**: View and manage employee shifts
- **Appointment Viewing**: See all appointments in calendar format

#### Real-time Notifications
- **WebSocket Integration**: Real-time notifications via STOMP/WebSocket
- **Notification Center**: Centralized notification management
- **Unread Count**: Track unread notifications
- **Mark as Read**: Individual and bulk read status management

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16+**: React framework with App Router and Server Components
- **React 19+**: Latest React with concurrent features
- **TypeScript 5+**: Type-safe development
- **Tailwind CSS 4+**: Utility-first CSS framework

### UI Libraries & Components
- **Radix UI**: Accessible component primitives
  - Dialog, Select, Checkbox, Label, Popover, Progress, Separator, Tabs
- **Shadcn/ui**: High-quality component library
- **Framer Motion**: Advanced animation library
- **Lucide React**: Modern icon library
- **Font Awesome**: Additional icon support

### Forms & Validation
- **React Hook Form**: Performant form management
- **Zod**: Schema validation with TypeScript inference
- **@hookform/resolvers**: Zod integration for React Hook Form

### Data Fetching & State Management
- **TanStack Query (React Query)**: Server state management and caching
- **Axios**: HTTP client with interceptors
- **React Context**: Client-side state management (Auth, Language, Status)

### Calendar & Scheduling
- **FullCalendar**: Full-featured calendar component
  - DayGrid, TimeGrid, Interaction plugins
- **date-fns**: Date manipulation and formatting

### Charts & Visualization
- **Recharts**: Composable charting library

### Real-time Communication
- **STOMP.js**: WebSocket messaging protocol
- **SockJS**: WebSocket fallback support

### Internationalization
- **next-intl**: Internationalization for Next.js
- Support for Vietnamese and English

### Image & File Management
- **Cloudinary**: Cloud-based image management
- **next-cloudinary**: Next.js Cloudinary integration
- **Firebase**: Additional file storage support

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **tsx**: TypeScript execution for scripts

---

## 📦 Installation

### Prerequisites
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Git**: For version control

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/fe.git
   cd fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Variables](#-environment-variables))

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🚀 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbo
npm run dev:fast         # Start with HTTPS enabled

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run build:analyze    # Build with bundle analysis

# Code Quality
npm run lint             # Run ESLint

# Analysis
npm run analyze          # Analyze bundle size

# API Testing
npm run test:api         # Test API endpoints
npm run test:api:watch   # Watch mode for API tests
npm run test:api:participants  # Test participants API
npm run test:features    # Test feature modules
npm run test:all-modules # Test all modules
npm run test:comprehensive # Comprehensive tests
npm run test:warehouse   # Test warehouse APIs
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Write meaningful commit messages
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: Add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create a Merge Request** on GitLab

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (public)/                  # Public pages (About, Contact, Services, Doctors, Login)
│   ├── admin/                    # Admin dashboard
│   │   ├── holidays/             # Holiday management page
│   │   ├── shift-calendar/       # Shift calendar management
│   │   └── ...                   # Other admin pages
│   ├── employee/                 # Employee dashboard (unified for all roles)
│   │   ├── analytics/            # Analytics and reporting
│   │   ├── appointments/         # Appointment management
│   │   ├── customers/            # Customer management
│   │   └── ...                   # Other employee pages
│   ├── patient/                  # Patient portal
│   ├── api/                      # API routes
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── appointments/             # Appointment components
│   │   └── AppointmentCalendar.tsx  # Calendar component with holiday integration
│   ├── auth/                     # Authentication components
│   ├── clinical-records/         # Clinical record components
│   ├── homepage/                 # Homepage sections
│   ├── layout/                   # Layout components (Header, Footer, Navigation)
│   ├── notifications/            # Notification components
│   ├── treatment-plans/          # Treatment plan components
│   │   ├── AutoScheduleConfigModal.tsx  # Auto-schedule configuration
│   │   ├── AutoScheduleSuggestions.tsx  # Auto-schedule suggestions display
│   │   └── TreatmentPlanDetail.tsx      # Treatment plan details
│   ├── ui/                       # Reusable UI components (Shadcn/ui)
│   └── ...                       # Other component directories
│
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   ├── LanguageContext.tsx       # Internationalization
│   └── StatusContext.tsx         # Status management
│
├── hooks/                        # Custom React hooks
│   ├── useApiErrorHandler.ts     # API error handling
│   ├── useAutoSchedule.ts        # Auto-schedule logic
│   ├── useHolidays.ts            # Holiday data fetching
│   ├── useNotifications.ts       # Notification management
│   ├── usePermissions.ts         # Permission checking
│   └── ...                       # Other custom hooks
│
├── services/                     # API service layer
│   ├── appointmentService.ts     # Appointment API
│   ├── holidayService.ts         # Holiday management API
│   ├── treatmentPlanService.ts   # Treatment plan API
│   ├── employeeService.ts        # Employee API
│   ├── notificationService.ts    # Notification API
│   └── ...                       # Other service files
│
├── types/                        # TypeScript type definitions
│   ├── holiday.ts                # Holiday-related types
│   ├── appointment.ts            # Appointment types
│   ├── auth.ts                   # Authentication types
│   └── ...                       # Other type files
│
├── utils/                        # Utility functions
│   ├── holidayErrorHandler.ts    # Holiday error handling
│   ├── formatters.ts             # Data formatting utilities
│   └── ...                       # Other utilities
│
├── constants/                    # Constants and configuration
│   ├── navigationConfig.ts       # Navigation menu configuration
│   └── permissions.ts            # Permission constants
│
├── lib/                          # Core libraries
│   ├── api.ts                    # API client configuration
│   ├── cookies.ts                # Cookie utilities
│   ├── utils.ts                  # Common utilities
│   └── i18n.ts                   # Internationalization setup
│
├── config/                       # Configuration files
│   └── cloudinary.ts             # Cloudinary configuration
│
├── styles/                       # Global styles
│   ├── responsive-layout.css     # Responsive layout styles
│   └── sidebar-animations.css    # Sidebar animation styles
│
└── middleware.ts                 # Next.js middleware (auth, i18n)
```

---

## 🔐 Authentication & Authorization

### Authentication
The system uses **JWT-based authentication** with secure token storage in HTTP-only cookies.

### Role-Based Access Control (RBAC)
The system implements granular permission-based access control:

#### Available Roles
- **ADMIN**: Full system access
- **MANAGER**: Management operations
- **DENTIST**: Clinical operations
- **RECEPTIONIST**: Front desk operations
- **ACCOUNTANT**: Financial operations
- **WAREHOUSE**: Inventory operations
- **USER**: Patient portal access

#### Permission Groups
- **ACCOUNT**: Account management
- **EMPLOYEE**: Employee management
- **APPOINTMENT**: Appointment operations
- **TREATMENT_PLAN**: Treatment plan management
- **HOLIDAY**: Holiday management
- **SHIFT**: Shift management
- **CLINICAL_RECORD**: Clinical records
- **WAREHOUSE**: Inventory management
- And more...

#### Protected Routes
- All dashboard routes are protected with `ProtectedRoute` component
- Automatic redirect to login if not authenticated
- Role-based menu filtering based on permissions
- API-level permission checking

---

## 🎯 Key Features

### Holiday Management
**Location**: `/admin/holidays`

**Features**:
- Create, read, update, delete holiday definitions
- Manage holiday dates (national and company holidays)
- Filter by holiday type
- Search functionality
- Pagination support
- Integration with calendar views
- Auto-schedule holiday avoidance

### Auto-Schedule System
**Location**: Treatment Plan Detail page

**Features**:
- Intelligent appointment scheduling
- Multiple time slot suggestions
- Doctor shift validation
- Room availability checking
- Service spacing rules
- Holiday conflict detection
- Retry mechanism for failed attempts
- Clear warning messages

### Calendar Integration
**Components**: `AppointmentCalendar.tsx`, `AdminShiftCalendarPage.tsx`

**Features**:
- FullCalendar integration with multiple views
- Holiday display with custom styling
- Shift visualization
- Appointment viewing
- Interactive date selection
- Automatic data loading based on visible range

### Real-time Notifications
**Features**:
- WebSocket-based real-time updates
- Notification center with unread count
- Mark as read (individual and bulk)
- Delete notifications
- Real-time badge updates

---

## 🌐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-secret-key

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret

# Firebase (optional, for additional file storage)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# WebSocket (for real-time notifications)
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

---

## 🚢 Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

A `docker-compose.yml` file is included for containerized deployment:

```bash
docker-compose up -d
```

### Environment Setup
- Ensure all environment variables are set in production
- Configure API URLs for production backend
- Set up SSL certificates for HTTPS
- Configure CDN for static assets (if applicable)

---

## 📊 Performance Optimizations

### Implemented Optimizations
- ✅ **Code Splitting**: Dynamic imports for route-based splitting
- ✅ **Image Optimization**: Next.js Image component with WebP/AVIF formats
- ✅ **Lazy Loading**: Intersection Observer for below-fold content
- ✅ **Bundle Optimization**: Tree-shaking and vendor chunk splitting
- ✅ **Animation Optimization**: React.memo and reduced complexity
- ✅ **Caching Strategy**: Static assets and API response caching
- ✅ **Package Optimization**: Optimized imports for large libraries

### Custom Performance Hooks
- `useOptimizedAnimation`: Performance-aware animations
- `useDevicePerformance`: Adaptive animations based on device capabilities
- `useDebounce`: Debounced input handling

### Target Metrics
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **Initial Bundle Size**: < 200KB

---

## 🧪 Testing

### API Testing Scripts
```bash
# Test all API endpoints
npm run test:api

# Test specific modules
npm run test:features
npm run test:warehouse

# Comprehensive testing
npm run test:comprehensive
```

### Manual Testing Checklist
- [ ] Authentication flow (login, logout, token refresh)
- [ ] Role-based access control
- [ ] CRUD operations for all modules
- [ ] Calendar and scheduling features
- [ ] Holiday management
- [ ] Auto-schedule functionality
- [ ] Real-time notifications
- [ ] Responsive design on all devices

---

## 📝 Code Style Guidelines

### TypeScript
- Use strict TypeScript mode
- Define types for all props and state
- Avoid `any` type
- Use interfaces for object shapes
- Use enums for constants

### React
- Use functional components with hooks
- Keep components small and focused
- Use React.memo for expensive components
- Extract custom hooks for reusable logic

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theme colors
- Keep component styles co-located

### Git Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** following the code style guidelines
4. **Test your changes**: Run linting and build checks
5. **Commit your changes**: Use conventional commit messages
6. **Push to your branch**: `git push origin feature/your-feature`
7. **Create a Merge Request** on GitLab with a clear description

### Code Review Process
- All code must be reviewed before merging
- Ensure tests pass and code is linted
- Update documentation for new features
- Follow the existing code patterns

---

## 📞 Support

### Getting Help
- **Issues**: Create an issue on GitLab for bugs or feature requests
- **Documentation**: Check the docs folder for detailed guides
- **Team**: Contact the development team via GitLab

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📄 License

This project is private and confidential. All rights reserved.

**Note**: This is a student project for FPT University (SEP193_PRIVATEDENTALCLINIC).

---

## 🔗 Related Repositories

- **Backend API**: [Backend Repository](http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/be.git)
- **Documentation**: See `docs/` folder for detailed documentation

---

## 👥 Team

**Frontend Development Team** - FPT University SEP193

---

<div align="center">

**Built with ❤️ by the SEP193 Team**

[⬆ Back to Top](#-table-of-contents)

</div>
