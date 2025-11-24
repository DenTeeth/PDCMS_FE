# 📱 PATIENT MOBILE APP - FLUTTER SPECIFICATION

> **Phiên bản**: 1.0  
> **Ngày**: 23/11/2025  
> **Frontend Reference**: Next.js 14 (React) - PDCMS Patient Portal  
> **Target**: Android Mobile App (Flutter)

---

## 📋 MỤC LỤC

1. [Tổng quan ứng dụng](#1-tổng-quan-ứng-dụng)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Navigation Structure](#3-navigation-structure)
4. [Chi tiết từng màn hình](#4-chi-tiết-từng-màn-hình)
5. [UI/UX Guidelines](#5-uiux-guidelines)
6. [API Integration](#6-api-integration)
7. [State Management](#7-state-management)
8. [Offline & Caching](#8-offline--caching)

---

## 1. TỔNG QUAN ỨNG DỤNG

### 1.1 Mục đích

Ứng dụng mobile cho **bệnh nhân** (Patient) quản lý:

- Lịch hẹn khám
- Hồ sơ bệnh án
- Thanh toán hóa đơn
- Thông báo
- Thông tin cá nhân

### 1.2 Tech Stack đề xuất

```yaml
Frontend: Flutter (Dart)
State Management: Provider / Riverpod / Bloc (tùy chọn team)
HTTP Client: Dio
Storage: SharedPreferences + Secure Storage
Database: SQLite (cho offline cache)
Notification: Firebase Cloud Messaging (FCM)
```

### 1.3 Màu sắc chính (Brand Colors)

```dart
// Theme Colors
const Color primaryColor = Color(0xFF8B5FBF);  // Purple
const Color secondaryColor = Color(0xFF1E3A5F); // Navy Blue
const Color accentColor = Color(0xFFF3F4F6);   // Light Gray

// Status Colors
const Color successColor = Color(0xFF10B981);   // Green
const Color warningColor = Color(0xFFF59E0B);   // Orange
const Color errorColor = Color(0xFFEF4444);     // Red
const Color infoColor = Color(0xFF3B82F6);      // Blue
```

---

## 2. AUTHENTICATION & AUTHORIZATION

### 2.1 Login Screen (`/login`)

#### UI Layout

```
┌─────────────────────────────┐
│                             │
│   [DenTeeth Logo - 160px]   │
│                             │
│         DenTeeth            │
│   Modern Dental Clinic      │
│      Management             │
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 Username         │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔒 Password         │    │
│  └─────────────────────┘    │
│                             │
│  ☐ Remember me              │
│         Forgot password? →  │
│                             │
│  ┌─────────────────────┐    │
│  │    Sign in    →     │    │ [Primary Button]
│  └─────────────────────┘    │
│                             │
│  Don't have an account?     │
│  Contact: 01234568          │
│                             │
└─────────────────────────────┘
```

#### Validation Rules

```dart
// Username validation
- Required field
- Min length: 3 characters
- No special characters except _ and .

// Password validation
- Required field
- Min length: 6 characters
- Show/hide password toggle
```

#### API Call

```dart
POST /api/v1/auth/login
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "username": "string",
  "password": "string"
}

Response Success (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "roles": ["ROLE_PATIENT"],
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}

Response Error (401):
{
  "message": "Invalid username or password"
}
```

#### Behaviors

1. **Loading State**: Hiển thị loading indicator khi đang call API
2. **Success**:
   - Lưu `accessToken` vào **Secure Storage**
   - Lưu `refreshToken` vào **Secure Storage**
   - Navigate to `/dashboard`
   - Show Toast: "Welcome, {fullName}"
3. **Error**:
   - Show error message từ API
   - Không clear password field
   - Highlight field có lỗi (nếu có)

### 2.2 Protected Routes

Tất cả màn hình (trừ Login) yêu cầu:

- Valid `accessToken` trong header
- Role = `ROLE_PATIENT`

```dart
// Middleware/Guard example
Future<bool> isAuthenticated() async {
  final token = await secureStorage.read(key: 'accessToken');
  if (token == null) return false;

  // Verify token expiry
  final expired = JwtDecoder.isExpired(token);
  if (expired) {
    await refreshToken();
  }

  return true;
}
```

---

## 3. NAVIGATION STRUCTURE

### 3.1 Bottom Navigation Bar (Main Tabs)

```
┌────────────────────────────────────┐
│          Screen Content            │
│                                    │
│                                    │
│                                    │
└────────────────────────────────────┘
┌─────┬─────┬─────┬─────┬──────┐
│ 🏠  │ 📅  │ 📄  │ 💳  │  👤  │
│Home │Appt │Recs │Bill │Prof  │
└─────┴─────┴─────┴─────┴──────┘
```

#### Tab Configuration

```dart
List<BottomNavigationBarItem> tabs = [
  BottomNavigationBarItem(
    icon: Icon(Icons.home),
    label: 'Home',
    // Route: /dashboard
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.calendar_today),
    label: 'Appointments',
    // Route: /appointments
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.folder),
    label: 'Records',
    // Route: /records
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.payment),
    label: 'Billing',
    // Route: /billing
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.person),
    label: 'Profile',
    // Route: /profile
  ),
];
```

### 3.2 Secondary Navigation

- **Notifications**: Icon bell ở AppBar (top-right)
- **Settings**: Gear icon ở Profile tab
- **Logout**: Menu item trong Profile dropdown

---

## 4. CHI TIẾT TỪNG MÀN HÌNH

### 4.1 Dashboard (Home) - `/dashboard`

#### Purpose

Tổng quan nhanh về sức khỏe, lịch hẹn sắp tới, thông báo quan trọng.

#### Layout Structure

```
AppBar: "Welcome back, {FirstName}!"
  └─ Bell Icon (notifications badge)

┌─────────────────────────────────────┐
│ 🎨 Gradient Header Card             │
│   Welcome back, John!               │
│   Here's what's happening with      │
│   your health today                 │
│                                     │
│   Next Appointment:                 │
│   Jan 25, 2024 at 10:00 AM         │
└─────────────────────────────────────┘

┌─── Quick Stats (Grid 2x2) ──────────┐
│ ┌──────────┐  ┌──────────┐          │
│ │ 📅       │  │ 📄       │          │
│ │ Upcoming │  │ Medical  │          │
│ │    2     │  │    12    │          │
│ └──────────┘  └──────────┘          │
│ ┌──────────┐  ┌──────────┐          │
│ │ 💳       │  │ 🔔       │          │
│ │ Pending  │  │ Notifs   │          │
│ │    1     │  │    3     │          │
│ └──────────┘  └──────────┘          │
└─────────────────────────────────────┘

┌─── Upcoming Appointments ───────────┐
│ ┌─────────────────────────────────┐ │
│ │ ⏰ General Checkup              │ │
│ │ Jan 25, 2024 at 10:00 AM       │ │
│ │ with Dr. Nguyen Van A          │ │
│ │ [✓ Confirmed]                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⏰ Dental Cleaning              │ │
│ │ Jan 30, 2024 at 2:00 PM        │ │
│ │ with Dr. Le Thi B              │ │
│ │ [⏳ Pending]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Appointments →]           │
└─────────────────────────────────────┘

┌─── Recent Medical Records ──────────┐
│ ┌─────────────────────────────────┐ │
│ │ ✅ X-Ray                        │ │
│ │ Jan 15, 2024 - Dr. Nguyen A    │ │
│ │ [Completed]                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Blood Test                   │ │
│ │ Jan 10, 2024 - Dr. Le B        │ │
│ │ [Completed]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Records →]                │
└─────────────────────────────────────┘

┌─── Recent Notifications ────────────┐
│ ┌─────────────────────────────────┐ │
│ │ ⏰ Appointment Reminder          │ │
│ │ Your appointment with Dr. A is  │ │
│ │ tomorrow at 10:00 AM            │ │
│ │ 2 hours ago                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Notifications →]          │
└─────────────────────────────────────┘

┌─── Quick Actions (Grid 2x2) ────────┐
│ ┌────────────┐  ┌────────────┐      │
│ │ 📅 Book    │  │ 📄 View    │      │
│ │ Appointment│  │ Records    │      │
│ └────────────┘  └────────────┘      │
│ ┌────────────┐  ┌────────────┐      │
│ │ 💳 Make    │  │ 👤 Update  │      │
│ │ Payment    │  │ Profile    │      │
│ └────────────┘  └────────────┘      │
└─────────────────────────────────────┘
```

#### Data Models

```dart
class DashboardData {
  User user;
  QuickStats stats;
  List<Appointment> upcomingAppointments;
  List<MedicalRecord> recentRecords;
  List<Notification> notifications;
}

class QuickStats {
  int upcomingAppointments;
  int medicalRecords;
  int pendingPayments;
  int unreadNotifications;
}
```

#### API Endpoints

```dart
GET /api/v1/patients/dashboard
Response: DashboardData

GET /api/v1/patients/{id}/stats
Response: QuickStats
```

#### Behaviors

1. **Pull to Refresh**: Reload tất cả data
2. **Card Tap**: Navigate to detail screen
3. **"View All" Buttons**: Navigate to corresponding tab
4. **Quick Actions**: Navigate hoặc open modal

---

### 4.2 Appointments - `/appointments`

#### Purpose

Quản lý lịch hẹn: xem, đặt mới, hủy, reschedule.

#### View Modes

**Toggle between 2 views:**

1. **List View** (Default)
2. **Calendar View** (Weekly)

#### List View Layout

```
AppBar: "My Appointments"
  └─ Toggle: [List] [Calendar]
  └─ Button: "+ Book New"

┌─── Stats Cards (4 items) ───────────┐
│ Total: 6 | Pending: 1 | Confirmed: 2│
│ Completed: 3                        │
└─────────────────────────────────────┘

┌─── Filters ─────────────────────────┐
│ 🔍 Search: [______________________] │
│                                     │
│ Status: [All ▼] [Pending] [Confirmed]
│ Date: [________]                    │
└─────────────────────────────────────┘

┌─── Appointment Card ────────────────┐
│ ✅ [Confirmed]                      │
│                                     │
│ General Checkup                     │
│ General Medicine                    │
│                                     │
│ 👤 Dr. Nguyen Van A                 │
│ 📍 Room 101                         │
│ 📅 Jan 25, 2024                     │
│ ⏰ 10:00 AM (60 min)                │
│                                     │
│ 📝 Annual physical examination      │
│                                     │
│ [👁 View] [✏️ Edit] [🗑️ Delete]    │
└─────────────────────────────────────┘

┌─── Appointment Card (Overdue) ──────┐
│ ⚠️ [Overdue]                        │
│ Blood Tests                         │
│ Laboratory                          │
│ ...                                 │
└─────────────────────────────────────┘
```

#### Calendar View Layout

```
┌─── Week Navigation ─────────────────┐
│ [<] January 2024 [>]    [Today]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Time│ Mon  │ Tue  │ Wed  │ Thu │...│
│─────┼──────┼──────┼──────┼─────┼───│
│08:00│      │      │      │     │   │
│08:30│      │      │      │     │   │
│09:00│      │      │      │     │   │
│09:30│  🟢  │      │      │     │   │ <- Confirmed
│10:00│ Chk  │      │      │     │   │
│10:30│  Up  │      │      │     │   │
│11:00│      │  🟡  │      │     │   │ <- Pending
│11:30│      │ Dent │      │     │   │
│12:00│      │      │      │     │   │
│─────┴──────┴──────┴──────┴─────┴───│
│                                     │
│ Legend:                             │
│ 🟢 Confirmed  🟡 Pending            │
│ ⚪ Completed  🔴 Cancelled          │
└─────────────────────────────────────┘

┌─── Daily Summary (4 cards) ─────────┐
│ Mon 22: 1 apt | Tue 23: 0 apt      │
│ Wed 24: 2 apt | Thu 25: 1 apt      │
└─────────────────────────────────────┘
```

#### Status Badge Colors

```dart
enum AppointmentStatus {
  pending,    // 🟡 Yellow bg
  confirmed,  // 🟢 Green bg
  scheduled,  // 🔵 Blue bg
  completed,  // ⚪ Gray bg
  cancelled   // 🔴 Red bg
}
```

#### Data Model

```dart
class Appointment {
  String id;
  String date;           // "2024-01-25"
  String time;           // "10:00"
  String doctor;
  String department;
  String type;
  AppointmentStatus status;
  String location;       // "Room 101"
  String notes;
  int duration;          // minutes
}
```

#### API Endpoints

```dart
GET /api/v1/patients/{id}/appointments
Query Params:
  - status: pending|confirmed|completed
  - date: YYYY-MM-DD
  - search: string

POST /api/v1/appointments
Body: CreateAppointmentRequest

PUT /api/v1/appointments/{id}
Body: UpdateAppointmentRequest

DELETE /api/v1/appointments/{id}
```

#### Behaviors

1. **Search**: Filter by doctor name, type, department (debounce 300ms)
2. **Filter by Status**: Toggle buttons
3. **Filter by Date**: Date picker modal
4. **View Details**: Tap card → Bottom sheet with full details
5. **Edit**: Open modal pre-filled
6. **Delete**: Confirm dialog → API call → Refresh list
7. **Book New**: Navigate to booking wizard

---

### 4.3 Medical Records - `/records`

#### Purpose

Xem và download hồ sơ bệnh án, kết quả xét nghiệm, hình ảnh chẩn đoán.

#### Layout

```
AppBar: "Medical Records"
  └─ Button: "Download All"

┌─── Filters ─────────────────────────┐
│ 🔍 [Search records, doctor, dept...] │
│                                     │
│ Type Filter (Chips):                │
│ [All] [Lab Results] [Imaging]      │
│ [Prescription] [Treatment Report]   │
│ [Immunization]                      │
└─────────────────────────────────────┘

┌─── Record Card ─────────────────────┐
│ 📄 Blood Test Results               │
│ Lab Results                         │
│ [✓ Available]                       │
│                                     │
│ Complete blood count and metabolic  │
│ panel results                       │
│                                     │
│ 👤 Dr. Nguyen Van A                 │
│ 📅 Jan 15, 2024                     │
│ 🏥 Laboratory                       │
│                                     │
│ File: 2.3 MB | PDF                  │
│                                     │
│ [👁 View] [⬇️ Download]             │
└─────────────────────────────────────┘

┌─── Record Card (Processing) ────────┐
│ 📷 MRI - Brain                      │
│ Imaging                             │
│ [⏳ Processing]                     │
│ ...                                 │
│                                     │
│ [👁 View] [⬇️ Download] (Disabled) │
└─────────────────────────────────────┘
```

#### File Type Icons

```dart
Map<String, IconData> fileTypeIcons = {
  'pdf': Icons.picture_as_pdf,
  'image': Icons.image,
  'word': Icons.description,
};
```

#### Status Colors

```dart
enum RecordStatus {
  available,   // Green badge + icon
  processing,  // Yellow badge
  pending,     // Gray badge
  error        // Red badge
}
```

#### Data Model

```dart
class MedicalRecord {
  String id;
  String title;
  String type;           // Lab Results, Imaging, etc.
  String date;
  String doctor;
  String department;
  RecordStatus status;
  String fileType;       // pdf, image, word
  String description;
  String size;           // "2.3 MB"
  String? downloadUrl;   // Null if not available
}
```

#### API Endpoints

```dart
GET /api/v1/patients/{id}/records
Query Params:
  - type: string
  - search: string

GET /api/v1/records/{id}/download
Response: File stream (PDF/Image)
```

#### Behaviors

1. **Search**: Filter records (debounce 300ms)
2. **Filter by Type**: Chip selection (multi-select)
3. **View**:
   - PDF: Open in-app PDF viewer
   - Image: Open in-app image viewer with zoom
   - Word: Download to device
4. **Download**: Save to Downloads folder, show progress
5. **Download All**: Confirm dialog → Zip download
6. **Empty State**: "No records found" illustration

---

### 4.4 Billing & Payments - `/billing`

#### Purpose

Xem hóa đơn, thanh toán online, lịch sử giao dịch.

#### Layout

```
AppBar: "Billing & Payments"
  └─ Button: "+ Make Payment"

┌─── Summary Cards ───────────────────┐
│ ⚠️ Outstanding: $75.50              │
│ ✅ Total Paid: $350.00              │
│ 💳 Payment Methods: 2               │
└─────────────────────────────────────┘

┌─── Filters ─────────────────────────┐
│ 🔍 [Search bills...]                │
│                                     │
│ Status: [All] [Pending] [Overdue]  │
│         [Paid]                      │
└─────────────────────────────────────┘

┌─── Bill Card (Pending) ─────────────┐
│ ⏰ [Pending]                        │
│                                     │
│ INV-2024-002                        │
│ Dental cleaning and checkup         │
│                                     │
│ 💰 $75.50                           │
│ Due: Feb 20, 2024                   │
│                                     │
│ 👤 Dr. Le Thi B | Dentistry        │
│ 📅 Jan 20, 2024                     │
│                                     │
│ [👁 View] [⬇️ PDF] [💳 Pay Now]    │
└─────────────────────────────────────┘

┌─── Bill Card (Paid) ────────────────┐
│ ✅ [Paid]                           │
│                                     │
│ INV-2024-001                        │
│ General consultation                │
│                                     │
│ 💰 $150.00                          │
│ Due: Feb 15, 2024                   │
│                                     │
│ ✓ Paid on Jan 16, 2024              │
│   via Credit Card                   │
│                                     │
│ [👁 View] [⬇️ PDF]                  │
└─────────────────────────────────────┘
```

#### Payment Modal

```
┌─────────────────────────────────────┐
│ Make Payment               [✕]      │
├─────────────────────────────────────┤
│                                     │
│ Amount                              │
│ ┌─────────────────────────────────┐ │
│ │ $ 75.50                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Payment Method                      │
│ ┌─────────────────────────────────┐ │
│ │ Credit Card **** 1234       ▼  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Process Payment             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

#### Data Model

```dart
class Bill {
  String id;
  String invoiceNumber;
  String date;
  String dueDate;
  double amount;
  BillStatus status;
  String description;
  String doctor;
  String department;
  String? paymentMethod;
  String? paidDate;
}

enum BillStatus {
  paid,
  pending,
  overdue,
  cancelled
}

class PaymentMethod {
  String id;
  String type;         // Credit Card, Bank Account
  String lastFour;     // **** 1234
  String? expiryDate;  // 12/25
  bool isDefault;
}
```

#### API Endpoints

```dart
GET /api/v1/patients/{id}/bills
Query Params:
  - status: paid|pending|overdue
  - search: string

POST /api/v1/bills/{id}/payment
Body: {
  amount: double,
  paymentMethodId: string
}

GET /api/v1/patients/{id}/payment-methods
```

#### Behaviors

1. **Filter by Status**: Button toggle
2. **Pay Now**: Open payment modal → Process → Show receipt
3. **View Bill**: Bottom sheet with full details
4. **Download PDF**: Generate & save invoice
5. **Outstanding Alert**: Red banner if có hóa đơn quá hạn

---

### 4.5 Profile - `/profile`

#### Purpose

Quản lý thông tin cá nhân, emergency contact, insurance, medical history.

#### Layout

```
AppBar: "My Profile"
  └─ Button: "Edit Profile" / "Save Changes"

┌─── Personal Information ────────────┐
│ First Name:  John                   │
│ Last Name:   Doe                    │
│ Email:       john.doe@example.com   │
│ Phone:       +1 (555) 123-4567      │
│ DOB:         May 15, 1990           │
│ Address:     123 Main St, City...   │
└─────────────────────────────────────┘

┌─── Emergency Contact ───────────────┐
│ Name:         Jane Doe              │
│ Relationship: Spouse                │
│ Phone:        +1 (555) 987-6543     │
└─────────────────────────────────────┘

┌─── Insurance Information ───────────┐
│ Provider:     Blue Cross Blue Shield│
│ Policy #:     BC123456789           │
│ Group #:      GRP001                │
│ Expiry Date:  Dec 31, 2024          │
└─────────────────────────────────────┘

┌─── Medical History ─────────────────┐
│ Allergies:                          │
│ • Penicillin  • Shellfish           │
│                                     │
│ Current Medications:                │
│ • Lisinopril 10mg                   │
│ • Metformin 500mg                   │
│                                     │
│ Medical Conditions:                 │
│ • Hypertension  • Type 2 Diabetes   │
│                                     │
│ Previous Surgeries:                 │
│ • Appendectomy (2015)               │
└─────────────────────────────────────┘

┌─── Account Status ──────────────────┐
│ Account Status:  ✅ Active          │
│ Member Since:    Jan 2020           │
│ Last Login:      Today              │
└─────────────────────────────────────┘
```

#### Edit Mode

- Tất cả fields enabled khi tap "Edit Profile"
- Save button hiện ở AppBar
- Cancel button để discard changes

#### API Endpoints

```dart
GET /api/v1/patients/{id}
Response: Patient profile data

PUT /api/v1/patients/{id}
Body: UpdateProfileRequest
```

---

### 4.6 Notifications - `/notifications`

#### Layout

```
AppBar: "Notifications"
  └─ Button: "Mark All as Read"

┌─── Summary ─────────────────────────┐
│ Unread: 2 | Total: 5 | Read: 3     │
└─────────────────────────────────────┘

┌─── Filters ─────────────────────────┐
│ [All] [Unread] [Read]               │
└─────────────────────────────────────┘

┌─── Notification (Unread) ───────────┐
│ 🔵 ⏰ Appointment Reminder           │
│                                     │
│ Your appointment with Dr. A is      │
│ tomorrow at 10:00 AM                │
│                                     │
│ Jan 24, 2024 • 2 hours ago          │
│                                     │
│ [View Details] [✓ Mark as Read]     │
└─────────────────────────────────────┘

┌─── Notification (Read) ─────────────┐
│ 📄 Test Results Available           │
│                                     │
│ Your recent blood test results are  │
│ now available                       │
│                                     │
│ Jan 23, 2024 • 1 day ago            │
│                                     │
│ [View Details]                      │
└─────────────────────────────────────┘
```

#### Notification Types & Icons

```dart
Map<String, IconData> notificationIcons = {
  'reminder': Icons.calendar_today,    // 🔵 Blue
  'results': Icons.folder,             // 🟢 Green
  'payment': Icons.payment,            // 🟢 Green
  'cancellation': Icons.warning,       // 🔴 Red
  'prescription': Icons.info,          // 🟣 Purple
};
```

#### Priority Badge

```dart
enum NotificationPriority {
  high,     // Red badge
  medium,   // Yellow badge
  low       // Gray badge
}
```

#### Push Notifications (FCM)

```dart
// When app receives FCM notification
void onMessageReceived(RemoteMessage message) {
  // Show local notification
  // Update badge count
  // If app is open: show in-app alert
  // If app is closed: system notification
}
```

---

### 4.7 Settings - `/settings`

#### Layout

```
AppBar: "Settings"
  └─ Button: "Edit" / "Save"

┌─── Tabs ────────────────────────────┐
│ [Profile] [Notifications] [Privacy] │
│ [Security]                          │
└─────────────────────────────────────┘

// Tab: Notifications
┌─── Email Reminders ─────────────────┐
│ Receive appointment reminders       │
│ via email                 [Toggle] │
└─────────────────────────────────────┘

┌─── SMS Reminders ───────────────────┐
│ Receive appointment reminders       │
│ via SMS                   [Toggle] │
└─────────────────────────────────────┘

┌─── Appointment Alerts ──────────────┐
│ Get alerts for upcoming             │
│ appointments              [Toggle] │
└─────────────────────────────────────┘

// Tab: Privacy
┌─── Share Data with Providers ───────┐
│ Allow healthcare providers to       │
│ access your medical data [Toggle]  │
└─────────────────────────────────────┘

┌─── Two-Factor Authentication ───────┐
│ Add an extra layer of security      │
│ to your account           [Toggle] │
└─────────────────────────────────────┘

// Tab: Security
┌─── Change Password ─────────────────┐
│ Current Password:                   │
│ [__________________________]        │
│                                     │
│ New Password:                       │
│ [__________________________]        │
│                                     │
│ Confirm New Password:               │
│ [__________________________]        │
│                                     │
│ Requirements:                       │
│ ✓ At least 8 characters             │
│ ✓ Uppercase and lowercase           │
│ ✓ At least one number               │
│ ✓ At least one special character    │
└─────────────────────────────────────┘
```

#### API Endpoint

```dart
PUT /api/v1/patients/{id}/settings
Body: {
  notifications: {...},
  privacy: {...}
}

PUT /api/v1/auth/change-password
Body: {
  currentPassword: string,
  newPassword: string
}
```

---

## 5. UI/UX GUIDELINES

### 5.1 Design System

#### Typography

```dart
TextStyle heading1 = TextStyle(
  fontSize: 28,
  fontWeight: FontWeight.bold,
  color: Color(0xFF1E3A5F),
);

TextStyle heading2 = TextStyle(
  fontSize: 24,
  fontWeight: FontWeight.w600,
  color: Color(0xFF1E3A5F),
);

TextStyle body1 = TextStyle(
  fontSize: 16,
  fontWeight: FontWeight.normal,
  color: Color(0xFF374151),
);

TextStyle caption = TextStyle(
  fontSize: 12,
  color: Color(0xFF6B7280),
);
```

#### Spacing

```dart
const double spacingXS = 4.0;
const double spacingS = 8.0;
const double spacingM = 16.0;
const double spacingL = 24.0;
const double spacingXL = 32.0;
```

#### Border Radius

```dart
const double radiusS = 8.0;
const double radiusM = 12.0;
const double radiusL = 16.0;
const double radiusXL = 24.0;
```

#### Shadows

```dart
BoxShadow cardShadow = BoxShadow(
  color: Colors.black.withOpacity(0.05),
  blurRadius: 10,
  offset: Offset(0, 2),
);
```

### 5.2 Components

#### Card Component

```dart
Container(
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(radiusM),
    boxShadow: [cardShadow],
  ),
  padding: EdgeInsets.all(spacingM),
  child: Column(...),
);
```

#### Primary Button

```dart
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: primaryColor,
    foregroundColor: Colors.white,
    padding: EdgeInsets.symmetric(
      horizontal: spacingL,
      vertical: spacingM,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radiusM),
    ),
  ),
  onPressed: onPressed,
  child: Text('Button Text'),
);
```

#### Badge Component

```dart
Container(
  padding: EdgeInsets.symmetric(
    horizontal: 12,
    vertical: 6,
  ),
  decoration: BoxDecoration(
    color: getStatusColor(status),
    borderRadius: BorderRadius.circular(radiusS),
  ),
  child: Text(
    status.toUpperCase(),
    style: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: Colors.white,
    ),
  ),
);
```

### 5.3 Animations

#### Page Transitions

```dart
PageRouteBuilder(
  pageBuilder: (context, animation, secondaryAnimation) => NextPage(),
  transitionsBuilder: (context, animation, secondaryAnimation, child) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  },
  transitionDuration: Duration(milliseconds: 300),
);
```

#### Loading Indicators

```dart
// Shimmer effect cho skeleton loading
Shimmer.fromColors(
  baseColor: Colors.grey[300]!,
  highlightColor: Colors.grey[100]!,
  child: Container(...),
);
```

### 5.4 Empty States

Mỗi list cần có empty state với:

- Icon (lớn, màu nhạt)
- Heading
- Description
- CTA button (optional)

Example:

```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,
  children: [
    Icon(
      Icons.calendar_today,
      size: 64,
      color: Colors.grey[400],
    ),
    SizedBox(height: spacingM),
    Text(
      'No appointments found',
      style: heading2,
    ),
    SizedBox(height: spacingS),
    Text(
      'You don\'t have any appointments yet',
      style: body1.copyWith(color: Colors.grey),
    ),
    SizedBox(height: spacingL),
    ElevatedButton(
      onPressed: () {},
      child: Text('Book Appointment'),
    ),
  ],
);
```

---

## 6. API INTEGRATION

### 6.1 Base URL

```dart
const String baseUrl = 'http://localhost:8080/api/v1';
// Production: 'https://pdcms.denteeth.com/api/v1'
```

### 6.2 HTTP Client Setup (Dio)

```dart
class ApiClient {
  late Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 10),
      receiveTimeout: Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Interceptors
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LoggerInterceptor());
    _dio.interceptors.add(ErrorInterceptor());
  }
}
```

### 6.3 Auth Interceptor

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await secureStorage.read(key: 'accessToken');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioError err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, try refresh
      final refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return handler.resolve(await retry(err.requestOptions));
      } else {
        // Logout user
        await logout();
      }
    }
    handler.next(err);
  }
}
```

