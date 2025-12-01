# API Testing Scripts

Tự động test các APIs và flows của Treatment Plan & Appointment module.

## 📋 Prerequisites

1. **Backend server đang chạy**
   ```bash
   # Backend phải chạy trên http://localhost:8080
   # Hoặc set environment variable:
   export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
   ```

2. **Docker PostgreSQL đang chạy** (nếu dùng docker-compose)
   ```bash
   docker-compose up -d
   ```

3. **Test users có trong database:**
   - `bacsi1` / `123456` (Doctor 1)
   - `bacsi2` / `123456` (Doctor 2)
   - `benhnhan1` / `123456` (Patient 1)
   - `quanli1` / `123456` (Manager)

## 🚀 Cách chạy

### Option 1: TypeScript Test Script (Recommended)

```bash
# Chạy tất cả tests
npm run test:api

# Chạy với watch mode (tự động chạy lại khi file thay đổi)
npm run test:api:watch
```

### Option 2: Manual Testing với curl

Xem file `scripts/test-api.sh` (nếu có) hoặc dùng các commands trong `docs/api-guide/updated_from_BE/TEST_REPORT_2025-11-20.md`

## 📊 Test Coverage

Script `test-api.ts` test các scenarios sau:

### 1. ✅ Authentication Tests
- Login với tất cả test users
- Verify JWT token được trả về

### 2. ✅ Doctor Service Filtering API
- Test endpoint `/my-specializations` (NEW)
- So sánh với endpoint `/services` (OLD)
- Verify filtering hoạt động đúng

### 3. ✅ Specialization Validation
- Test tạo plan với compatible services
- Test error handling khi service không compatible

### 4. ✅ Treatment Plan Detail
- Verify `serviceCode` có trong response
- Verify `approvalMetadata.notes` có trong response

### 5. ⏭️ Zero-Price Validation
- Manual test required (tạo plan với zero-price và approve)

## 📝 Output

Script sẽ hiển thị:
- ✅ Passed tests
- ❌ Failed tests  
- ⏭️ Skipped tests
- Summary với tổng số tests

## 🔧 Customization

### Thay đổi API URL

```bash
# Set environment variable
export NEXT_PUBLIC_API_BASE_URL=http://your-api-url:8080/api/v1
npm run test:api
```

### Thay đổi test users

Edit `TEST_USERS` object trong `scripts/test-api.ts`:

```typescript
const TEST_USERS = {
  doctor1: { username: 'your-doctor', password: 'your-password' },
  // ...
};
```

## 🐛 Troubleshooting

### Error: Cannot connect to API
- Kiểm tra backend server đang chạy: `curl http://localhost:8080/api/v1/health`
- Kiểm tra firewall/port 8080

### Error: Authentication failed
- Verify test users tồn tại trong database
- Check username/password trong `TEST_USERS`

### Error: No services found
- Verify seed data đã được load
- Check database có services với `is_active = true`

## 📚 Related Documentation

- [BE Test Report](./docs/api-guide/updated_from_BE/TEST_REPORT_2025-11-20.md)
- [API Documentation](./docs/api-guide/treatment-plan/)
- [BE Open Issues](./docs/api-guide/treatment-plan/BE_OPEN_ISSUES.md)

