# 🔧 Yêu Cầu Hỗ Trợ Backend - Room Service Configuration

## 📋 Tình Huống
- **API:** `GET /api/v1/appointments/available-times`
- **Response:** `{ availableSlots: [], message: 'Không có phòng nào hỗ trợ các dịch vụ này' }`
- **Service Code:** `ORTHO_MINIVIS`

## ❌ Vấn Đề
Không có phòng nào trong database được cấu hình để hỗ trợ dịch vụ `ORTHO_MINIVIS`

## ✅ Yêu Cầu Backend

### Option A: Thêm Dữ Liệu Mẫu (Test/Dev Environment)
Chạy SQL để cấu hình room-service mapping:

```sql
-- Kiểm tra service code
SELECT * FROM services WHERE service_code = 'ORTHO_MINIVIS';

-- Kiểm tra rooms hiện có
SELECT * FROM rooms WHERE is_active = true;

-- Thêm mapping cho phòng P-01, P-02, P-03 hỗ trợ ORTHO_MINIVIS
INSERT INTO room_services (room_id, service_id)
SELECT r.room_id, s.service_id
FROM rooms r
CROSS JOIN services s
WHERE r.room_code IN ('P-01', 'P-02', 'P-03')
  AND s.service_code = 'ORTHO_MINIVIS'
  AND NOT EXISTS (
    SELECT 1 FROM room_services rs
    WHERE rs.room_id = r.room_id AND rs.service_id = s.service_id
  );
```

### Option B: API Endpoint Để Frontend Tự Cấu Hình
Xác nhận API này hoạt động:
- **Endpoint:** `PUT /api/v1/rooms/{roomCode}/services`
- **Request Body:**
  ```json
  {
    "serviceCodes": ["ORTHO_MINIVIS", "ORTHO_BRACES", "..."]
  }
  ```

Nếu API này chưa có, cần implement.

### Option C: Seeding Script
Tạo seeding script để khởi tạo dữ liệu mặc định cho room-service mappings:

```java
// RoomServiceSeeder.java
@Component
public class RoomServiceSeeder implements CommandLineRunner {
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private ServiceRepository serviceRepository;
    
    @Override
    public void run(String... args) {
        // Seed default room-service mappings
        seedRoomServices();
    }
    
    private void seedRoomServices() {
        // Example: All examination rooms support general services
        List<Room> examinationRooms = roomRepository.findByRoomType("EXAMINATION");
        List<Service> orthodonticsServices = serviceRepository.findBySpecializationName("ORTHODONTICS");
        
        // Map services to rooms
        // ...
    }
}
```

## 📝 Business Rules Cần Xác Nhận

1. **Mỗi phòng hỗ trợ những dịch vụ nào?**
   - Phòng khám tổng quát: Tất cả dịch vụ?
   - Phòng chuyên khoa: Chỉ dịch vụ của chuyên khoa đó?

2. **Dữ liệu mặc định:**
   - Khi tạo phòng mới, có tự động add dịch vụ mặc định không?
   - Khi tạo dịch vụ mới, có tự động add vào các phòng phù hợp không?

## 🎯 Priority
- **High** - Đang block booking flow trong production/testing

## 📸 Evidence
Console log:
```
✅ Available-times API response: {
  totalDurationNeeded: 45,
  availableSlots: Array(0),
  message: 'Không có phòng nào hỗ trợ các dịch vụ này'
}
```

Frontend đã xử lý đúng và hiển thị error message rõ ràng cho user.