### 6.4 Error Handling

```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

// Usage
try {
  final response = await apiClient.get('/patients/1');
} on DioError catch (e) {
  if (e.response != null) {
    throw ApiException(
      e.response!.data['message'] ?? 'An error occurred',
      e.response!.statusCode,
    );
  } else {
    throw ApiException('Network error');
  }
}
```

---

## 7. STATE MANAGEMENT

### 7.1 Recommended: Riverpod

#### Provider Example

```dart
// Auth state provider
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState.initial());

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await apiClient.login(username, password);
      await secureStorage.write(
        key: 'accessToken',
        value: response.accessToken,
      );
      state = state.copyWith(
        isAuthenticated: true,
        user: response.user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    await secureStorage.delete(key: 'accessToken');
    state = AuthState.initial();
  }
}

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final User? user;
  final String? error;

  AuthState({
    required this.isLoading,
    required this.isAuthenticated,
    this.user,
    this.error,
  });

  factory AuthState.initial() => AuthState(
    isLoading: false,
    isAuthenticated: false,
  );

  AuthState copyWith({...}) => AuthState(...);
}
```

#### Usage in Widget

```dart
class LoginScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final authNotifier = ref.read(authStateProvider.notifier);

    return Scaffold(
      body: authState.isLoading
        ? CircularProgressIndicator()
        : LoginForm(
            onSubmit: (username, password) {
              authNotifier.login(username, password);
            },
          ),
    );
  }
}
```

