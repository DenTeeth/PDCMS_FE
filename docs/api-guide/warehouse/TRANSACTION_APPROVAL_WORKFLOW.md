# Transaction Approval Workflow - Quy trình Duyệt Phiếu Kho

**Date:** 2025-01-28  
**API Version:** 6.6 & 6.7  
**Status:** ✅ **IMPLEMENTED**

---

## 📋 Tổng quan

Hệ thống warehouse hiện tại đã được nâng cấp với **quy trình duyệt phiếu (Approval Workflow)** để đảm bảo tính chính xác và kiểm soát tốt hơn cho các giao dịch nhập/xuất kho.

---

## 🔄 Quy trình Duyệt Phiếu

### 1. **Trạng thái (Transaction Status)**

Mỗi phiếu nhập/xuất kho có thể ở một trong các trạng thái sau:

| Status | Mô tả | Hành động cho phép |
|--------|-------|-------------------|
| **DRAFT** | Nháp | Tạo, chỉnh sửa, xóa (nếu có quyền) |
| **PENDING_APPROVAL** | Chờ duyệt | Xem, duyệt (APPROVE), từ chối (REJECT) |
| **APPROVED** | Đã duyệt | Xem, xuất báo cáo, không thể chỉnh sửa |
| **REJECTED** | Từ chối | Xem, tạo lại phiếu mới |
| **CANCELLED** | Đã hủy | Xem, không thể chỉnh sửa |

### 2. **Luồng xử lý (Workflow Flow)**

```
┌─────────┐
│  DRAFT  │ ← Tạo phiếu mới
└────┬────┘
     │ Submit
     ▼
┌──────────────────┐
│ PENDING_APPROVAL │ ← Chờ người có quyền duyệt
└────┬─────────────┘
     │
     ├─→ APPROVED ──→ ✅ Áp dụng vào kho (cập nhật inventory)
     │
     └─→ REJECTED ──→ ❌ Không áp dụng, có thể tạo lại
     
     └─→ CANCELLED ──→ 🚫 Hủy bỏ (không áp dụng)
```

### 3. **Khi nào cần duyệt?**

#### **Phiếu Nhập Kho (IMPORT)**
- ✅ **Luôn cần duyệt** trước khi cập nhật tồn kho
- Lý do: Đảm bảo tính chính xác của hàng hóa nhập vào
- Người duyệt: Quản lý kho hoặc Admin

#### **Phiếu Xuất Kho (EXPORT)**
- ✅ **Luôn cần duyệt** trước khi trừ tồn kho
- Lý do: Tránh xuất nhầm, kiểm soát chi phí
- Người duyệt: Quản lý kho hoặc Admin

#### **Phiếu Điều chỉnh (ADJUSTMENT)**
- ✅ **Luôn cần duyệt** trước khi điều chỉnh tồn kho
- Lý do: Điều chỉnh có thể ảnh hưởng lớn đến tồn kho
- Người duyệt: Quản lý kho hoặc Admin

---

## 🎯 Tính năng trong FE

### 1. **Filter theo trạng thái**

Trong trang `/admin/warehouse/storage`, bạn có thể lọc phiếu theo trạng thái:

- **Tất cả**: Hiển thị mọi phiếu
- **Nháp (DRAFT)**: Các phiếu chưa submit
- **Chờ duyệt (PENDING_APPROVAL)**: Các phiếu đang chờ duyệt
- **Đã duyệt (APPROVED)**: Các phiếu đã được duyệt và áp dụng
- **Từ chối (REJECTED)**: Các phiếu bị từ chối
- **Đã hủy (CANCELLED)**: Các phiếu đã bị hủy

### 2. **Hiển thị trạng thái trong bảng**

Mỗi phiếu trong danh sách hiển thị badge màu sắc để dễ nhận biết:

- ⚪ **Nháp**: Badge outline (màu xám)
- 🟡 **Chờ duyệt**: Badge màu vàng (bg-yellow-100 text-yellow-800)
- 🟢 **Đã duyệt**: Badge default (màu primary/xanh)
- 🔴 **Từ chối**: Badge destructive (màu đỏ)
- ⚫ **Đã hủy**: Badge secondary (màu xám)

