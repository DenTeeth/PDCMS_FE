# 📋 Daily Report - 2025-12-30

## 🎯 Tổng Quan

**Date**: 2025-12-30  
**Commits**: 
- `b3d6232` - Initial changes (Renewal permissions, Employee form, Account pages, SePay, UTF-8 fix)
- `ef5df69` - Daily report document
- `eb858f9` - Payment & Invoice pages, Payment Service, CANCELLED_LATE status
- `de67db1` - Fix formatCurrency import path  
**Branch**: `main`  
**Status**: ✅ All changes pushed to GitHub

### 📈 Tiến Độ Tổng Thể

| Module | Status | Progress |
|--------|--------|----------|
| Renewal Permissions | ✅ Complete | 100% |
| Employee Form UI | ✅ Complete | 100% |
| Account Pages | ✅ Complete | 100% |
| SePay Integration | ✅ Complete | 100% |
| UTF-8 Encoding Fix | ✅ Complete | 100% |
| CANCELLED_LATE Status | ✅ Complete | 100% |
| Payment & Invoice Pages | ✅ Complete | 100% |

---

## 📝 Các Thay Đổi Chính

### 1. ✅ Renewal Module - Permissions Update

**Vấn đề**: Frontend bị block vì thiếu permissions `VIEW_RENEWAL_OWN` và `RESPOND_RENEWAL_OWN` trong Backend.

**Giải pháp**:
- ✅ Thêm `VIEW_RENEWAL_ALL` vào `Permission` enum
- ✅ Cập nhật `BE_PERMISSIONS` constant với module `SHIFT_RENEWAL` (3 permissions)
- ✅ Cập nhật `PERMISSION_MAPPING` từ `null` → đúng permission values
- ✅ Uncomment permission checks trong `src/app/employee/renewals/page.tsx`
- ✅ Thêm permission check cho respond buttons (`RESPOND_RENEWAL_OWN`)

**Files changed**:
- `src/types/permission.ts` - Thêm `VIEW_RENEWAL_ALL`
- `src/constants/permissions.ts` - Cập nhật BE_PERMISSIONS và PERMISSION_MAPPING
- `src/app/employee/renewals/page.tsx` - Uncomment ProtectedRoute và thêm permission checks

**Permissions mới**:
- `VIEW_RENEWAL_OWN` - Xem yêu cầu gia hạn của bản thân (Employee)
- `RESPOND_RENEWAL_OWN` - Phản hồi yêu cầu gia hạn của bản thân (Employee)
- `VIEW_RENEWAL_ALL` - Xem tất cả yêu cầu gia hạn (Admin/Manager)

---

### 2. ✅ Employee Creation Form - Dynamic UI

**Vấn đề**: Form tạo nhân viên luôn hiển thị 2 cột (thông tin + chuyên khoa), gây lãng phí không gian khi role không cần specialization.

**Giải pháp**:
- ✅ Modal width động: `max-w-5xl` (có specialization) vs `max-w-2xl` (không có)
- ✅ Layout grid động: 2 cột khi có specialization, 1 cột khi không có
- ✅ Phần chuyên khoa chỉ hiển thị khi `requiresSpecialization = true`

**Files changed**:
- `src/app/admin/accounts/employees/page.tsx`