### 7.2 Alternative: Provider

```dart
// Auth provider
class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  User? _user;
  bool _isLoading = false;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await apiClient.login(username, password);
      _isAuthenticated = true;
      _user = response.user;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// Usage
Consumer<AuthProvider>(
  builder: (context, auth, child) {
    if (auth.isLoading) {
      return CircularProgressIndicator();
    }
    return LoginForm(
      onSubmit: (username, password) {
        auth.login(username, password);
      },
    );
  },
);
```

---

## 8. OFFLINE & CACHING

### 8.1 Cache Strategy

#### Local Database (SQLite)

```dart
// Models for caching
class CachedAppointment {
  final int id;
  final String data; // JSON string
  final DateTime cachedAt;
  final DateTime expiresAt;
}

// Cache service
class CacheService {
  final Database _db;

  Future<void> cacheAppointments(List<Appointment> appointments) async {
    final json = jsonEncode(appointments);
    await _db.insert('appointments_cache', {
      'data': json,
      'cached_at': DateTime.now().toIso8601String(),
      'expires_at': DateTime.now()
        .add(Duration(minutes: 30))
        .toIso8601String(),
    });
  }

  Future<List<Appointment>?> getCachedAppointments() async {
    final result = await _db.query(
      'appointments_cache',
      where: 'expires_at > ?',
      whereArgs: [DateTime.now().toIso8601String()],
      orderBy: 'cached_at DESC',
      limit: 1,
    );

    if (result.isEmpty) return null;

    final json = jsonDecode(result.first['data'] as String);
    return (json as List).map((e) => Appointment.fromJson(e)).toList();
  }
}
```

