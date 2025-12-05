# 📱 PATIENT MOBILE APP - FLUTTER SPECIFICATION

> **Phiên bản**: 2.0  
> **Ngày**: 25/11/2025  
> **Frontend Reference**: Next.js 14 (React) - PDCMS Patient Portal  
> **Target**: Android Mobile App (Flutter)  
> **Status**: COMPLETE DETAILED SPECIFICATION - 1:1 Web Parity

---

## 📋 MỤC LỤC

1. [Tổng quan ứng dụng](#1-tổng-quan-ứng-dụng)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Landing Page - Public (Chưa đăng nhập)](#3-landing-page---public-chưa-đăng-nhập)
4. [Navigation Structure](#4-navigation-structure)
5. [Chi tiết từng màn hình](#5-chi-tiết-từng-màn-hình)
6. [UI/UX Guidelines](#6-uiux-guidelines)
7. [API Integration](#7-api-integration)
8. [State Management](#8-state-management)
9. [Offline & Caching](#9-offline--caching)
10. [Testing Strategy](#10-testing-strategy)
11. [Performance Optimization](#11-performance-optimization)
12. [Security Best Practices](#12-security-best-practices)
13. [Analytics & Monitoring](#13-analytics--monitoring)
14. [Push Notifications](#14-push-notifications-fcm)
15. [Localization](#15-localization-optional)
16. [Build & Deployment](#16-build--deployment)
17. [Checklist](#17-checklist-trước-khi-bắt-đầu)
18. [Contact & Support](#18-contact--support)

---

## 1. TỔNG QUAN ỨNG DỤNG

### 1.1 Mục đích

Ứng dụng mobile cho **bệnh nhân** (Patient) quản lý:

- Lịch hẹn khám
- Hồ sơ bệnh án
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

## 3. LANDING PAGE - PUBLIC (Chưa đăng nhập)

### 3.1 Purpose

Màn hình chính cho người dùng **CHƯA ĐĂNG NHẬP**, giới thiệu phòng khám, dịch vụ, bác sĩ và khuyến khích đăng ký/đăng nhập.

### 3.2 Structure & Layout

Landing page bao gồm các section scroll được từ trên xuống dưới:

#### 3.2.1 Navigation Bar (Fixed Top)

```
┌─────────────────────────────────────┐
│ 🦷 DenTeeth     🇻🇳▼  [Login] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: White (#FFFFFF) với shadow nhẹ
- **Height**: 56dp (mobile standard)
- **Logo**: DenTeeth logo 120x45 dp, align left
- **Language Dropdown**:
  - Button: Gray bg (#F3F4F6), rounded 8dp
  - Icon: Flag emoji (🇻🇳/🇬🇧)
  - Text: Hidden on mobile, show on tablet+
  - Dropdown: White card, shadow-lg, 2 options
- **Login Button**:
  - Background: Primary (#8B5FBF)
  - Text: White, font-weight 600
  - Padding: 12x24 dp
  - Border-radius: 8dp
  - Hover: Darken 10% (#7A4EAE)

**Behavior:**

- Fixed position, z-index 50
- Scroll down → shadow increases
- Tap logo → scroll to top
- Language dropdown: tap outside to close

#### 3.2.2 Hero Section

```
┌─────────────────────────────────────┐
│  🌅 Background Image (Dental Clinic)│
│      with Gradient Overlay         │
│                                     │
│                                     │
│   ELEVATE YOUR SMILE WITH          │
│   ─────────────────────────        │
│   Professional Care and            │
│    Gentle Touch                    │
│                                     │
│  Family Dental Care - High-quality │
│  dental services with experienced  │
│  team and modern technology.       │
│                                     │
│  ┌─────────────────┐                │
│  │ Book Appointment│  [Our Services]│
│  └─────────────────┘                │
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết UI:**

- **Height**: 100vh (full screen)
- **Background**:
  - Image: `/Hero.jpg` với `object-fit: cover`
  - Overlay: Gradient from top-left to bottom-right
    - `from-background/80 via-background/70 to-primary/65`
    - Creates softer, more visible image effect
- **Content Container**:
  - Max-width: 600dp (mobile)
  - Padding: 16dp horizontal
  - Center aligned vertically & horizontally
- **Main Heading**:
  - Font: 32sp (mobile), 48sp (tablet), 56sp (desktop)
  - Font-weight: 700 (bold)
  - Color: Foreground (#1E3A5F)
  - Line-height: 1.2
  - Animated: Fade in + slide up on appear
- **Gradient Text** ("Professional Care and Gentle Touch"):
  - Gradient: `from-primary via-secondary to-primary`
  - Creates purple→navy→purple flow effect
  - Animation: Gentle shimmer (optional)
- **Description Text**:
  - Font: 16sp (mobile), 20sp (tablet)
  - Color: Muted foreground (#6B7280)
  - Line-height: 1.6
  - Max-width: 500dp
  - Margin-top: 16dp
- **CTA Buttons Row**:
  - Layout: Column on mobile (<600dp), Row on tablet+
  - Gap: 16dp
  - Margin-top: 40dp
  - **Primary Button** ("Book Appointment"):
    - Background: Primary (#8B5FBF)
    - Text: White, font-size 16sp, weight 600
    - Padding: 16x40 dp
    - Border-radius: 12dp
    - Shadow: Large (elevation 8)
    - Hover: Scale 1.05, shadow-xl
  - **Secondary Button** ("Our Services"):
    - Background: White/90 with backdrop blur
    - Border: 2dp solid primary/30
    - Text: Foreground, font-size 16sp, weight 600
    - Same padding/radius as primary
    - Shadow: Large
    - Hover: Scale 1.05, bg white

**Animations:**

1. Heading: Opacity 0→1, translateY(30)→0, duration 600ms, delay 100ms
2. Subheading: Opacity 0→1, duration 600ms, delay 200ms
3. Description: Opacity 0→1, duration 600ms, delay 300ms
4. Buttons: Opacity 0→1, translateY(20)→0, duration 600ms, delay 400ms

**Behaviors:**

- Parallax scroll (background slower than content) - optional
- Buttons navigate to sections or login
- Auto-detect language from device (fallback: Vietnamese)

#### 3.2.3 Stats Section

```
┌─────────────────────────────────────┐
│  Background: Light gradient         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│   ┌───────┐  ┌───────┐             │
│   │ 500+  │  │  15+  │             │
│   │Patients│  │ Years │             │
│   └───────┘  └───────┘             │
│   ┌───────┐  ┌───────┐             │
│   │  10+  │  │ 4.9/5 │             │
│   │Doctors│  │ Rating│             │
│   └───────┘  └───────┘             │
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: Gradient `from-accent to-white` (#F9FAFB → #FFFFFF)
- **Padding**: 48dp vertical, 16dp horizontal
- **Grid**: 2x2 on mobile, 4x1 on tablet+
- **Gap**: 24dp
- **Each Stat Card**:
  - Background: White with subtle shadow
  - Padding: 24dp
  - Border-radius: 16dp
  - Center aligned
  - **Number**:
    - Font: 36sp, weight 700
    - Color: Primary (#8B5FBF)
    - Margin-bottom: 8dp
  - **Label**:
    - Font: 14sp, weight 400
    - Color: Muted (#6B7280)
- **Animation**: Fade in + count up animation khi scroll vào view
- **Data**:
  - `500+ Happy Patients`
  - `15+ Years Experience`
  - `10+ Professional Doctors`
  - `4.9/5 Customer Rating`

#### 3.2.4 About Section

```
┌─────────────────────────────────────┐
│  ABOUT DENTEETH                     │
│  ━━━━━━━━━━━                        │
│                                     │
│  [📷 Clinic Photo]                  │
│                                     │
│  Your Smile, Our Mission            │
│                                     │
│  We are a modern dental clinic...   │
│  Lorem ipsum dolor sit amet...      │
│                                     │
│  ✓ Patient-first approach           │
│  ✓ Experienced team                 │
│  ✓ Modern technology                │
│  ✓ Quality guaranteed               │
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: White
- **Padding**: 64dp vertical, 16dp horizontal
- **Layout**: Column (image top, content bottom) on mobile
- **Section Title**:
  - "ABOUT DENTEETH"
  - Font: 12sp, uppercase, weight 700, letter-spacing 2
  - Color: Primary (#8B5FBF)
  - Margin-bottom: 16dp
- **Main Heading**:
  - "Your Smile, Our Mission"
  - Font: 32sp, weight 700
  - Color: Foreground (#1E3A5F)
  - Margin-bottom: 24dp
- **Description**:
  - Paragraph text
  - Font: 16sp, line-height 1.6
  - Color: Muted (#6B7280)
  - Max-width: 600dp
  - Margin-bottom: 32dp
- **Feature List**:
  - 4 items in 2x2 grid
  - Each item:
    - Icon: ✓ checkmark (or Shield, Users, Tooth, Award icons)
    - Title: Font 16sp, weight 600, color foreground
    - Description: Font 14sp, color muted
    - Background: Light primary tint
    - Padding: 16dp
    - Border-radius: 12dp
- **Image**:
  - Aspect ratio: 16:9
  - Border-radius: 16dp
  - Shadow: Medium
  - Object-fit: cover

#### 3.2.5 Services Section (ID: "services")

```
┌─────────────────────────────────────┐
│  OUR SERVICES                       │
│  ━━━━━━━━━━━                        │
│                                     │
│  Comprehensive Dental Care          │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │ 🦷 General   │  │ 💎 Cosmetic  ││
│  │   Dentistry  │  │   Dentistry  ││
│  └──────────────┘  └──────────────┘│
│  ┌──────────────┐  ┌──────────────┐│
│  │ 🔧 Orthodon  │  │ 🦷 Implants  ││
│  │   tics       │  │              ││
│  └──────────────┘  └──────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: Light accent (#F9FAFB)
- **Padding**: 64dp vertical
- **Section Title**: Same style as About
- **Main Heading**: "Comprehensive Dental Care"
- **Grid**: 2 columns on mobile, 3-4 on tablet+
- **Gap**: 24dp
- **Service Card**:
  - Background: White
  - Padding: 32dp
  - Border-radius: 16dp
  - Shadow: Small, hover → large
  - Transition: All 300ms ease
  - Hover: Transform translateY(-8dp)
  - **Icon**: 48x48dp, color primary
  - **Title**: Font 18sp, weight 600, color foreground
  - **Description**: Font 14sp, color muted, line-height 1.5
  - **Button** (optional): "Learn More →" link style

**Service List** (tối thiểu 4 items):

1. **General Dentistry**: Checkups, cleanings, fillings
2. **Cosmetic Dentistry**: Whitening, veneers, smile makeovers
3. **Orthodontics**: Braces, Invisalign, alignment
4. **Dental Implants**: Permanent tooth replacement

#### 3.2.6 Doctors Section

```
┌─────────────────────────────────────┐
│  OUR TEAM                           │
│  ━━━━━━━                            │
│                                     │
│  Meet Our Expert Dentists           │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │ [👨‍⚕️ Photo]  │  │ [👩‍⚕️ Photo]  ││
│  │              │  │              ││
│  │ Dr. Name     │  │ Dr. Name     ││
│  │ Specialist   │  │ Specialist   ││
│  │ 15+ years    │  │ 12+ years    ││
│  └──────────────┘  └──────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: White
- **Padding**: 64dp vertical
- **Grid**: 1 column mobile, 2-3 columns tablet+
- **Doctor Card**:
  - Background: White
  - Border: 1dp solid gray-200
  - Border-radius: 16dp
  - Padding: 24dp
  - Shadow: Small → medium on hover
  - Transition: Transform 300ms
  - Hover: Scale 1.02
  - **Avatar**:
    - Size: 120x120 dp
    - Border-radius: 60dp (circular)
    - Border: 4dp solid primary/20
    - Object-fit: cover
    - Centered
  - **Name**:
    - Font: 20sp, weight 700
    - Color: Foreground
    - Margin-top: 16dp
  - **Specialty**:
    - Font: 14sp, weight 500
    - Color: Primary
    - Margin-top: 4dp
  - **Experience**:
    - Font: 14sp
    - Color: Muted
    - Margin-top: 8dp
  - **Description**:
    - Font: 14sp, line-height 1.5
    - Color: Muted
    - Margin-top: 12dp
    - 2-3 lines max

**Sample Data** (min 3 doctors):

1. Dr. Sarah Bennett - General Dentistry - 15+ years
2. Dr. Maya Lin - Cosmetic Dentistry - 12+ years
3. Dr. Michael Reyes - Orthodontics - 10+ years

#### 3.2.7 Appointment Section (ID: "appointment")

```
┌─────────────────────────────────────┐
│  📅 BOOK YOUR APPOINTMENT           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Ready to get started?              │
│  Schedule your visit today          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  Book Appointment Now  →       ││
│  └─────────────────────────────────┘│
│                                     │
│  Or call us: 01234568               │
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: Gradient primary to secondary
- **Text**: All white
- **Padding**: 64dp vertical, centered
- **Heading**: Font 28sp, weight 700, white
- **Subheading**: Font 18sp, white/80, margin-top 12dp
- **CTA Button**:
  - Background: White
  - Text: Primary color
  - Font: 16sp, weight 600
  - Padding: 16x48 dp
  - Border-radius: 12dp
  - Shadow: Large
  - Margin-top: 32dp
  - Icon: → arrow, 16dp
  - Hover: Scale 1.05, shadow-xl
- **Contact Info**:
  - Font: 16sp, white/90
  - Margin-top: 16dp
  - Phone clickable (tel: link)

#### 3.2.8 Footer

```
┌─────────────────────────────────────┐
│  🦷 DenTeeth                         │
│  Modern Dental Clinic Management    │
│                                     │
│  📍 123 Main St, City               │
│  📞 01234568                        │
│  ✉️ info@denteeth.com               │
│                                     │
│  Quick Links:                       │
│  About | Services | Doctors         │
│  Contact | Privacy | Terms          │
│                                     │
│  © 2024 DenTeeth. All rights        │
│  reserved.                          │
└─────────────────────────────────────┘
```

**Chi tiết:**

- **Background**: Dark (#1E3A5F)
- **Text**: Light gray (#D1D5DB)
- **Padding**: 48dp vertical, 24dp horizontal
- **Logo**: Same as header, white version
- **Description**: Font 14sp, gray-300
- **Contact Items**:
  - Icon + text horizontal
  - Font 14sp
  - Gap 12dp between items
  - Icons: 16dp, primary color
- **Links Section**:
  - Font 14sp
  - Color: Gray-300
  - Hover: Primary color
  - Separator: " | "
  - Margin-top: 24dp
- **Copyright**:
  - Font 12sp
  - Color: Gray-400
  - Margin-top: 24dp
  - Center aligned

### 3.3 Scroll Behavior

- **Smooth Scroll**: All anchor links scroll smoothly
- **Scroll Progress**: Optional progress bar at top
- **Lazy Load**: Images load on viewport enter
- **Animations**: Sections fade/slide in when scrolling into view (IntersectionObserver)

### 3.4 Responsive Breakpoints

```dart
// Mobile: < 600dp
// Tablet: 600-900dp
// Desktop: > 900dp

const double mobileBreakpoint = 600;
const double tabletBreakpoint = 900;
```

### 3.5 Navigation from Landing Page

- **Login Button** → Navigate to Login Screen
- **Book Appointment** → Navigate to Login Screen (redirect to booking after login)
- **Language Dropdown** → Change app locale, persist in preferences

---

## 4. NAVIGATION STRUCTURE

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

**Chi tiết UI:**

- **Container**:
  - Height: 64dp
  - Background: White (#FFFFFF)
  - Shadow: Elevation 8, upward shadow
  - Safe area bottom padding
- **Items**: 4 tabs, equal width
- **Active Tab**:
  - Icon color: Primary (#8B5FBF)
  - Label color: Primary
  - Background indicator: Small pill behind icon (8dp height, primary/10)
- **Inactive Tab**:
  - Icon color: Gray-400 (#9CA3AF)
  - Label color: Gray-600
- **Icon Size**: 24x24 dp
- **Label**:
  - Font: 12sp
  - Weight: 500 (medium)
  - Margin-top: 4dp
- **Ripple Effect**: On tap, circular ripple expands from tap point
- **Transition**: Smooth color transition 200ms ease

#### Tab Configuration

```dart
List<BottomNavigationBarItem> tabs = [
  BottomNavigationBarItem(
    icon: Icon(Icons.home_rounded),
    activeIcon: Icon(Icons.home), // Filled version
    label: 'Home',
    // Route: /patient/dashboard
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.calendar_today_outlined),
    activeIcon: Icon(Icons.calendar_today),
    label: 'Appointments',
    // Route: /patient/appointments
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.folder_outlined),
    activeIcon: Icon(Icons.folder),
    label: 'Records',
    // Route: /patient/records
  ),
  BottomNavigationBarItem(
    icon: Icon(Icons.person_outline),
    activeIcon: Icon(Icons.person),
    label: 'Profile',
    // Route: /patient/profile
  ),
];
```

### 3.2 Secondary Navigation

**Top App Bar** (Present on all screens):

```
┌────────────────────────────────────┐
│ ← [Screen Title]        🔔(2) ⚙️  │
└────────────────────────────────────┘
```

**Chi tiết:**

- **Height**: 56dp
- **Background**: Primary gradient (subtle)
- **Elevation**: 2dp
- **Leading**:
  - Back button (when nested) - Icon 24dp, white/black based on bg
  - Hamburger menu (root screens) - NOT USED (bottom nav instead)
- **Title**:
  - Font: 20sp, weight 600
  - Color: White (on primary bg) or Foreground
  - Align: Left (with back button) or Center
- **Actions**:
  - **Notification Bell**:
    - Icon: 24dp, white
    - Badge: Red circle, white text, 16dp diameter
    - Badge position: Top-right of icon
    - Tap → Navigate to `/patient/notifications`
  - **Settings Gear** (only on Profile tab):
    - Icon: 24dp, white
    - Tap → Navigate to `/patient/settings`

### 3.3 Logout Action

- **Location**: Profile screen → Settings → Logout button (red, bottom)
- **Confirmation Dialog**:
  ```
  ┌─────────────────────────────┐
  │  ⚠️ Logout Confirmation     │
  ├─────────────────────────────┤
  │  Are you sure you want to  │
  │  logout from your account? │
  │                             │
  │  [Cancel] [Logout]          │
  └─────────────────────────────┘
  ```
- **Actions**:
  - Cancel: Dismiss dialog
  - Logout:
    1. Clear access/refresh tokens from secure storage
    2. Clear cached data (optional)
    3. Navigate to Landing Page
    4. Show toast: "Logged out successfully"

---

## 5. CHI TIẾT TỪNG MÀN HÌNH

### 5.1 Dashboard (Home) - `/patient/dashboard`

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

### 5.1 Dashboard (Home) - `/patient/dashboard`

#### Purpose

Tổng quan nhanh về sức khỏe, lịch hẹn sắp tới, thông báo quan trọng.

#### Complete Layout Structure

```
AppBar: "Welcome back, {FirstName}!"
  └─ Bell Icon (notifications badge: 2)

┌─────────────────────────────────────┐
│ 🎨 Gradient Header Card             │
│   ┌─────────────────────────────┐   │
│   │ Welcome back, John!         │   │
│   │ Here's what's happening     │   │
│   │ with your health today      │   │
│   │                             │   │
│   │ Next Appointment:           │   │
│   │ 📅 Jan 25, 2024 🕐10:00 AM │   │
│   │                             │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘

┌─── Quick Stats (Grid 1x3) ──────────┐
│ ┌──────────┐  ┌──────────┐          │
│ │ 📅       │  │ 📄       │          │
│ │ Upcoming │  │ Medical  │          │
│ │ Appts    │  │ Records  │          │
│ │    2     │  │    12    │          │
│ └──────────┘  └──────────┘          │
│ ┌──────────┐                        │
│ │ 🔔       │                        │
│ │ Notifs   │                        │
│ │    3     │                        │
│ └──────────┘                        │
└─────────────────────────────────────┘

┌─── Upcoming Appointments ───────────┐
│ [📅 Upcoming Appointments]          │
│ Your scheduled appointments         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🕐 [Icon] ⏰ General Checkup    │ │
│ │           General Medicine      │ │
│ │           Jan 25, 2024 10:00 AM │ │
│ │           with Dr. Nguyen Van A │ │
│ │           [✓ Confirmed]         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🕐 [Icon] ⏰ Dental Cleaning    │ │
│ │           Dentistry             │ │
│ │           Jan 30, 2024 2:00 PM  │ │
│ │           with Dr. Le Thi B     │ │
│ │           [⏳ Pending]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Appointments →]           │
└─────────────────────────────────────┘

┌─── Recent Medical Records ──────────┐
│ [📄 Recent Medical Records]         │
│ Your latest medical documents       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ [Icon] X-Ray                 │ │
│ │           Jan 15, 2024          │ │
│ │           Dr. Nguyen Van A      │ │
│ │           [Completed]           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅ [Icon] Blood Test            │ │
│ │           Jan 10, 2024          │ │
│ │           Dr. Le Thi B          │ │
│ │           [Completed]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Records →]                │
└─────────────────────────────────────┘

┌─── Recent Notifications ────────────┐
│ [🔔 Recent Notifications]           │
│ Stay updated with your health       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📅 [Icon] Appointment Reminder  │ │
│ │           Your appointment with │ │
│ │           Dr. A is tomorrow at  │ │
│ │           10:00 AM              │ │
│ │           2 hours ago     ●     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Notifications →]          │
└─────────────────────────────────────┘

┌─── Quick Actions (Grid 1x3) ────────┐
│ ┌────────────┐  ┌────────────┐      │
│ │ 📅         │  │ 📄         │      │
│ │ Book       │  │ View       │      │
│ │ Appointment│  │ Records    │      │
│ └────────────┘  └────────────┘      │
│ ┌────────────┐                      │
│ │ 👤         │                      │
│ │ Update     │                      │
│ │ Profile    │                      │
│ └────────────┘                      │
└─────────────────────────────────────┘
```

#### Detailed UI Specifications

**1. Gradient Header Card**

- **Background**: Gradient `from-primary to-secondary` (#8B5FBF → #1E3A5F)
- **Padding**: 24dp all sides
- **Border-radius**: 16dp
- **Margin**: 16dp horizontal, 16dp top
- **Shadow**: Medium elevation (4dp)
- **Content**:
  - **Greeting**:
    - "Welcome back, {FirstName}!"
    - Font: 24sp, weight 700, color white
    - Margin-bottom: 8dp
  - **Subtitle**:
    - "Here's what's happening with your health today"
    - Font: 14sp, color white/80
    - Margin-bottom: 16dp
  - **Next Appointment Box** (if exists):
    - Background: White/10 backdrop blur
    - Padding: 12dp
    - Border-radius: 12dp
    - Border: 1dp white/20
    - **Text**: "Next Appointment:"
      - Font: 12sp, weight 500, color white/90
    - **Date/Time Row**:
      - Icon: Calendar 16dp, white
      - Text: "Jan 25, 2024 at 10:00 AM"
      - Font: 14sp, weight 600, color white
      - Icon spacing: 8dp gap

**2. Quick Stats Grid**

- **Layout**: 3 columns, 1 row (on mobile: 1 column, 3 rows)
- **Gap**: 16dp between cards
- **Margin**: 24dp horizontal, 16dp vertical
- **Each Stat Card**:
  - Background: White
  - Padding: 20dp
  - Border-radius: 16dp
  - Shadow: Small (2dp elevation)
  - Border: 1dp solid gray-100
  - **Layout**: Row with space-between
  - **Left Side (Text)**:
    - **Label**:
      - Font: 12sp, weight 500
      - Color: Muted foreground (#6B7280)
      - Margin-bottom: 4dp
    - **Value**:
      - Font: 28sp, weight 700
      - Color: Foreground (#1E3A5F)
  - **Right Side (Icon)**:
    - Size: 32x32 dp
    - Color: Primary (#8B5FBF)
    - Icon options:
      - 📅 `Icons.calendar_today` for Appointments
      - 📄 `Icons.folder_open` for Records
      - 🔔 `Icons.notifications` for Notifications
- **Tap Behavior**: Navigate to corresponding screen
- **Hover/Press**: Scale 0.98, shadow large

**3. Upcoming Appointments Section**

- **Card Container**:
  - Background: White
  - Padding: 20dp
  - Border-radius: 16dp
  - Shadow: Small
  - Margin: 16dp horizontal, 8dp vertical
- **Header**:
  - Icon + Title row
  - Icon: 📅 24dp, primary color
  - Title: "Upcoming Appointments"
    - Font: 18sp, weight 600, color foreground
  - Subtitle: "Your scheduled appointments"
    - Font: 14sp, color muted, margin-top 4dp
  - Divider: 1dp gray-200, margin 16dp vertical
- **Appointment List Item** (max 2 shown):
  - Container:
    - Background: White
    - Padding: 16dp
    - Border: 1dp solid gray-200
    - Border-radius: 12dp
    - Margin-bottom: 12dp (except last)
  - **Left Icon**:
    - Circle background: Primary/10
    - Size: 40x40 dp
    - Icon: 🕐 Clock, 20dp, primary color
    - Flex: fixed width
  - **Content Column** (flex: 1):
    - **Type**:
      - Font: 16sp, weight 600, color foreground
      - Text: "General Checkup"
    - **Department**:
      - Font: 14sp, color muted
      - Text: "General Medicine"
      - Margin-top: 4dp
    - **Date/Time Row**:
      - Font: 14sp, color foreground
      - Icon: Calendar 14dp, margin-right 6dp
      - Text: "Jan 25, 2024 at 10:00 AM"
      - Margin-top: 8dp
    - **Doctor**:
      - Font: 14sp, color muted
      - Text: "with Dr. Nguyen Van A"
      - Margin-top: 4dp
  - **Status Badge** (right aligned):
    - **Confirmed**:
      - Background: Green-100 (#DCFCE7)
      - Text: "Confirmed", green-800
      - Icon: ✓ checkmark
    - **Pending**:
      - Background: Yellow-100 (#FEF3C7)
      - Text: "Pending", yellow-800
      - Icon: ⏳ hourglass
    - Padding: 6x12 dp
    - Border-radius: 8dp
    - Font: 12sp, weight 600
- **View All Button**:
  - Text: "View All Appointments"
  - Icon: → arrow right
  - Color: Primary
  - Font: 14sp, weight 600
  - Padding: 12x16 dp
  - Border: 1dp primary
  - Border-radius: 8dp
  - Full width
  - Margin-top: 12dp
  - Ripple effect on tap

**4. Recent Medical Records Section**

- **Same Card Structure** as Appointments
- **Header**:
  - Icon: 📄 Folder
  - Title: "Recent Medical Records"
  - Subtitle: "Your latest medical documents"
- **Record List Item** (max 2 shown):
  - **Left Icon**:
    - Circle bg: Green-100
    - Icon: ✅ Check circle, green-600
    - Size: 40x40 dp
  - **Content**:
    - **Type**: "X-Ray" (16sp, weight 600)
    - **Date**: "Jan 15, 2024" (14sp, muted)
    - **Doctor**: "Dr. Nguyen Van A" (14sp, muted)
  - **Status Badge**: "Completed" (green)
- **View All Button**: Navigate to `/patient/records`

**5. Recent Notifications Section**

- **Same Card Structure**
- **Header**:
  - Icon: 🔔 Bell
  - Title: "Recent Notifications"
  - Subtitle: "Stay updated with your health"
- **Notification Item** (max 1 shown):
  - **Icon**: Based on type
    - 📅 Calendar (blue) for reminders
    - 📄 File (green) for results
    - 💳 Credit card (green) for payments
  - **Content**:
    - **Title**: "Appointment Reminder" (16sp, weight 600)
    - **Message**: "Your appointment with Dr. A is tomorrow..." (14sp, muted, 2 lines max)
    - **Time**: "2 hours ago" (12sp, muted)
  - **Unread Indicator**: Blue dot (8dp) on right if unread
- **View All Button**: Navigate to `/patient/notifications`

**6. Quick Actions Grid**

- **Layout**: 1x3 grid (on mobile: 1 column, 3 rows)
- **Gap**: 16dp
- **Margin**: 16dp horizontal
- **Each Action Card**:
  - Background: White
  - Border: 1dp primary/20
  - Border-radius: 12dp
  - Padding: 24dp vertical
  - Shadow: Small
  - Hover: Shadow medium, scale 1.02
  - **Icon**:
    - Size: 32dp
    - Color: Primary
    - Center aligned
  - **Label**:
    - Font: 14sp, weight 600
    - Color: Foreground
    - Center aligned
    - Margin-top: 12dp
    - Max 2 lines
- **Actions**:
  1. 📅 Book Appointment → `/patient/appointments` (booking flow)
  2. 📄 View Records → `/patient/records`
  3. 👤 Update Profile → `/patient/profile`

#### Data Models

```dart
class DashboardData {
  User user;
  QuickStats stats;
  List<Appointment> upcomingAppointments; // max 2
  List<MedicalRecord> recentRecords;      // max 2
  List<Notification> notifications;       // max 1
}

class QuickStats {
  int upcomingAppointments;
  int medicalRecords;
  int pendingPayments;
  int unreadNotifications;
}

class User {
  String id;
  String username;
  String firstName;
  String lastName;
  String email;
  List<String> roles;
}
```

#### API Endpoints

```dart
GET /api/v1/patients/dashboard
Response: DashboardData

// Or separate calls:
GET /api/v1/patients/{id}/stats
Response: QuickStats

GET /api/v1/patients/{id}/appointments?limit=2&status=upcoming
Response: List<Appointment>

GET /api/v1/patients/{id}/records?limit=2
Response: List<MedicalRecord>

GET /api/v1/patients/{id}/notifications?limit=1&isRead=false
Response: List<Notification>
```

#### Behaviors & Interactions

1. **Pull to Refresh**:

   - Swipe down from top
   - Show circular progress indicator
   - Reload all data
   - Toast: "Dashboard updated"

2. **Card Tap Actions**:

   - Stats cards → Navigate to respective screen
   - Appointment card → Open appointment details bottom sheet
   - Record card → Open record details
   - Notification → Mark as read, navigate to related screen

3. **View All Buttons**:

   - Ripple effect on tap
   - Navigate with slide transition

4. **Quick Actions**:

   - Scale animation on press
   - Navigate or open modal
   - Haptic feedback on tap

5. **Error Handling**:

   - Network error → Show retry banner at top
   - Empty data → Show empty state with illustration
   - Loading → Shimmer skeleton effect

6. **Scroll Behavior**:

   - AppBar collapses slightly when scrolling down
   - Returns when scrolling up
   - Bottom nav always visible (fixed)

7. **Refresh Strategy**:
   - Auto refresh on tab focus
   - Background fetch every 5 minutes
   - Cache data for offline view

---

### 5.2 Appointments - `/patient/appointments`

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

┌─── Quick Stats (Grid 1x3) ──────────┐
│ ┌──────────┐  ┌──────────┐          │
│ │ 📅       │  │ 📄       │          │
│ │ Upcoming │  │ Medical  │          │
│ │    2     │  │    12    │          │
│ └──────────┘  └──────────┘          │
│ ┌──────────┐                        │
│ │ 🔔       │                        │
│ │ Notifs   │                        │
│ │    3     │                        │
│ └──────────┘                        │
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

┌─── Quick Actions (Grid 1x3) ────────┐
│ ┌────────────┐  ┌────────────┐      │
│ │ 📅 Book    │  │ 📄 View    │      │
│ │ Appointment│  │ Records    │      │
│ └────────────┘  └────────────┘      │
│ ┌────────────┐                      │
│ │ 👤 Update  │                      │
│ │ Profile    │                      │
│ └────────────┘                      │
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

### 5.2 Appointments - `/patient/appointments`

#### Purpose

Quản lý lịch hẹn: xem, đặt mới, hủy, reschedule. Hỗ trợ 2 chế độ xem: **List View** và **Calendar View**.

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

### 4.4 Profile - `/profile`

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

### 4.5 Notifications - `/notifications`

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

### 4.6 Settings - `/settings`

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

## 6. UI/UX GUIDELINES

### 6.1 Design System

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

### 6.2 Components

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

### 6.3 Animations

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

### 6.4 Empty States

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

## 7. API INTEGRATION

### 7.1 Base URL

```dart
const String baseUrl = 'http://localhost:8080/api/v1';
// Production: 'https://pdcms.denteeth.com/api/v1'
```

### 7.2 HTTP Client Setup (Dio)

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

### 7.3 Auth Interceptor

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

### 7.4 Error Handling

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

## 8. STATE MANAGEMENT

### 8.1 Recommended: Riverpod

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

### 8.2 Alternative: Provider

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

## 9. OFFLINE & CACHING

### 9.1 Cache Strategy

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

### 9.2 Offline Indicator

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

## 10. TESTING STRATEGY

### 10.1 Unit Tests

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

### 10.2 Widget Tests

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

### 10.3 Integration Tests

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

## 11. PERFORMANCE OPTIMIZATION

### 11.1 Image Optimization

```dart
// Lazy loading images
CachedNetworkImage(
  imageUrl: record.imageUrl,
  placeholder: (context, url) => Shimmer(...),
  errorWidget: (context, url, error) => Icon(Icons.error),
  memCacheWidth: 200, // Resize image
);
```

### 11.2 List Performance

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

### 11.3 Pagination

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

## 12. SECURITY BEST PRACTICES

### 12.1 Secure Storage

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

### 12.2 SSL Pinning

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

### 12.3 Biometric Authentication

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

## 13. ANALYTICS & MONITORING

### 13.1 Firebase Analytics

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
}
```

### 13.2 Crash Reporting (Firebase Crashlytics)

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

## 14. PUSH NOTIFICATIONS (FCM)

### 14.1 Setup

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

### 14.2 Notification Payload

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

## 15. LOCALIZATION (Optional)

### 15.1 Setup

```yaml
# pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

flutter:
  generate: true
```

### 15.2 Usage

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

## 16. BUILD & DEPLOYMENT

### 16.1 Build Commands

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

### 16.2 Flavors (Optional)

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

### 16.3 CI/CD (GitHub Actions example)

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

## 17. CHECKLIST TRƯỚC KHI BẮT ĐẦU

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

## 18. CONTACT & SUPPORT

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