**Logic**:
```tsx
// Modal width động
<Card className={`w-full my-8 max-h-[90vh] flex flex-col ${requiresSpecialization ? 'max-w-5xl' : 'max-w-2xl'}`}>

// Layout grid động
<div className={`grid gap-6 border-t pt-5 mt-5 ${requiresSpecialization ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
```

---

### 3. ✅ Account Detail Pages

**Vấn đề**: Thiếu trang chi tiết tài khoản cho admin, employee, và patient.

**Giải pháp**:
- ✅ Tạo `src/app/admin/account/page.tsx` - Trang chi tiết tài khoản admin
- ✅ Tạo `src/app/employee/account/page.tsx` - Trang chi tiết tài khoản employee
- ✅ Tạo `src/types/account.ts` - Type definitions cho `UserProfileResponse`
- ✅ Cập nhật Navbar để navigate đúng route dựa trên `baseRole`

**Features**:
- Hiển thị thông tin tài khoản: username, email, status, roles
- Hiển thị thông tin cá nhân: full name, employee code, phone, DOB, address
- Hiển thị specializations (nếu có) - **KHÔNG hiển thị Account ID** theo yêu cầu
- Employee page: Load thêm employee details từ `employeeService.getEmployeeByCode()`

**Files changed**:
- `src/app/admin/account/page.tsx` (NEW)
- `src/app/employee/account/page.tsx` (NEW)
- `src/types/account.ts` (NEW)
- `src/components/layout/Navbar.tsx` - Update `handleAccountDetails` navigation
- `src/services/authenticationService.ts` - Thêm `getAccountProfile()` method

---

### 4. ✅ SePay Payment Integration Updates

**Vấn đề**: Cần cập nhật để align với BE DTOs và API structure mới.

**Giải pháp**:
- ✅ Cập nhật `invoiceService.ts` với types mới: `invoiceType`, `items[]`, `paymentStatus`
- ✅ Cập nhật `PaymentQRCode.tsx` để dùng `invoiceCode` thay vì `invoiceId`
- ✅ Cập nhật để dùng `paymentStatus` thay vì `status`
- ✅ Thêm methods: `getInvoiceByCode()`, `getInvoicesByPatient()`, `checkPaymentStatus()`

**Files changed**:
- `src/services/invoiceService.ts` - Cập nhật types và methods
- `src/components/payment/PaymentQRCode.tsx` - Update để dùng `invoiceCode` và `paymentStatus`

**Note**: Trang test-sepay (`src/app/admin/test-sepay/`) **KHÔNG được commit** theo yêu cầu.

---

### 5. ✅ UTF-8 Encoding Fix for Vietnamese Characters

**Vấn đề**: JWT payload chứa tiếng Việt bị hiển thị sai (e.g., "CÃ´ng" thay vì "Công").

**Giải pháp**:
- ✅ Fix `decodeJWT()` trong `src/lib/utils.ts` để decode UTF-8 đúng cách
- ✅ Convert base64 → Uint8Array → TextDecoder('utf-8')

**Files changed**:
- `src/lib/utils.ts` - Fix `decodeJWT()` function

**Before**:
```typescript
const payload = JSON.parse(atob(base64));
```

**After**:
```typescript
const binaryString = atob(base64);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}
const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
```

---

### 6. ✅ Navigation Config Update

**Vấn đề**: Employment types cho "Gia hạn ca" (Shift Renewal) không đúng.

**Giải pháp**:
- ✅ Cập nhật `employmentTypes` từ `['PART_TIME_FLEX']` → `['FULL_TIME', 'PART_TIME_FIXED']`

**Files changed**:
- `src/constants/navigationConfig.ts`

---

## 📊 Thống Kê

### Files Changed
- **Modified**: 17 files (10 initial + 4 for CANCELLED_LATE + 3 for Payment/Invoice)
- **Created**: 7 files (3 initial + 1 Payment Service + 3 UI pages)
- **Total changes**: ~3000+ insertions(+), ~150 deletions(-)

### New Files
1. `src/app/admin/account/page.tsx`
2. `src/app/employee/account/page.tsx`
3. `src/types/account.ts`
4. `src/services/paymentService.ts` (Payment Service)
5. `src/app/admin/invoices/page.tsx` (Invoices list page)
6. `src/app/admin/invoices/[invoiceCode]/page.tsx` (Invoice detail page)
7. `src/app/admin/payments/page.tsx` (Payments list page)

### Modified Files
1. `src/app/admin/accounts/employees/page.tsx`
2. `src/app/employee/renewals/page.tsx`
3. `src/components/layout/Navbar.tsx`
4. `src/components/payment/PaymentQRCode.tsx`
5. `src/constants/navigationConfig.ts`
6. `src/constants/permissions.ts`
7. `src/lib/utils.ts`
8. `src/services/authenticationService.ts`
9. `src/services/invoiceService.ts`
10. `src/types/permission.ts`
11. `src/types/appointment.ts` (CANCELLED_LATE)
12. `src/components/appointments/AppointmentFilters.tsx` (CANCELLED_LATE)
13. `src/app/employee/booking/appointments/[appointmentCode]/page.tsx` (CANCELLED_LATE)
14. `src/app/admin/booking/appointments/[appointmentCode]/page.tsx` (CANCELLED_LATE)
15. `src/services/invoiceService.ts` (Added getInvoicesByAppointment method)

---

## 🔍 Chi Tiết Kỹ Thuật

### Permission Updates

**Module**: `SHIFT_RENEWAL`

| Permission | Description | Actor |
|------------|-------------|-------|
| `VIEW_RENEWAL_OWN` | Xem yêu cầu gia hạn của bản thân | Employee |
| `RESPOND_RENEWAL_OWN` | Phản hồi yêu cầu gia hạn của bản thân | Employee |
| `VIEW_RENEWAL_ALL` | Xem tất cả yêu cầu gia hạn | Admin/Manager |

**Roles có quyền**:
- ✅ `ROLE_ADMIN` - Tất cả 3 permissions
- ✅ `ROLE_MANAGER` - Tất cả 3 permissions
- ✅ `ROLE_DENTIST`, `ROLE_NURSE`, `ROLE_DENTIST_INTERN`, `ROLE_RECEPTIONIST`, `ROLE_ACCOUNTANT`, `ROLE_INVENTORY_MANAGER` - 2 permissions (VIEW_RENEWAL_OWN + RESPOND_RENEWAL_OWN)

### API Updates

**Authentication Service**:
- ✅ `getAccountProfile()`: `GET /api/v1/account/profile`

**Invoice Service**:
- ✅ `getInvoiceByCode(invoiceCode: string)`: `GET /api/v1/invoices/{invoiceCode}`
- ✅ `getInvoicesByPatient(patientId: number)`: `GET /api/v1/invoices/patient/{patientId}`
- ✅ `getInvoicesByAppointment(appointmentId: number)`: `GET /api/v1/invoices/appointment/{appointmentId}` (NEW)
- ✅ `getUnpaidInvoicesByPatient(patientId: number)`: `GET /api/v1/invoices/patient/{patientId}/unpaid`
- ✅ `checkPaymentStatus(invoiceCode: string)`: `GET /api/v1/invoices/{invoiceCode}/payment-status`

**Payment Service** (NEW):
- ✅ `createPayment(request: CreatePaymentRequest)`: `POST /api/v1/payments`
- ✅ `getPaymentsByInvoice(invoiceId: number)`: `GET /api/v1/payments/invoice/{invoiceId}`
- ✅ `getPaymentByCode(paymentCode: string)`: `GET /api/v1/payments/{paymentCode}`

---

## 📚 Documentation Reviewed

Đã đọc và hiểu các thay đổi trong docs:

1. **BE-905-SEPAY-WEBHOOK-COMPLETED.md**
   - Bỏ API key validation (dùng IP whitelist)
   - Fix build error
   - Update documentation

2. **EMAIL_SYSTEM_TROUBLESHOOTING_GUIDE.md**
   - Troubleshooting guide cho email system
   - SendGrid setup option

3. **PAYMENT_FLOW_DYNAMIC_QR_WEBHOOK.md**
   - Payment flow với Dynamic QR + Webhook
   - Payment code format: `PDCMSyymmddxy`

4. **SENDGRID_SETUP_GUIDE.md**
   - Hướng dẫn setup SendGrid cho DigitalOcean
   - Free tier: 100 emails/day

5. **SEPAY_WEBHOOK_PRODUCTION_SETUP.md**
   - Production setup guide
   - Webhook URL: `https://pdcms.duckdns.org/api/v1/webhooks/sepay`