#### Usage in Repository

```dart
class AppointmentRepository {
  final ApiClient _api;
  final CacheService _cache;

  Future<List<Appointment>> getAppointments() async {
    // Try cache first
    final cached = await _cache.getCachedAppointments();
    if (cached != null) {
      return cached;
    }

    // Fetch from API
    try {
      final appointments = await _api.getAppointments();
      await _cache.cacheAppointments(appointments);
      return appointments;
    } catch (e) {
      // If offline and no cache, throw error
      throw ApiException('No internet connection and no cached data');
    }
  }
}
```

### 8.2 Offline Indicator

```dart
// Connection listener
StreamSubscription<ConnectivityResult>? _connectivitySubscription;

void initConnectivityListener() {
  _connectivitySubscription = Connectivity()
    .onConnectivityChanged
    .listen((ConnectivityResult result) {
      final isOnline = result != ConnectivityResult.none;
      // Update app state
      ref.read(connectivityProvider.notifier).state = isOnline;
    });
}

// UI banner
if (!isOnline)
  Container(
    width: double.infinity,
    color: Colors.orange,
    padding: EdgeInsets.all(8),
    child: Text(
      '⚠️ You are offline. Data may be outdated.',
      style: TextStyle(color: Colors.white),
      textAlign: TextAlign.center,
    ),
  ),
```

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests

```dart
// Test auth logic
test('login success should update state', () async {
  final authNotifier = AuthNotifier();
  await authNotifier.login('john_doe', 'password123');

  expect(authNotifier.state.isAuthenticated, true);
  expect(authNotifier.state.user, isNotNull);
  expect(authNotifier.state.error, null);
});
```

### 9.2 Widget Tests

```dart
// Test login screen
testWidgets('login form should validate inputs', (tester) async {
  await tester.pumpWidget(MyApp());

  final loginButton = find.text('Sign in');
  await tester.tap(loginButton);
  await tester.pump();

  expect(find.text('Username is required'), findsOneWidget);
});
```

### 9.3 Integration Tests

```dart
// Test full login flow
testWidgets('login flow should navigate to dashboard', (tester) async {
  await tester.pumpWidget(MyApp());

  await tester.enterText(find.byKey(Key('username')), 'john_doe');
  await tester.enterText(find.byKey(Key('password')), 'password123');
  await tester.tap(find.text('Sign in'));
  await tester.pumpAndSettle();

  expect(find.text('Welcome back, John!'), findsOneWidget);
});
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Image Optimization

```dart
// Lazy loading images
CachedNetworkImage(
  imageUrl: record.imageUrl,
  placeholder: (context, url) => Shimmer(...),
  errorWidget: (context, url, error) => Icon(Icons.error),
  memCacheWidth: 200, // Resize image
);
```

### 10.2 List Performance

```dart
// Use ListView.builder for long lists
ListView.builder(
  itemCount: appointments.length,
  itemBuilder: (context, index) {
    final appointment = appointments[index];
    return AppointmentCard(appointment: appointment);
  },
);

