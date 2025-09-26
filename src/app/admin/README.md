# Admin Panel - PDCMS

## Tổng quan
Admin panel được thiết kế để quản lý toàn bộ hệ thống phòng khám nha khoa với các chức năng chính:

## Các tính năng chính

### 1. Dashboard
- **Đường dẫn**: `/admin`
- **Mô tả**: Trang tổng quan với thống kê và hoạt động gần đây
- **Tính năng**:
  - Thống kê tổng quan (nhân viên, lịch hẹn, blog, vai trò)
  - Hoạt động gần đây
  - Lịch hẹn sắp tới

### 2. Quản lý tài khoản
- **Đường dẫn**: `/admin/accounts`
- **Mô tả**: CRUD tài khoản nhân viên
- **Tính năng**:
  - Xem danh sách nhân viên
  - Tìm kiếm và lọc theo vai trò
  - Thống kê nhân viên
  - Quản lý thông tin cá nhân
  - Phân quyền theo vai trò

### 3. Quản lý blog
- **Đường dẫn**: `/admin/blogs`
- **Mô tả**: Quản lý nội dung bài viết
- **Tính năng**:
  - Xem danh sách bài viết
  - Tìm kiếm và lọc theo trạng thái
  - Quản lý trạng thái (draft, published, archived)
  - Thống kê bài viết
  - Quản lý tags và tác giả

### 4. Quản lý lịch hẹn
- **Đường dẫn**: `/admin/appointments`
- **Mô tả**: Xem và quản lý lịch hẹn bệnh nhân
- **Tính năng**:
  - Xem danh sách lịch hẹn
  - Tìm kiếm và lọc theo trạng thái, ngày
  - Quản lý trạng thái lịch hẹn
  - Thống kê lịch hẹn
  - Xem chi tiết thông tin bệnh nhân

### 5. Quản lý vai trò (RBAC)
- **Đường dẫn**: `/admin/roles`
- **Mô tả**: Quản lý vai trò và quyền truy cập
- **Tính năng**:
  - Tạo và chỉnh sửa vai trò
  - Phân quyền chi tiết theo module
  - Quản lý quyền truy cập
  - Xem chi tiết quyền của từng vai trò
  - Thống kê người dùng theo vai trò

### 6. Cài đặt hệ thống
- **Đường dẫn**: `/admin/settings`
- **Mô tả**: Cấu hình hệ thống
- **Tính năng**:
  - Thông tin phòng khám
  - Cài đặt ngôn ngữ và múi giờ
  - Cấu hình thông báo
  - Tùy chọn bảo mật

## Cấu trúc dữ liệu

### User (Nhân viên)
```typescript
interface User {
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
```

### Blog (Bài viết)
```typescript
interface Blog {
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
```

### Appointment (Lịch hẹn)
```typescript
interface Appointment {
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
```

### Role (Vai trò)
```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  userCount: number;
}
```

## Vai trò hệ thống

### 1. Super Admin
- Toàn quyền hệ thống
- Quản lý tất cả tài khoản
- Quản lý vai trò và quyền
- Cài đặt hệ thống

### 2. Quản lý
- Xem dashboard
- Xem tài khoản
- Xem blog
- Xem lịch hẹn

### 3. Bác sĩ
- Xem dashboard
- Xem lịch hẹn

### 4. Y tá
- Xem dashboard
- Xem lịch hẹn

### 5. Lễ tân
- Xem dashboard
- Quản lý lịch hẹn

## Cách sử dụng

1. **Truy cập admin panel**: Điều hướng đến `/admin`
2. **Đăng nhập**: Sử dụng tài khoản admin
3. **Điều hướng**: Sử dụng sidebar để chuyển đổi giữa các trang
4. **Quản lý dữ liệu**: Sử dụng các nút CRUD trên mỗi trang
5. **Tìm kiếm**: Sử dụng thanh tìm kiếm trên mỗi trang
6. **Lọc dữ liệu**: Sử dụng các dropdown filter

## Thư viện sử dụng

- **Next.js 15**: Framework React
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Framer Motion**: Animations
- **TypeScript**: Type safety

## Cần thêm thư viện

Để hoàn thiện admin panel, bạn có thể cần thêm:

1. **React Hook Form**: Quản lý form
2. **Zod**: Validation
3. **React Query/TanStack Query**: Data fetching
4. **React Table**: Bảng dữ liệu nâng cao
5. **React Select**: Dropdown nâng cao
6. **React DatePicker**: Chọn ngày
7. **React Modal**: Modal components
8. **React Toast**: Thông báo

## Cài đặt thư viện bổ sung

```bash
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query
npm install @tanstack/react-table
npm install react-select
npm install react-datepicker
npm install react-hot-toast
```

## Phát triển tiếp

1. **Kết nối API**: Thay thế dữ liệu cứng bằng API calls
2. **Authentication**: Thêm hệ thống đăng nhập
3. **Authorization**: Implement RBAC logic
4. **Real-time**: Thêm WebSocket cho cập nhật real-time
5. **Export/Import**: Thêm tính năng xuất/nhập dữ liệu
6. **Audit Log**: Thêm log hoạt động
7. **Backup**: Thêm tính năng sao lưu dữ liệu