---

## ✅ Testing Checklist

### Renewal Module
- [ ] Employee với `VIEW_RENEWAL_OWN` có thể vào `/employee/renewals`
- [ ] Employee với `RESPOND_RENEWAL_OWN` có thể phản hồi renewal requests
- [ ] Admin/Manager với `VIEW_RENEWAL_ALL` có thể xem tất cả renewals
- [ ] User không có quyền → 403 Forbidden

### Employee Form
- [ ] Role cần specialization → Form hiển thị 2 cột (max-w-5xl)
- [ ] Role không cần specialization → Form hiển thị 1 cột (max-w-2xl)
- [ ] Phần chuyên khoa chỉ hiển thị khi cần

### Account Pages
- [ ] Admin có thể xem `/admin/account`
- [ ] Employee có thể xem `/employee/account`
- [ ] Patient có thể xem `/patient/profile`
- [ ] Specializations hiển thị đúng (nếu có)
- [ ] Không hiển thị Account ID

### SePay Integration
- [ ] PaymentQRCode component hoạt động với `invoiceCode`
- [ ] Polling payment status hoạt động đúng
- [ ] Invoice service methods hoạt động với BE mới

### UTF-8 Encoding
- [ ] JWT payload với tiếng Việt hiển thị đúng
- [ ] Full name từ JWT hiển thị đúng trong Navbar

