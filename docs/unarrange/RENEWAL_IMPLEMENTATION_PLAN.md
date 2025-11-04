# 📋 Kế Hoạch Triển Khai Shift Renewal - Frontend

> **Tài liệu giải thích và kế hoạch triển khai**  
> Ngày tạo: 2025-01-XX

---

## 🎯 Phần 1: Hiểu Về Cron Jobs & Renewal System

### 1.1 Cron Jobs là gì?

**Cron Jobs** = Các tác vụ tự động chạy theo lịch định kỳ (scheduled tasks)

Ví dụ trong cuộc sống thực:
- ⏰ Báo thức 7:00 AM mỗi sáng
- 📧 Gửi email báo cáo hàng tuần vào thứ 2
- 🗄️ Backup database mỗi đêm

Trong hệ thống PDCMS, có **4 cron jobs chính** chạy tự động mỗi đêm:

### 1.2 Các Cron Jobs Hoạt Động

```
⏰ 00:01 AM ──► P8: UnifiedScheduleSyncJob
   └─ Đồng bộ lịch làm việc từ 2 nguồn (Fixed + Flex) vào calendar thực tế
   
⏰ 00:05 AM ──► P9: DailyRenewalDetectionJob  
   └─ Phát hiện lịch Fixed sắp hết hạn (28 ngày nữa) → Tạo renewal request
   
⏰ 00:10 AM ──► P10: ExpirePendingRenewalsJob
   └─ Đánh dấu renewal requests quá hạn → EXPIRED
   
⏰ 00:15 AM ──► P11: CleanupExpiredFlexRegistrations
   └─ Tự động vô hiệu hóa Flex registrations hết hạn
```

---

## 🔄 Phần 2: Workflow Renewal (Chỉ áp dụng cho Fixed Schedule)

### 2.1 Vấn đề cần giải quyết

**Tình huống thực tế:**
- Nhân viên Full-Time có lịch cố định: **"Ca Sáng, T2-T6, từ 01/11/2024 → 30/11/2025"**
- Lịch sắp hết hạn vào **30/11/2025**
- Nếu không làm gì → Nhân viên sẽ **mất lịch** từ 01/12/2025

**Trước đây:** Admin phải nhớ và tạo lịch mới thủ công ❌

**Bây giờ:** Hệ thống tự động nhắc nhở và xử lý ✅

### 2.2 Quy trình Renewal (28 ngày trước khi hết hạn)

```
📅 Timeline: 28 ngày trước khi lịch hết hạn

┌─────────────────────────────────────────────────────────────┐
│ DAY -28 (T-28)                                               │
│ ────────────────────────────────────────────────────────────│
│ Job P9 chạy lúc 00:05 AM                                    │
│ → Phát hiện: "Lịch này hết hạn trong 28 ngày nữa!"         │
│ → Tạo renewal request với status = PENDING_ACTION            │
│ → Expires_at = T-2 (26 ngày để nhân viên phản hồi)           │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ DAY -26 đến DAY -2 (Window phản hồi)                         │
│ ────────────────────────────────────────────────────────────│
│ Nhân viên mở app → Thấy notification badge                  │
│ → Vào trang Renewal → Xem danh sách renewal requests        │
│ → Có 2 lựa chọn:                                             │
│   1. ✅ CONFIRMED: "Tôi muốn gia hạn!"                       │
│   2. ❌ DECLINED: "Tôi không muốn gia hạn (có lý do)"        │
└─────────────────────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌───────────────┐         ┌───────────────┐
│ CONFIRMED     │         │ DECLINED      │
│               │         │               │
│ Chờ Admin     │         │ → Kết thúc    │
│ finalize      │         │   ngay tại đây│
└───────────────┘         └───────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin xem danh sách renewals đã CONFIRMED                    │
│ → Chọn ngày hết hạn mới (VD: 30/11/2026)                    │
│ → Click "Finalize"                                           │
│ → Hệ thống tự động:                                           │
│   1. Vô hiệu hóa lịch cũ (is_active = false)                  │
│   2. Tạo lịch mới (effective_from = 01/12/2025)             │
│   3. Copy days of week từ lịch cũ                            │
│   4. Status = FINALIZED                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Lợi ích của hệ thống này

✅ **Tự động hóa:** Không cần admin nhớ từng lịch hết hạn  
✅ **Nhân viên chủ động:** Nhân viên quyết định có muốn gia hạn hay không  
✅ **Tránh mất lịch:** Renewal sớm 28 ngày, đủ thời gian xử lý  
✅ **Audit trail:** Lưu lại toàn bộ lịch sử renewal  

---

## 🎨 Phần 3: Kế Hoạch Triển Khai Frontend

### 3.1 Phân tích Yêu Cầu

#### **A. Cho Nhân Viên (Employee)**
1. ✅ Xem danh sách renewal requests đang chờ (PENDING_ACTION)
2. ✅ Phản hồi renewal (CONFIRMED hoặc DECLINED)
3. ✅ Xem lịch sử renewal đã phản hồi
4. 🔔 Notification badge hiển thị số lượng pending

#### **B. Cho Admin/Manager**
1. ✅ Xem danh sách tất cả renewal requests (tất cả status)
2. ✅ Filter theo status (PENDING_ACTION, CONFIRMED, DECLINED, FINALIZED, EXPIRED)
3. ✅ Filter theo employee
4. ✅ Finalize renewal đã được nhân viên CONFIRMED
5. ✅ Xem chi tiết renewal (lịch cũ, lịch mới sau khi finalize)

---

### 3.2 Cấu Trúc File/Folder

```
src/
├── types/
│   └── renewal.ts                    # TypeScript interfaces
├── services/
│   └── renewalService.ts              # API service
├── app/
│   ├── employee/
│   │   └── renewals/
│   │       └── page.tsx                # Trang renewal cho nhân viên
│   └── admin/
│       └── renewals/
│           └── page.tsx                # Trang renewal cho admin
└── components/
    ├── renewal/
    │   ├── RenewalCard.tsx            # Card hiển thị renewal
    │   ├── RenewalResponseModal.tsx   # Modal phản hồi (Employee)
    │   ├── RenewalFinalizeModal.tsx   # Modal finalize (Admin)
    │   └── RenewalBadge.tsx           # Notification badge