// Avoid using ListView with fixed children
// BAD: ListView(children: appointments.map(...).toList())
```

### 10.3 Pagination

```dart
class AppointmentListScreen extends StatefulWidget {
  @override
  _AppointmentListScreenState createState() => _AppointmentListScreenState();
}

class _AppointmentListScreenState extends State<AppointmentListScreen> {
  final ScrollController _scrollController = ScrollController();
  int _page = 0;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadMore();
    }
  }

  void _loadMore() async {
    if (_isLoadingMore) return;
    setState(() => _isLoadingMore = true);

    _page++;
    await ref.read(appointmentProvider.notifier).loadMore(_page);

    setState(() => _isLoadingMore = false);
  }

  @override
  Widget build(BuildContext context) {
    final appointments = ref.watch(appointmentProvider);

    return ListView.builder(
      controller: _scrollController,
      itemCount: appointments.length + (_isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == appointments.length) {
          return CircularProgressIndicator();
        }
        return AppointmentCard(appointment: appointments[index]);
      },
    );
  }
}
```

---

## 11. SECURITY BEST PRACTICES

### 11.1 Secure Storage

```dart
// NEVER store sensitive data in SharedPreferences
// Use flutter_secure_storage instead

final secureStorage = FlutterSecureStorage();

// Store tokens
await secureStorage.write(key: 'accessToken', value: token);