### CANCELLED_LATE Status
- [ ] Status `CANCELLED_LATE` hiển thị đúng với màu warning/orange
- [ ] Filter dropdown có option "Hủy muộn"
- [ ] Validation yêu cầu reasonCode và notes khi chọn CANCELLED_LATE
- [ ] Tooltip hiển thị đúng thông tin về ảnh hưởng đến consecutiveNoShows
- [ ] Treatment plan items được update khi status = CANCELLED_LATE

### Payment & Invoice Pages
- [ ] Trang invoices hiển thị đúng danh sách khi có Patient ID
- [ ] Trang invoice detail hiển thị đầy đủ thông tin
- [ ] QR Code hiển thị và hoạt động đúng
- [ ] Payment history hiển thị đúng
- [ ] Trang payments hiển thị đúng khi có Invoice ID
- [ ] Filters hoạt động đúng
- [ ] Permission checks hoạt động đúng

---

## 🚀 Next Steps

1. **Test Renewal Module** với permissions mới
2. **Test Employee Form** với các roles khác nhau
3. **Test Account Pages** với real data
4. **Test SePay Integration** với production webhook
5. **Monitor** UTF-8 encoding với JWT mới từ BE
6. **Test CANCELLED_LATE Status** - Verify UI, validation, và treatment plan updates
7. **Test Payment & Invoice Pages** - Verify UI, filters, QR code, payment history
8. **Request BE APIs** - Yêu cầu BE thêm endpoint "get all invoices" và "get all payments" với pagination

---

## 📝 Notes

- Trang `admin/test-sepay` **KHÔNG được commit** (local testing only)
- Tất cả changes đã được push lên `main` branch (commit `b3d6232`)
- Permissions đã đồng bộ hoàn toàn với BE
- UI improvements đã được implement theo yêu cầu
- **CANCELLED_LATE status** đã được thêm vào tất cả các components liên quan
- Status mới phân biệt rõ ràng giữa hủy thông thường (>24h) và hủy muộn (≤24h)
- **Payment & Invoice pages** đã được tạo với đầy đủ features
- **Payment Service** đã được tạo với 3 methods cần thiết
- **Import fix**: Đã sửa import `formatCurrency` từ `@/lib/utils` → `@/utils/formatters`

---

## 🔄 Cập Nhật Bổ Sung

### 7. ✅ Thêm Appointment Status `CANCELLED_LATE`

**Vấn đề**: BE đã thêm status mới `CANCELLED_LATE` để phân biệt giữa hủy thông thường (>24h trước) và hủy muộn (≤24h trước giờ hẹn).

**Giải pháp**:
- ✅ Thêm `'CANCELLED_LATE'` vào `AppointmentStatus` type
- ✅ Cập nhật `APPOINTMENT_STATUS_COLORS` với màu warning/orange
- ✅ Cập nhật `resolveAppointmentStatus()` để handle `CANCELLED_LATE`
- ✅ Cập nhật `APPOINTMENT_STATUS_TRANSITIONS` với transitions mới
- ✅ Cập nhật status filters trong `AppointmentFilters` component
- ✅ Cập nhật validation và UI trong appointment detail pages

