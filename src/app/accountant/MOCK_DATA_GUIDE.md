# Hướng Dẫn Xóa Mock Data Khi Tích Hợp API

## Tổng Quan
Tất cả mock data trong module Accountant đã được đánh dấu rõ ràng với comment:
```typescript
/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
/// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
... mock data code ...
/// - KẾT THÚC DATA GIẢ
```

## Danh Sách File Có Mock Data

### 1. File Mock Data Chính
- **File**: `src/app/accountant/lib/mockData.ts`
- **Hành động**: Xóa toàn bộ file này khi có API thật

### 2. Dashboard
- **File**: `src/app/accountant/page.tsx`
- **Mock data**: Import từ mockData.ts
- **Hành động**: Thay thế import mockData bằng API calls

### 3. Quản Lý Thu Chi
- **File**: `src/app/accountant/transactions/page.tsx`
- **Mock data**: Array `transactions`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 4. Công Nợ NCC
- **File**: `src/app/accountant/supplier-debt/page.tsx`
- **Mock data**: Arrays `supplierDebts`, `paymentHistory`, `summary`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 5. Công Nợ Labo
- **File**: `src/app/accountant/lab-debt/page.tsx`
- **Mock data**: Arrays `labDebts`, `paymentHistory`, `summary`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 6. Tính Lương & Hoa Hồng
- **File**: `src/app/accountant/payroll/page.tsx`
- **Mock data**: Arrays `payrollData`, `summary`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 7. Báo Cáo Lãi/Lỗ
- **File**: `src/app/accountant/profit-loss/page.tsx`
- **Mock data**: Objects `plReport`, `monthlyComparison`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 8. Báo Cáo Doanh Thu
- **File**: `src/app/accountant/revenue-report/page.tsx`
- **Mock data**: Arrays `doctorRevenue`, `customerSourceRevenue`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 9. Báo Cáo Dòng Tiền
- **File**: `src/app/accountant/cashflow-report/page.tsx`
- **Mock data**: Objects `summaryData`, `customerCashflow`, `clinicCashflow`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

### 10. Chi Xuất Nhập Kho
- **File**: `src/app/accountant/warehouse-expenses/page.tsx`
- **Mock data**: Array `mockExpenses`
- **Hành động**: Xóa code giữa 2 dòng comment, thay bằng API call

## Quy Trình Tích Hợp API

### Bước 1: Tìm Mock Data
Tìm kiếm trong file:
```
/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
```

### Bước 2: Xóa Mock Data
Xóa tất cả code từ dòng `/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU` đến dòng `/// - KẾT THÚC DATA GIẢ`

### Bước 3: Thay Thế Bằng API Call
Ví dụ:
```typescript
// Trước khi tích hợp API:
/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
const transactions = [
    { id: 'PT001', ... },
    { id: 'PC001', ... },
];
/// - KẾT THÚC DATA GIẢ

// Sau khi tích hợp API:
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/accountant/transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchTransactions();
}, []);
```

### Bước 4: Xóa File mockData.ts
Sau khi tất cả các page đã tích hợp API, xóa file:
```
src/app/accountant/lib/mockData.ts
```

## Lưu Ý
- ✅ Tất cả mock data đã được đánh dấu rõ ràng
- ✅ Chỉ cần xóa code giữa 2 dòng comment
- ✅ Không ảnh hưởng đến logic khác của component
- ✅ Dễ dàng tìm kiếm bằng comment marker

## Tìm Kiếm Nhanh
Sử dụng search trong IDE:
```
Search: "/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU"
Scope: src/app/accountant/
```

Sẽ tìm thấy tất cả các vị trí cần thay thế mock data bằng API.
