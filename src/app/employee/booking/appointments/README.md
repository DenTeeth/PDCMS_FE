# Employee Appointments Module

Hệ thống quản lý lịch hẹn đầy đủ cho nhân viên phòng khám nha khoa.

## 📋 Tính năng chính

### 1. **Appointment Calendar** 📅
- Xem lịch hẹn theo **Day/Week/Month**
- Appointments được **color-coded** theo trạng thái
- Click vào appointment để xem chi tiết
- Navigation tiện lợi (Today/Previous/Next)
- Legend hiển thị các trạng thái

### 2. **Create Appointment** ➕
Multi-step wizard với 6 bước:

#### Bước 1: Select/Search Patient
- Tìm kiếm bệnh nhân theo tên hoặc số điện thoại
- Hiển thị thông tin chi tiết bệnh nhân
- Debounced search (300ms)

#### Bước 2: Select Service
- Danh sách dịch vụ với mô tả
- Hiển thị duration và price
- Click để chọn service

#### Bước 3: Select Date & Time
- Chọn ngày (chỉ cho phép từ hôm nay trở đi)
- **Chỉ hiển thị available time slots**
- Group by dentist với availability

#### Bước 4: Assign Dentist
- Tự động assign dựa trên time slot đã chọn
- Hiển thị thông tin dentist và specialization

#### Bước 5: Add Notes
- Reason for visit (optional)
- Additional notes (optional)

#### Bước 6: Confirm
- Review tất cả thông tin
- **Conflict detection** trước khi tạo
- Warning nếu có double booking

### 3. **Appointment List** 📋
- **4 Tabs**: Today, Upcoming, Past, Cancelled
- **Search** by patient name, dentist, service, phone
- **Responsive design**:
  - Desktop: Table view với columns đầy đủ
  - Mobile: Card view compact
- Quick actions: View, Edit

### 4. **Reschedule Appointment** 🔄
- Modal để chọn ngày mới
- Hiển thị available slots
- Bắt buộc nhập reason
- Update calendar tự động

### 5. **Cancel Appointment** ❌
- Confirmation modal
- Bắt buộc nhập lý do
- Option để notify patient
- Warning về action không thể undo

### 6. **View Details** 👁️
- Hiển thị đầy đủ thông tin appointment
- Patient information với contact
- Dentist và Service details
- Notes và reasons
- Quick actions: Reschedule, Cancel (nếu applicable)

## 📁 Cấu trúc file

```
src/app/employee/appointments/
├── page.tsx                          # Main page với view switcher
├── components/
│   ├── AppointmentCalendar.tsx      # FullCalendar integration
│   ├── AppointmentList.tsx          # List với tabs và filters
│   ├── CreateAppointmentModal.tsx   # 6-step wizard
│   └── AppointmentModals.tsx        # Details, Reschedule, Cancel modals

src/types/
└── appointment.ts                    # All TypeScript types

src/services/
└── appointmentService.ts             # API integration
```

## 🎨 Appointment Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| SCHEDULED | Blue (#3b82f6) | Đã đặt lịch |
| CONFIRMED | Green (#10b981) | Đã xác nhận |
| CHECKED_IN | Orange (#f59e0b) | Đã check-in |
| IN_PROGRESS | Purple (#8b5cf6) | Đang điều trị |
| COMPLETED | Green (#22c55e) | Hoàn thành |
| CANCELLED | Red (#ef4444) | Đã hủy |
| NO_SHOW | Gray (#6b7280) | Không đến |

## 🔧 Technologies Used

- **FullCalendar** (@fullcalendar/react) - Calendar views
- **React Hook Form** - Form management
- **Zod** - Form validation
- **Radix UI** - Dialog, Tabs components
- **date-fns** - Date formatting
- **Sonner** - Toast notifications
- **FontAwesome** - Icons

## 🚀 Usage

### View Appointments
```tsx
// Switch between Calendar and List view
<Tabs value={viewMode} onValueChange={setViewMode}>
  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
  <TabsTrigger value="list">List View</TabsTrigger>
</Tabs>
```

### Create Appointment
```tsx
<Button onClick={() => setCreateModalOpen(true)}>
  New Appointment
</Button>

<CreateAppointmentModal
  open={createModalOpen}
  onClose={() => setCreateModalOpen(false)}
  onSuccess={handleSuccess}
/>
```

### View Details
```tsx
<AppointmentCalendar 
  onEventClick={handleViewDetails}
/>

<AppointmentDetailsModal
  open={detailsModalOpen}
  appointment={selectedAppointment}
  onReschedule={handleReschedule}
  onCancel={handleCancel}
/>
```

## 📡 API Endpoints

### Appointments
- `GET /appointments` - Get all appointments with filters
- `GET /appointments/{id}` - Get appointment by ID
- `POST /appointments` - Create new appointment
- `PUT /appointments/{id}` - Update appointment
- `POST /appointments/{id}/reschedule` - Reschedule
- `POST /appointments/{id}/cancel` - Cancel
- `POST /appointments/check-conflicts` - Check conflicts
- `GET /appointments/available-slots` - Get available slots
- `GET /appointments/today` - Today's appointments
- `GET /appointments/upcoming` - Upcoming appointments

### Supporting APIs
- `GET /services` - Get all services
- `GET /patients/search` - Search patients
- `GET /dentists` - Get all dentists

## ✅ Definition of Done

- [x] Appointment creation smooth với 6 steps
- [x] Conflict detection working
- [x] Calendar interactive với day/week/month views
- [x] Appointment list với tabs và search
- [x] Reschedule flow working
- [x] Cancel flow với confirmation
- [x] View details modal
- [x] Responsive design (Desktop + Mobile)
- [x] Color-coded appointments
- [x] Available slots only
- [x] Success notifications

## 🎯 Next Steps

- [ ] Integrate with real backend API
- [ ] Add permission checks (VIEW_APPOINTMENT, CREATE_APPOINTMENT, etc.)
- [ ] Add email/SMS notifications
- [ ] Add appointment reminders
- [ ] Add recurring appointments
- [ ] Export calendar to PDF/ICS
- [ ] Add statistics dashboard

## 🐛 Known Issues

- Các API endpoints cần được implement ở backend
- Cần thêm error handling cho network failures
- Cần thêm loading states cho các async operations

## 📝 Notes

- Component này được tạo cho **employee role**
- Có thể reuse cho **receptionist role** với ít modification
- Calendar timezone mặc định là local timezone
- Time slots mặc định: 08:00 - 20:00