// Read tokens
final token = await secureStorage.read(key: 'accessToken');

// Delete on logout
await secureStorage.delete(key: 'accessToken');
await secureStorage.deleteAll();
```

### 11.2 SSL Pinning

```dart
class ApiClient {
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
    ));

    // Add certificate pinning
    (_dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate =
      (client) {
        client.badCertificateCallback =
          (X509Certificate cert, String host, int port) {
            // Verify certificate
            return cert.pem == expectedCertificate;
          };
        return client;
      };
  }
}
```

### 11.3 Biometric Authentication

```dart
// Optional: Thêm Face ID / Fingerprint
final localAuth = LocalAuthentication();

Future<bool> authenticate() async {
  try {
    return await localAuth.authenticate(
      localizedReason: 'Authenticate to access your health data',
      options: AuthenticationOptions(
        biometricOnly: true,
        stickyAuth: true,
      ),
    );
  } catch (e) {
    return false;
  }
}

// Usage: Require biometric before showing sensitive data
if (await authenticate()) {
  // Show medical records
} else {
  // Show error
}
```

---

## 12. ANALYTICS & MONITORING

### 12.1 Firebase Analytics

```dart
class AnalyticsService {
  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  void logScreenView(String screenName) {
    _analytics.logScreenView(screenName: screenName);
  }