### 3. **Statistics Dashboard**

Trang warehouse hiển thị thống kê:

- **Chờ duyệt**: Số lượng phiếu đang chờ duyệt (màu vàng/cam)
- **Tổng giá trị nhập**: Tổng giá trị các phiếu nhập đã duyệt (chỉ hiện nếu có quyền VIEW_COST)

---

## 🔐 Phân quyền (RBAC)

### **Quyền liên quan đến Approval**

| Permission | Mô tả |
|-----------|-------|
| `VIEW_WAREHOUSE` | Xem danh sách và chi tiết phiếu (bắt buộc) |
| `CREATE_WAREHOUSE` | Tạo phiếu mới (DRAFT) |
| `UPDATE_WAREHOUSE` | Chỉnh sửa phiếu (chỉ khi status = DRAFT) |
| `APPROVE_WAREHOUSE` | Duyệt phiếu (chuyển PENDING_APPROVAL → APPROVED) |
| `REJECT_WAREHOUSE` | Từ chối phiếu (chuyển PENDING_APPROVAL → REJECTED) |
| `VIEW_COST` | Xem thông tin tài chính (totalValue, paidAmount, remainingDebt) |

### **Quy tắc**

1. **Tạo phiếu**: User có `CREATE_WAREHOUSE` có thể tạo phiếu mới với status = DRAFT
2. **Submit phiếu**: User tạo phiếu có thể submit → chuyển sang PENDING_APPROVAL
3. **Duyệt phiếu**: Chỉ user có `APPROVE_WAREHOUSE` mới có thể duyệt
4. **Từ chối phiếu**: Chỉ user có `REJECT_WAREHOUSE` mới có thể từ chối
5. **Chỉnh sửa**: Chỉ có thể chỉnh sửa khi status = DRAFT

---

## 📊 API Endpoints

### **GET /api/v1/warehouse/transactions** (API 6.6)

Filter theo trạng thái:

```http
GET /api/v1/warehouse/transactions?status=PENDING_APPROVAL
```

**Response** bao gồm:
- `status`: Trạng thái duyệt của phiếu
- `approvedByName`: Tên người duyệt (nếu đã duyệt)
- `approvedAt`: Thời gian duyệt (nếu đã duyệt)

### **GET /api/v1/warehouse/transactions/{id}** (API 6.7)

Chi tiết phiếu bao gồm:
- Thông tin duyệt (nếu có)
- Lý do từ chối (nếu REJECTED)
- Lịch sử thay đổi trạng thái

---

## ⚠️ Lưu ý

1. **Không thể xóa phiếu**: BE chưa implement DELETE endpoint. Thay vào đó, có thể set status = CANCELLED
2. **Không thể chỉnh sửa sau khi duyệt**: Phiếu APPROVED không thể chỉnh sửa
3. **Từ chối không tự động**: Cần người có quyền REJECT_WAREHOUSE thực hiện
4. **Tự động cập nhật tồn kho**: Chỉ khi phiếu được APPROVED mới cập nhật tồn kho

---

## 🚀 Next Steps (BE cần implement)

1. **POST /api/v1/warehouse/transactions/{id}/approve** - Duyệt phiếu
2. **POST /api/v1/warehouse/transactions/{id}/reject** - Từ chối phiếu (kèm lý do)
3. **POST /api/v1/warehouse/transactions/{id}/cancel** - Hủy phiếu
4. **GET /api/v1/warehouse/transactions/{id}/history** - Lịch sử thay đổi trạng thái

---

## 📝 Tóm tắt

✅ **Đã có**: Filter theo status, hiển thị status badge, statistics dashboard  
⏳ **Đang chờ BE**: Endpoints approve/reject/cancel, lịch sử thay đổi  
🔒 **RBAC**: Phân quyền rõ ràng cho từng hành động

**Workflow hiện tại**: FE đã sẵn sàng hiển thị và filter theo status. Khi BE implement approve/reject endpoints, FE chỉ cần thêm UI buttons để gọi các endpoints đó.

