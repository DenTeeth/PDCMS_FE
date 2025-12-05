# Accountant Module - Kế Toán

Module quản lý tài chính và kế toán cho phòng khám nha khoa.

## Cấu Trúc

```
accountant/
├── page.tsx                    # Dashboard kế toán
├── layout.tsx                  # Layout với sidebar
├── transactions/               # Quản lý thu chi
│   ├── page.tsx               # Danh sách phiếu thu chi
│   └── new/
│       └── page.tsx           # Tạo phiếu thu chi mới
├── revenue-report/            # Báo cáo doanh thu
│   └── page.tsx              # Báo cáo theo bác sĩ, nguồn KH, nhóm KH
├── cashflow-report/           # Báo cáo dòng tiền
│   └── page.tsx              # Tổng hợp, thu chi KH, thu chi phòng khám
├── debt-report/               # Báo cáo công nợ
│   └── page.tsx              # Công nợ và số dư khách hàng
└── settings/                  # Cài đặt
    └── page.tsx              # Thông tin cá nhân, mật khẩu, thông báo
```

## Chức Năng

### 1. Dashboard
- Tổng quan tài chính (Thu, Chi, Lợi nhuận, Công nợ)
- Giao dịch gần đây
- Cảnh báo và thông báo
- Thao tác nhanh

### 2. Quản Lý Thu Chi
- Danh sách phiếu thu chi
- Tạo phiếu thu/chi mới
- Tìm kiếm và lọc
- Xuất Excel
- Đính kèm hóa đơn/phiếu

**Loại Thu:**
- Dịch vụ nha khoa
- Bán nha phẩm
- Bán thuốc
- Khác

**Loại Chi:**
- Lương nhân viên
- Sửa chữa bảo dưỡng
- Mua vật tư
- Thuê mặt bằng
- Điện nước
- Khác

### 3. Báo Cáo Doanh Thu
- **Theo Bác Sĩ:** Doanh thu, thực thu, số bệnh nhân, số thủ thuật
- **Theo Nguồn Khách Hàng:** Website, Facebook, Zalo, Walk-in, Referral
- **Theo Nhóm Khách Hàng:** Khách mới, khách cũ, đang điều trị

### 4. Dòng Tiền Thu Chi
- **Tổng Hợp:** Số dư đầu kỳ, phát sinh tăng/giảm, số dư cuối kỳ
- **Thu Chi Khách Hàng:** Tổng thu, thực thu, hoàn ứng, biến động số dư
- **Thu Chi Phòng Khám:** Phiếu thu, phiếu chi, chênh lệch

### 5. Công Nợ Khách Hàng
- Danh sách công nợ
- Số dư khách hàng
- Lọc theo trạng thái
- Xuất báo cáo

### 6. Cài Đặt
- Thông tin cá nhân
- Đổi mật khẩu
- Cài đặt thông báo
- Ngôn ngữ

## Data Structure

### Transaction (Phiếu Thu Chi)
```typescript
{
  id: string;
  code: string;              // PT-20250120-001, PC-20250120-001
  type: 'Thu' | 'Chi';
  category: string;          // Danh mục
  description: string;       // Nội dung
  amount: number;            // Số tiền
  payer?: string;            // Người nộp (Thu)
  receiver?: string;         // Người nhận (Chi)
  date: string;              // Ngày giao dịch
  status: string;            // Trạng thái
  attachments?: string[];    // File đính kèm
}
```

### Revenue Report
```typescript
{
  name: string;              // Tên (bác sĩ, nguồn, nhóm)
  revenue: number;           // Doanh thu
  actualRevenue: number;     // Thực thu
  patients: number;          // Số bệnh nhân
  procedures: number;        // Số thủ thuật
}
```

### Debt Report
```typescript
{
  name: string;              // Tên khách hàng
  phone: string;             // Số điện thoại
  debt: number;              // Công nợ
  balance: number;           // Số dư
  totalDebt: number;         // Tổng công nợ (debt - balance)
}
```

## Permissions

Module này yêu cầu permission group: `FINANCIAL_MANAGEMENT`

## Notes

- Tất cả data hiện tại là **DATA GIẢ** được đánh dấu rõ ràng
- Chờ API từ backend để tích hợp thực tế
- UI tham khảo từ admin và employee modules
- Sidebar sử dụng ModernSidebar component chung
- Protected route với `requiredBaseRole="employee"` (accountant là employee role)