**Files changed**:
- `src/types/appointment.ts` - Thêm type và colors
- `src/components/appointments/AppointmentFilters.tsx` - Thêm filter option
- `src/app/employee/booking/appointments/[appointmentCode]/page.tsx` - Cập nhật validation và UI
- `src/app/admin/booking/appointments/[appointmentCode]/page.tsx` - Cập nhật validation và UI

**Status Display**:
- **Label**: "Hủy muộn"
- **Color**: Orange/Warning (`#f97316` / `#ea580c`)
- **Tooltip**: "Lịch hẹn bị hủy trong vòng 24 giờ trước giờ hẹn sẽ ảnh hưởng đến số lần không đến liên tiếp của bệnh nhân."

**Validation**:
- Yêu cầu `reasonCode` và `notes` (giống `CANCELLED`)
- Treatment plan items được update khi status = `CANCELLED_LATE`

**Status Transitions**:
- `SCHEDULED` → `CANCELLED_LATE` ✅
- `CHECKED_IN` → `CANCELLED_LATE` ✅
- `IN_PROGRESS` → `CANCELLED_LATE` ✅
- `CANCELLED_LATE` → Terminal state ✅

---

### 8. ✅ Payment & Invoice Management Pages

**Vấn đề**: Thiếu UI pages để quản lý hóa đơn và thanh toán.

**Giải pháp**:
- ✅ Tạo Payment Service (`src/services/paymentService.ts`) với 3 methods
- ✅ Bổ sung Invoice Service method `getInvoicesByAppointment()`
- ✅ Tạo trang danh sách invoices: `/admin/invoices`
- ✅ Tạo trang chi tiết invoice: `/admin/invoices/[invoiceCode]`
- ✅ Tạo trang danh sách payments: `/admin/payments`
- ✅ Fix import `formatCurrency` từ `@/utils/formatters`

**Files changed**:
- `src/services/paymentService.ts` (NEW) - Payment service với createPayment, getPaymentsByInvoice, getPaymentByCode
- `src/services/invoiceService.ts` - Thêm method `getInvoicesByAppointment()`
- `src/app/admin/invoices/page.tsx` (NEW) - Trang danh sách invoices
- `src/app/admin/invoices/[invoiceCode]/page.tsx` (NEW) - Trang chi tiết invoice
- `src/app/admin/payments/page.tsx` (NEW) - Trang danh sách payments

**Features**:
- ✅ Filters: Patient ID, Search, Status, Type (invoices)
- ✅ Filters: Invoice ID, Search, Payment Method (payments)
- ✅ Status badges với màu sắc phù hợp
- ✅ QR Code integration với PaymentQRCode component
- ✅ Payment history display
- ✅ Invoice items detail
- ✅ Permission checks (`VIEW_INVOICE_ALL`, `VIEW_PAYMENT_ALL`)
- ✅ Responsive design
- ✅ Error handling với toast notifications

**Payment Service Methods**:
- `createPayment()` - Tạo thanh toán mới
- `getPaymentsByInvoice()` - Lấy danh sách thanh toán theo invoice
- `getPaymentByCode()` - Lấy chi tiết thanh toán theo code

**Invoice Service Updates**:
- `getInvoicesByAppointment()` - Lấy danh sách invoices theo appointment

**Note**: 
- Trang invoices cần Patient ID để xem (BE không có endpoint "get all invoices")
- Trang payments cần Invoice ID để xem (BE chỉ có endpoint get payments by invoice)
- QR Code chỉ hiển thị khi invoice chưa thanh toán và chưa bị hủy

---

**Report Generated**: 2025-12-30  
**Last Updated**: 2025-12-30 (Added Payment & Invoice pages, fixed imports)  
**Author**: AI Assistant  
**Status**: ✅ Complete

