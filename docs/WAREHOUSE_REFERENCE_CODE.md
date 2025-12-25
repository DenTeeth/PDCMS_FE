# Mã Tham Chiếu (Reference Code) trong Warehouse Export Transactions

## Tổng quan

**Mã tham chiếu (Reference Code)** là một trường tùy chọn trong form xuất kho, được sử dụng để liên kết phiếu xuất kho với các đối tượng khác trong hệ thống.

## Mục đích sử dụng

Theo định nghĩa trong backend (`ExportTransactionRequest.java`):

```java
@Size(max = 100, message = "Reference code must not exceed 100 characters")
private String referenceCode; // Mã phiếu yêu cầu hoặc mã ca điều trị
```

**Mã tham chiếu** được sử dụng để:
1. **Liên kết với phiếu yêu cầu**: Khi xuất kho theo một yêu cầu cụ thể (ví dụ: yêu cầu từ phòng ban)
2. **Liên kết với ca điều trị**: Khi xuất kho cho một ca điều trị cụ thể (ví dụ: appointment code)
3. **Tra cứu và theo dõi**: Giúp dễ dàng tìm kiếm và theo dõi lịch sử xuất kho liên quan đến một đối tượng cụ thể

## Nơi lấy dữ liệu

### Frontend (Form Input)

Trong form xuất kho (`ExportTransactionFormNew.tsx`), mã tham chiếu là một trường input tự do:

```typescript
const [referenceCode, setReferenceCode] = useState<string>('');

// UI
<Input
  id="referenceCode"
  value={referenceCode}
  onChange={(e) => setReferenceCode(e.target.value)}
  placeholder="REQ-2025-001"
/>
```

**Hiện tại**: User nhập thủ công mã tham chiếu vào form.

### Backend (Storage)

Mã tham chiếu được lưu vào `StorageTransaction.referenceCode`:

```java
.referenceCode(request.getReferenceCode())
```

## Đặc điểm kỹ thuật

- **Kiểu dữ liệu**: `String` (optional)
- **Độ dài tối đa**: 100 ký tự
- **Validation**: 
  - Không bắt buộc (optional)
  - Tối đa 100 ký tự
- **Lưu trữ**: Lưu trong bảng `storage_transaction.reference_code`

## Ví dụ sử dụng

1. **Mã phiếu yêu cầu**: `REQ-2025-001`, `REQ-2025-002`
2. **Mã ca điều trị**: `APT-2025-123`, `TREATMENT-001`
3. **Mã đơn hàng**: `ORDER-2025-456`
4. **Mã dự án**: `PROJECT-2025-789`

## Gợi ý cải thiện (Future Enhancement)

### Tự động điền mã tham chiếu

Có thể cải thiện UX bằng cách:

1. **Tự động điền từ appointment**: 
   - Khi xuất kho từ trang appointment detail
   - Tự động điền `appointmentCode` vào `referenceCode`

2. **Dropdown/Select với suggestions**:
   - Hiển thị danh sách các mã tham chiếu gần đây
   - Cho phép user chọn từ danh sách

3. **Auto-complete**:
   - Tìm kiếm và gợi ý các mã tham chiếu có sẵn
   - Giúp tránh nhập sai hoặc trùng lặp

4. **Liên kết với API**:
   - Tích hợp với API appointments để lấy danh sách appointment codes
   - Tích hợp với API requests để lấy danh sách request codes

## Tài liệu liên quan

- Backend: `docs/files/warehouse/dto/request/ExportTransactionRequest.java`
- Frontend: `src/app/admin/warehouse/components/ExportTransactionFormNew.tsx`
- Database: `storage_transaction.reference_code` column