  void logAppointmentBooked(String doctorId, String date) {
    _analytics.logEvent(
      name: 'appointment_booked',
      parameters: {
        'doctor_id': doctorId,
        'date': date,
      },
    );
  }

  void logPaymentMade(double amount, String method) {
    _analytics.logEvent(
      name: 'payment_made',
      parameters: {
        'amount': amount,
        'method': method,
      },
    );
  }
}
```

### 12.2 Crash Reporting (Firebase Crashlytics)

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Crash reporting
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;

  runApp(MyApp());
}

// Log non-fatal errors
try {
  await apiClient.getAppointments();
} catch (e, stack) {
  FirebaseCrashlytics.instance.recordError(e, stack);
}
```

---

## 13. PUSH NOTIFICATIONS (FCM)

### 13.1 Setup

```dart
class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> init() async {
    // Request permission
    await _fcm.requestPermission();

    // Get FCM token
    final token = await _fcm.getToken();
    print('FCM Token: $token');

    // Send token to backend
    await apiClient.updateFcmToken(token);

    // Listen for messages
    FirebaseMessaging.onMessage.listen(_handleMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpened);
  }

  void _handleMessage(RemoteMessage message) {
    // App is in foreground
    // Show local notification
    _showLocalNotification(message);
  }

  void _handleMessageOpened(RemoteMessage message) {
    // User tapped notification
    // Navigate to relevant screen
    _navigateToScreen(message.data);
  }

  void _showLocalNotification(RemoteMessage message) {
    // Use flutter_local_notifications
    flutterLocalNotificationsPlugin.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      NotificationDetails(...),
      payload: jsonEncode(message.data),
    );
  }
}
```

### 13.2 Notification Payload

```json
{
  "notification": {
    "title": "Appointment Reminder",
    "body": "Your appointment is tomorrow at 10:00 AM"
  },
  "data": {
    "type": "appointment_reminder",
    "appointmentId": "123",
    "screen": "/appointments"
  }
}
```

---

## 14. LOCALIZATION (Optional)

### 14.1 Setup

```yaml
# pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

flutter:
  generate: true
```

### 14.2 Usage

```dart
// l10n/app_en.arb
{
  "welcome": "Welcome back, {name}!",
  "@welcome": {
    "placeholders": {
      "name": {
        "type": "String"
      }
    }
  },
  "appointments": "Appointments",
  "records": "Medical Records"
}

// l10n/app_vi.arb
{
  "welcome": "Chào mừng trở lại, {name}!",
  "appointments": "Lịch hẹn",
  "records": "Hồ sơ bệnh án"
}

// Usage in code
Text(AppLocalizations.of(context).welcome('John'))
```

---

## 15. BUILD & DEPLOYMENT

### 15.1 Build Commands

```bash
# Development build
flutter run --debug

# Release build (APK)
flutter build apk --release

# Release build (App Bundle)
flutter build appbundle --release

# Build for specific flavor
flutter build apk --flavor production --release
```

### 15.2 Flavors (Optional)

```dart
// android/app/build.gradle
flavorDimensions "environment"
productFlavors {
  development {
    dimension "environment"
    applicationIdSuffix ".dev"
    versionNameSuffix "-dev"
  }
  production {
    dimension "environment"
  }
}
```

### 15.3 CI/CD (GitHub Actions example)

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: "11"
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.16.0"
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk --release
      - uses: actions/upload-artifact@v2
        with:
          name: release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
```

---

## 16. CHECKLIST TRƯỚC KHI BẮT ĐẦU

### ✅ Prerequisites

- [ ] Flutter SDK installed (3.16+)
- [ ] Android Studio / VS Code setup
- [ ] Firebase project created
- [ ] Backend API running & accessible
- [ ] API documentation reviewed

### ✅ Project Setup

- [ ] Create Flutter project
- [ ] Setup folder structure
- [ ] Add dependencies (Dio, Riverpod, etc.)
- [ ] Setup Firebase (Analytics, FCM, Crashlytics)
- [ ] Configure app icons & splash screen

### ✅ Core Features

- [ ] Authentication flow
- [ ] Bottom navigation
- [ ] Dashboard screen
- [ ] Appointments (List + Calendar)
- [ ] Medical Records
- [ ] Billing & Payments
- [ ] Profile management
- [ ] Notifications
- [ ] Settings

### ✅ Quality Assurance

- [ ] Unit tests written
- [ ] Widget tests written
- [ ] Integration tests written
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Offline mode tested

### ✅ Performance

- [ ] Image caching
- [ ] List pagination
- [ ] Database caching
- [ ] Network request optimization

### ✅ Security

- [ ] Secure storage for tokens
- [ ] SSL pinning (optional)
- [ ] Biometric auth (optional)
- [ ] Input validation

---

## 17. CONTACT & SUPPORT

**Backend API Questions:**

- Contact: Backend team
- API Docs: http://localhost:8080/swagger-ui.html

**Design Assets:**

- Figma: [Link if available]
- Logo: `/public/denteeth-logo.png`

**Team:**

- Frontend: [Your name]
- Mobile: [Flutter team]
- Backend: [Backend team]

---

**Version History:**

- v1.0 (2025-01-23): Initial specification

**License:** Internal use only - DenTeeth PDCMS Project
