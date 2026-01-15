# Excel Export Test Script

## Mô tả
Script tự động test chức năng export Excel từ warehouse và dashboard.

## Cách chạy

```bash
npm run test:excel-export
```

Hoặc trực tiếp:
```bash
npx tsx scripts/test-excel-export.ts
```

## Chức năng

Script sẽ tự động:
1. ✅ Login với tài khoản admin (username: `admin`, password: `123456`)
2. ✅ Test export Excel từ warehouse (3 loại):
   - Inventory Summary
   - Expiring Alerts
   - Transaction History
3. ✅ Test export Excel từ dashboard (6 tabs):
   - Overview
   - Revenue-Expenses
   - Employees
   - Warehouse
   - Transactions
   - Feedbacks
4. ✅ Lưu tất cả file Excel vào thư mục `test-exports/`
5. ✅ Báo cáo kết quả test (success/failed)

## Output

- **Files**: Tất cả file Excel được lưu vào `test-exports/` directory
- **Console**: Báo cáo chi tiết về từng test case
- **Exit Code**: 
  - `0` nếu tất cả tests pass
  - `1` nếu có test nào fail

## Kết quả Test (2026-01-15)

```
Total Tests: 9
✅ Successful: 0
❌ Failed: 9

Tất cả đều fail với lỗi 500 từ BE
```

## Cấu hình

Có thể thay đổi trong script:
- `API_BASE_URL`: URL của BE API (default: `https://pdcms.duckdns.org/api/v1`)
- `ADMIN_USERNAME`: Username để login (default: `admin`)
- `ADMIN_PASSWORD`: Password để login (default: `123456`)
- `OUTPUT_DIR`: Thư mục lưu file Excel (default: `test-exports/`)

## Troubleshooting

### Lỗi 500 từ BE
- Đây là vấn đề từ BE, không phải FE
- Kiểm tra BE logs để xem chi tiết lỗi
- Xem `docs/files/EXCEL_EXPORT_ISSUES.md` để biết thêm chi tiết

### Lỗi Login
- Kiểm tra username/password có đúng không
- Kiểm tra API_BASE_URL có đúng không
- Kiểm tra network connection

### File không được tạo
- Kiểm tra quyền ghi vào thư mục `test-exports/`
- Kiểm tra disk space