```

---

### 3.3 Các Bước Triển Khai (Theo Thứ Tự)

#### **Phase 1: Setup Types & Services** (Cơ bản nhất)
- [ ] Tạo `src/types/renewal.ts` với các interfaces
- [ ] Tạo `src/services/renewalService.ts` với 3 methods:
  - `getPendingRenewals()` - Employee
  - `respondToRenewal()` - Employee
  - `finalizeRenewal()` - Admin
  - `getAllRenewals()` - Admin (optional)

#### **Phase 2: Employee Renewal Page**
- [ ] Tạo `/employee/renewals/page.tsx`
- [ ] Hiển thị danh sách pending renewals
- [ ] Card UI cho mỗi renewal với:
  - Thông tin lịch cũ (shift name, days, effective period)
  - Message từ BE
  - 2 buttons: "Đồng ý" và "Từ chối"
- [ ] Modal "Từ chối" yêu cầu nhập lý do
- [ ] Toast notification khi phản hồi thành công
- [ ] Auto refresh sau khi phản hồi

#### **Phase 3: Admin Renewal Page**
- [ ] Tạo `/admin/renewals/page.tsx`
- [ ] Table view với columns:
  - Renewal ID
  - Employee Name
  - Work Shift
  - Current Period
  - Status
  - Expires At
  - Actions
- [ ] Filter dropdown:
  - Status filter
  - Employee filter
- [ ] Chỉnh sửa/Finalize button (chỉ hiện với status = CONFIRMED)
- [ ] Finalize modal với:
  - Date picker để chọn ngày hết hạn mới
  - Validation: ngày mới phải > ngày cũ
  - Quick actions: "+3 tháng", "+6 tháng", "+1 năm"

#### **Phase 4: Notification Badge**
- [ ] Tạo `RenewalBadge.tsx` component
- [ ] Tích hợp vào header/navigation
- [ ] Poll API mỗi 5 phút (hoặc khi mount)
- [ ] Chỉ hiển thị khi count > 0

#### **Phase 5: Integration & Polish**
- [ ] Thêm loading states
- [ ] Error handling
- [ ] Empty states (không có renewal nào)
- [ ] Responsive design
- [ ] Testing với mock data

---

### 3.4 API Endpoints Cần Sử Dụng

#### **Employee APIs:**
```
GET    /api/v1/registrations/renewals/pending
       → Lấy danh sách renewal đang chờ nhân viên phản hồi

