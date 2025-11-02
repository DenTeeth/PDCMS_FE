# 🔍 Cron Jobs - Giải Thích Và Kiểm Tra

## ❓ Cron Jobs Là Gì Và Chạy Ở Đâu?

### ⚠️ QUAN TRỌNG: Cron Jobs CHẠY Ở BACKEND, KHÔNG PHẢI FRONTEND!

**Cron Jobs = Scheduled Tasks tự động chạy trên Backend Server (Java/Spring Boot)**

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                        │
│                  (Java/Spring Boot)                      │
│                                                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Cron Jobs (Chạy tự động mỗi đêm)                │  │
│  │  - P8: 00:01 AM - Sync lịch                      │  │
│  │  - P9: 00:05 AM - Tạo renewal requests          │  │
│  │  - P10: 00:10 AM - Đánh dấu renewals quá hạn    │  │
│  │  - P11: 00:15 AM - Cleanup Flex registrations   │  │
│  └─────────────────────────────────────────────────┘  │
│                           │                              │
│                           ▼                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │  API Endpoints (Mà Frontend gọi)                 │  │
│  │  - GET /api/v1/registrations/renewals/pending     │  │
│  │  - PATCH /api/v1/registrations/renewals/{id}/... │  │
│  │  - POST /api/v1/admin/registrations/renewals/...  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│              (React/Next.js - Code của bạn)             │
│                                                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Gọi API endpoints để:                           │  │
│  │  - Lấy danh sách renewals                        │  │
│  │  - Phản hồi renewal                              │  │
│  │  - Finalize renewal (admin)                      │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Frontend KHÔNG CẦN Implement Cron Jobs!

**Frontend chỉ cần:**
1. ✅ Gọi API endpoints để lấy dữ liệu
2. ✅ Hiển thị dữ liệu trong UI
3. ✅ Cho phép user phản hồi (CONFIRMED/DECLINED)
4. ✅ Poll API định kỳ để cập nhật dữ liệu mới

**Backend đã làm sẵn:**
- ✅ Chạy cron jobs mỗi đêm
- ✅ Tạo renewal requests tự động
- ✅ Cập nhật database
- ✅ Cung cấp API endpoints

---

## 🔍 Làm Sao Biết Cron Jobs Đã Được Implement?

### Cách 1: Kiểm Tra Backend Code

Cron jobs được implement trong Backend (Java/Spring Boot), không phải Frontend.

Nếu bạn muốn kiểm tra, cần:
1. Xem Backend repository
2. Tìm các class có annotation `@Scheduled`:
   ```java
   @Component
   public class UnifiedScheduleSyncJob {
       @Scheduled(cron = "0 1 0 * * ?", zone = "Asia/Ho_Chi_Minh")
       public void syncSchedules() {
           // Job P8 - 00:01 AM
       }
   }
   
   @Component
   public class DailyRenewalDetectionJob {
       @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Ho_Chi_Minh")
       public void detectExpiringRegistrations() {
           // Job P9 - 00:05 AM
       }
   }
   ```

### Cách 2: Kiểm Tra API Response (Dễ Hơn)

**Nếu cron jobs đã chạy, API sẽ trả về dữ liệu:**

1. **Test API để xem có renewal nào không:**
   ```bash
   GET /api/v1/registrations/renewals/pending
   Authorization: Bearer <employee_token>
   ```

   **Nếu có renewal:**
   ```json
   [
     {
       "renewalId": "SRR_20251102_00001",
       "status": "PENDING_ACTION",
       "message": "Lịch làm việc cố định 'Ca sáng' của bạn sẽ hết hạn..."
     }
   ]
   ```
   → ✅ Cron jobs đang hoạt động!

   **Nếu empty array:**
   ```json
   []
   ```
   → Có thể:
   - Cron jobs chưa chạy (chưa đến 00:05 AM)
   - Không có registration nào sắp hết hạn
   - Hoặc cron jobs chưa được implement

2. **Kiểm tra logs backend:**
   ```bash
   docker logs -f pdcms_be | grep "Renewal\|Schedule Sync"
   ```
   
   **Nếu thấy logs:**
   ```
   2025-11-02 00:05:00 INFO - === Starting Daily Renewal Detection Job (P9) ===
   2025-11-02 00:05:01 INFO - Created 3 renewal requests
   ```
   → ✅ Cron jobs đang chạy!

---

## 🚀 Frontend Cần Làm Gì?

### Step 1: Gọi API để lấy danh sách renewals

```typescript
// services/renewalService.ts
async getPendingRenewals(): Promise<ShiftRenewal[]> {
  const response = await axios.get('/api/v1/registrations/renewals/pending');
  return response.data; // Dữ liệu này được tạo bởi cron jobs!
}
```

### Step 2: Hiển thị trong UI

```typescript
// pages/employee/renewals/page.tsx
const [renewals, setRenewals] = useState<ShiftRenewal[]>([]);

useEffect(() => {
  // Gọi API để lấy renewals (đã được tạo bởi cron jobs)
  renewalService.getPendingRenewals()
    .then(data => setRenewals(data));
}, []);

// Render UI với dữ liệu
```

### Step 3: Poll API định kỳ (để cập nhật dữ liệu mới)

```typescript
useEffect(() => {
  // Poll mỗi 5 phút để cập nhật renewals mới
  const interval = setInterval(() => {
    renewalService.getPendingRenewals()
      .then(data => setRenewals(data));
  }, 5 * 60 * 1000); // 5 phút
  
  return () => clearInterval(interval);
}, []);
```

---

## 📝 Tóm Tắt

### ❌ Frontend KHÔNG cần implement cron jobs
- Cron jobs chạy trên Backend Server
- Frontend chỉ cần gọi API endpoints

### ✅ Frontend cần làm:
1. Tạo Service để gọi API (`renewalService.ts`)
2. Tạo UI để hiển thị renewals
3. Cho phép user phản hồi (CONFIRMED/DECLINED)
4. Poll API định kỳ để cập nhật dữ liệu

### 🔍 Kiểm tra cron jobs đã chạy:
- **Cách dễ nhất:** Gọi API `/api/v1/registrations/renewals/pending`
- **Nếu có dữ liệu trả về** → Cron jobs đang hoạt động!
- **Nếu empty array** → Có thể chưa có dữ liệu hoặc cron jobs chưa chạy

---

## 💡 Ví Dụ Thực Tế

**Timeline:**
```
📅 02/11/2025 - 00:05 AM
└─ Backend Cron Job P9 chạy tự động
   └─ Phát hiện: "Lịch của Employee ID 10 hết hạn 30/11/2025"
   └─ Tạo renewal request → Lưu vào database
   
📅 02/11/2025 - 08:00 AM
└─ Nhân viên mở app
   └─ Frontend gọi: GET /api/v1/registrations/renewals/pending
   └─ Backend trả về: [ { renewalId: "SRR_...", status: "PENDING_ACTION" } ]
   └─ Frontend hiển thị: "Bạn có 1 renewal request đang chờ"
```

**Kết luận:** 
- Cron jobs = Backend (tự động chạy mỗi đêm)
- Frontend = Gọi API và hiển thị UI