PATCH  /api/v1/registrations/renewals/{renewalId}/respond
       → Phản hồi renewal (CONFIRMED hoặc DECLINED)
       Body: { action: "CONFIRMED" | "DECLINED", declineReason?: string }
```

#### **Admin APIs:**
```
GET    /api/v1/admin/registrations/renewals
       → Lấy danh sách tất cả renewals (với filters)
       Query params: ?status=PENDING_ACTION&employeeId=10

POST   /api/v1/admin/registrations/renewals/finalize
       → Finalize renewal đã được nhân viên CONFIRMED
       Body: { renewalRequestId: "SRR_xxx", newEffectiveTo: "2026-11-30" }
```

---

### 3.5 UI/UX Design Recommendations

#### **Employee Page:**
```
┌─────────────────────────────────────────────────────────┐
│  Renewal Requests (2)                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⏰ Ca sáng (8:00 - 12:00)                        │  │
│  │                                                  │  │
│  │ Lịch làm việc cố định 'Ca sáng' của bạn sẽ hết  │  │
│  │ hạn vào 30/11/2025. Bạn có muốn gia hạn không?   │  │
│  │                                                  │  │
│  │ Chi tiết: Thứ 2, Thứ 4, Thứ 6 (Ca sáng)         │  │
│  │ Hiệu lực: 01/11/2024 → 30/11/2025               │  │
│  │ Deadline phản hồi: 28/11/2025                    │  │
│  │                                                  │  │
│  │ [ ✅ Đồng ý gia hạn ] [ ❌ Từ chối ]            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⏰ Ca chiều (13:00 - 17:00)                      │  │
│  │ ...                                               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### **Admin Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  Renewal Management                          [+ Filters ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Status: [ All ▼ ]  Employee: [ All ▼ ]                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ID      │ Employee  │ Shift    │ Period    │ Status  │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ SRR_001 │ Nguyễn A  │ Ca sáng  │ 01/11-    │ ✅ CONFIR│ │
│  │         │           │           │ 30/11/25  │ MED     │ │
│  │         │           │           │           │ [Finalize]│ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ SRR_002 │ Trần B    │ Ca chiều │ 15/12-    │ ⏳ PENDI │ │
│  │         │           │           │ 31/12/25  │ NG      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.6 Important Considerations

#### **1. Status Flow:**
```
PENDING_ACTION → CONFIRMED → FINALIZED ✅
              → DECLINED ❌
              → EXPIRED ⏰ (tự động, nếu quá hạn)
```

#### **2. Permissions:**
- Employee: Chỉ xem và phản hồi renewal của chính mình
- Admin: Xem tất cả, có quyền finalize

#### **3. Validation:**
- Admin finalize: `newEffectiveTo` phải > `oldEffectiveTo`
- Employee decline: Bắt buộc nhập `declineReason`

#### **4. Real-time Updates:**
- Poll API mỗi 5 phút cho notification badge
- Refresh page sau khi phản hồi/finalize thành công

#### **5. Error Handling:**
- 409 Conflict: Renewal đã được phản hồi/finalize rồi
- 404 Not Found: Renewal không tồn tại
- 400 Bad Request: Validation error

---

## 📝 Tóm Tắt

### **Cron Jobs làm gì?**
- **P8**: Tự động sync lịch làm việc mỗi đêm
- **P9**: Tự động phát hiện lịch sắp hết hạn → Tạo renewal request
- **P10**: Tự động đánh dấu renewal quá hạn
- **P11**: Tự động cleanup flex registrations hết hạn

### **Frontend cần làm gì?**
1. ✅ Hiển thị renewal requests cho nhân viên
2. ✅ Cho phép nhân viên phản hồi (đồng ý/từ chối)
3. ✅ Cho phép admin finalize renewal
4. 🔔 Thêm notification badge

### **Lợi ích:**
- ✅ Tự động hóa quy trình gia hạn lịch
- ✅ Nhân viên chủ động quyết định
- ✅ Admin tiết kiệm thời gian
- ✅ Tránh mất lịch làm việc

---

## 🚀 Next Steps

1. **Review kế hoạch này với team**
2. **Bắt đầu Phase 1: Setup Types & Services**
3. **Implement từng phase một cách tuần tự**
4. **Test kỹ với các scenarios trong tài liệu BE**

**Ưu tiên:** Employee page trước (vì nhân viên cần phản hồi sớm), sau đó mới đến Admin page.

