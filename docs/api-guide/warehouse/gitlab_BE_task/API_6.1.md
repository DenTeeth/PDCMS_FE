Module: 6. Quản lý Kho (Bảng: item_masters, item_batches, item_units)
Mục đích: Theo dõi tồn kho thực tế, quản lý định mức (Min/Max), theo dõi hạn sử dụng và trạng thái hàng hóa để ra quyết định nhập hàng hoặc xả hàng.
RBAC Permissions:


        
      
VIEW_WAREHOUSE: Quyền xem danh sách tồn kho, chi tiết lô hàng.

        
      
MANAGE_WAREHOUSE: Quyền thực hiện nhập/xuất kho, điều chỉnh tồn kho.

        
      
VIEW_WAREHOUSE_REPORTS: Quyền xem báo cáo, biểu đồ biến động giá.



6.1. Lấy Báo cáo Tổng hợp Tồn kho (Dashboard Kho)
Method: GET
Endpoint: /api/v3/warehouse/summary
Miêu tả: Lấy danh sách tất cả Item Masters kèm theo tổng số lượng tồn kho (được cộng dồn từ các lô/batches), và trạng thái tồn kho tự động tính toán. Dùng cho màn hình Dashboard hoặc Danh sách vật tư.
Authorization: Yêu cầu quyền VIEW_WAREHOUSE.
Query Parameters (Bộ lọc):


        
      
page (optional, integer, default: 0): Số thứ tự trang.

        
      
size (optional, integer, default: 20): Số lượng bản ghi/trang.

        
      
search (optional, string): Từ khóa tìm kiếm (tìm theo Tên vật tư item_name hoặc Mã item_code).

        
      
stockStatus (optional, enum): Lọc theo trạng thái tồn kho. Giá trị: LOW_STOCK, OUT_OF_STOCK, OVERSTOCK, NORMAL.

        
      
warehouseType (optional, enum): Lọc theo loại kho. Giá trị: COLD (Kho lạnh), NORMAL (Kho thường).

        
      
categoryId (optional, integer): Lọc theo ID nhóm vật tư.

Business Logic & Validation:


        
      
Xử lý Bộ lọc (Filter Pre-processing):


        
      Chuẩn bị câu truy vấn (JPQL/Criteria) vào bảng item_masters (bảng cha).

        
      Nếu có search, áp dụng LIKE %keyword% cho cả item_name và item_code.

        
      Nếu có warehouseType hoặc categoryId, áp dụng điều kiện WHERE tương ứng.



        
      
Tính toán Tổng tồn kho (Aggregation):


        
      Thực hiện LEFT JOIN bảng item_masters với bảng item_batches.

        
      Tính totalQuantity = SUM(item_batches.quantity_on_hand).

        
      
Lưu ý: Chỉ cộng các batch thuộc item đó. Nếu không có batch nào hoặc batch trống, totalQuantity = 0.



        
      
Tính toán Ngày hết hạn gần nhất (Nearest Expiry):


        
      Trong cùng câu query (hoặc sub-query), tìm MIN(item_batches.expiry_date) với điều kiện quantity_on_hand > 0.

        
      Mục đích: Hiển thị cho thủ kho biết lô nào sắp hết hạn nhất để ưu tiên dùng (FEFO).



        
      
Tính toán Trạng thái Tồn kho (Computed Stock Status):


        
      So sánh totalQuantity với min_stock_level và max_stock_level (được định nghĩa trong item_masters):

        
      Nếu totalQuantity == 0 -> OUT_OF_STOCK (Hết hàng).

        
      Nếu totalQuantity < min_stock_level -> LOW_STOCK (Sắp hết - Cần nhập).

        
      Nếu totalQuantity > max_stock_level -> OVERSTOCK (Dư thừa).

        
      Còn lại -> NORMAL (Bình thường).



        
      
Lọc theo Trạng thái (Post-Filter):

Nếu tham số stockStatus được truyền vào (VD: chỉ muốn xem hàng LOW_STOCK), hệ thống phải lọc kết quả dựa trên giá trị đã tính toán ở bước 4 (Sử dụng HAVING clause trong SQL hoặc lọc trên Memory sau khi query tùy performance).



        
      
Lấy Đơn vị tính cơ sở (Base Unit):


JOIN với bảng item_units để lấy unit_name có is_base_unit = true (VD: Viên, Ống, Cái). Để hiển thị số lượng thống nhất.



        
      
Trả về Response:

Danh sách Items kèm các trường tính toán (totalQuantity, stockStatus, nearestExpiryDate).



Response Body (200 OK):
{ "statusCode": 200, "message": "Inventory summary retrieved successfully", "data": { "page": 0, "size": 20, "totalPages": 5, "totalItems": 98, "content": [ { "itemMasterId": 24, "itemCode": "DP-AMOX-500", "itemName": "Amoxicillin 500mg", "categoryName": "Thuốc Kháng sinh", "warehouseType": "COLD", "unitName": "Viên", // Đơn vị cơ sở "minStockLevel": 100, "maxStockLevel": 1000,

    // Các trường tính toán (Computed)
    "totalQuantity": 450, 
    "stockStatus": "NORMAL",
    "nearestExpiryDate": "2025-09-30" // Date của lô sắp hết hạn nhất
  },
  {
    "itemMasterId": 30,
    "itemCode": "VT-GANG-TAY-M",
    "itemName": "Găng tay y tế (Size M)",
    "categoryName": "Vật tư tiêu hao",
    "warehouseType": "NORMAL",
    "unitName": "Đôi",
    "minStockLevel": 50,
    "maxStockLevel": 500,
    
    "totalQuantity": 10, 
    "stockStatus": "LOW_STOCK", // Cảnh báo đỏ trên FE
    "nearestExpiryDate": "2026-01-01"
  }
]


} }

API 6.2: Lấy Chi tiết Lô hàng (Get Item Batches)
Method: GET
Endpoint: /api/v3/warehouse/batches/{itemMasterId}
Miêu tả: API này giúp nhân viên kho nhìn thấy "bên trong" một mã vật tư (Item Master) đang có những lô hàng thực tế nào. Trả lời câu hỏi: "Thuốc này còn bao nhiêu lô? Lô nào sắp hết hạn (FEFO)? Nó nằm ở kệ nào?".
Authorization: Yêu cầu quyền VIEW_WAREHOUSE.

Request (Path & Query Parameters)


        
      
itemMasterId (required, integer): ID định danh của Vật tư (Item Master) cần xem (Path Variable).

        
      
page (optional, integer, default: 0): Số thứ tự trang hiện tại (Bắt đầu từ 0).

        
      
size (optional, integer, default: 20): Số lượng lô hàng trên mỗi trang.

        
      
hideEmpty (optional, boolean, default: true):


        
      Nếu true: Chỉ hiện các lô còn hàng (quantity_on_hand > 0) để danh sách gọn gàng.

        
      Nếu false: Hiện cả lịch sử các lô cũ đã xuất hết (qty=0) để tra cứu.



        
      
filterStatus (optional, enum, default: null): Lọc theo trạng thái Hạn sử dụng. Các giá trị: EXPIRED, CRITICAL, EXPIRING_SOON, VALID.

        
      
sortBy (optional, string, default: 'expiryDate'): Trường cần sắp xếp. Các giá trị: expiryDate, quantityOnHand, importedAt.

        
      
sortDir (optional, string, default: 'asc'): Hướng sắp xếp. Các giá trị: asc (Tăng dần), desc (Giảm dần).


Business Logic & Validation (Quy trình xử lý Backend)


        
      
Validate Tài nguyên (Input Validation):


        
      Kiểm tra itemMasterId có tồn tại trong bảng item_masters không.

        
      Nếu không tồn tại -> Trả về lỗi 404 NOT FOUND.

        
      Kiểm tra tham số sortBy có hợp lệ không -> Nếu sai field, trả về 400 BAD REQUEST.



        
      
Xây dựng Truy vấn & Tối ưu hiệu năng (Query & Performance):


        
      Truy vấn bảng item_batches với điều kiện item_master_id = {itemMasterId}.

        
      
Quan trọng (Performance): Câu truy vấn PHẢI sử dụng JOIN FETCH (hoặc @EntityGraph) để lấy thông tin Supplier (Nhà cung cấp) ngay trong 1 lần gọi DB. Tránh lỗi N+1 Query khi loop qua danh sách lô hàng.

        
      Áp dụng điều kiện hideEmpty: Nếu true -> Thêm điều kiện WHERE quantity_on_hand > 0.



        
      
Chiến lược Sắp xếp (FEFO Strategy):


        
      Nếu client không gửi tham số sortBy, hệ thống MẶC ĐỊNH sắp xếp theo expiryDate ASC (Tăng dần).

        
      
Mục đích: Đảm bảo nguyên tắc FEFO (First Expired, First Out) - Hàng hết hạn trước phải nằm trên cùng danh sách để nhân viên lấy trước.



        
      
Tính toán Trạng thái & Hạn dùng (Computed Logic):


        
      Lặp qua danh sách kết quả (List of Batches). Với mỗi Batch:

        
      Lấy expiryDate so sánh với Current Server Date.

        
      Tính daysRemaining = expiryDate - Now.

        
      Gán nhãn trạng thái (status) theo quy tắc:


        
      
EXPIRED: daysRemaining < 0 (Đã hết hạn).

        
      
CRITICAL: 0 <= daysRemaining <= 7 (Cần xử lý gấp).

        
      
EXPIRING_SOON: 7 < daysRemaining <= 30 (Cảnh báo nhập mới).

        
      
VALID: daysRemaining > 30 (An toàn).





        
      
Tổng hợp Thống kê (Summary Stats Calculation):


        
      Tính toán đối tượng stats để trả về header (giúp FE hiển thị Dashboard nhỏ):

        
      
totalBatches: Tổng số lô tìm thấy.

        
      
totalQuantityOnHand: Tổng số lượng thực tế (SUM(quantity_on_hand)).

        
      
expiredBatches, criticalBatches...: Đếm số lượng lô theo từng nhóm trạng thái.



        
      
Mapping & Trả về:


        
      Map Entity sang DTO. Đảm bảo các trường binLocation, lotNumber được trả về đầy đủ cho mục đích Logistics.

        
      
Lưu ý: Không trả về các trường liên quan đến Tiền/Giá vốn (Purchase Price) ở API này (thuộc Module Kế toán).




Response Body (Success 200 OK)
{ "statusCode": 200, "message": "Item batches retrieved successfully", "data": { // 1. Context: Thông tin chung vật tư "itemMasterId": 24, "itemCode": "DP-AMOX-500", "itemName": "Amoxicillin 500mg", "unitName": "Hộp", // Đơn vị tính cơ sở "minStockLevel": 100,

// 2. Summary Stats: Thống kê Vận hành


"stats": {
  "totalBatches": 15,
  "expiredBatches": 2,      // Số lô đã hết hạn (Cần hủy)
  "criticalBatches": 3,     // Số lô còn <= 7 ngày (Cần dùng gấp)
  "warningBatches": 5,      // Số lô còn <= 30 ngày
  "validBatches": 5,        // Số lô an toàn
  "totalQuantityOnHand": 450 // Tổng số lượng vật lý thực tế
},

// 3. Metadata: Phân trang


"meta": {
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 15
},

// 4. List: Danh sách chi tiết lô hàng


"batches": [
  {
    "batchId": 196,
    "lotNumber": "LOT-2023-A1",
    "expiryDate": "2025-12-01",
    
    // Inventory Info
    "quantityOnHand": 50,
    "initialQuantity": 100,
    "usageRate": 50.0, // % đã dùng (Giúp đánh giá tốc độ tiêu thụ)
    
    // Logistics Info (Quan trọng nhất cho nhân viên kho)
    "binLocation": "Kệ A - Tầng 2 - Hộp 05", 
    "supplierName": "Dược Hậu Giang",
    "importedAt": "2023-12-01T08:00:00",
    
    // Computed Status (Vận hành)
    "daysRemaining": 7,
    "status": "CRITICAL" // Màu Đỏ
  },
  {
    "batchId": 205,
    "lotNumber": "LOT-2024-B2",
    "expiryDate": "2026-06-15",
    "quantityOnHand": 400,
    "initialQuantity": 400,
    "usageRate": 0.0, // Mới nhập, chưa dùng
    
    "binLocation": "Kho Lạnh - Ngăn 3",
    "supplierName": "Dược Hậu Giang",
    "importedAt": "2024-06-01T14:30:00",
    
    "daysRemaining": 203,
    "status": "VALID" // Màu Xanh
  }
]


} }

Error Responses (Các lỗi thường gặp)
404 Not Found (Không tìm thấy vật tư):
{ "statusCode": 404, "error": "NOT_FOUND", "message": "Item master not found with ID: 999" }
400 Bad Request (Sai tham số):
{ "statusCode": 400, "error": "BAD_REQUEST", "message": "Invalid sortBy field 'price'. Allowed values: expiryDate, quantityOnHand, importedAt" }

6.3. Cảnh báo Hàng sắp hết hạn (Get Expiring Alerts)
Method: GET
Endpoint: /api/v3/warehouse/alerts/expiring
Miêu tả: API này hoạt động như một bộ lọc quét toàn bộ kho để tìm ra các lô hàng (Batches) đang có nguy cơ hết hạn hoặc đã hết hạn. Giúp Thủ kho thực hiện chiến lược FEFO (Dùng trước khi hết hạn), lập kế hoạch trả hàng cho Nhà cung cấp hoặc làm phiếu hủy.
Authorization: Yêu cầu quyền VIEW_WAREHOUSE.
Query Parameters (Bộ lọc):


        
      
days (optional, integer, default: 30): Số ngày tới cần quét (VD: 30 ngày). Validation: Min 1, Max 1095 (3 năm).

        
      
categoryId (optional, integer, default: null): Lọc theo ID nhóm vật tư (VD: Chỉ xem Thuốc).

        
      
warehouseType (optional, enum, default: null): Lọc theo loại kho. Giá trị: COLD (Kho lạnh), NORMAL (Kho thường).

        
      
statusFilter (optional, enum, default: null): Lọc nhanh theo trạng thái hạn dùng. Giá trị: EXPIRED, CRITICAL, EXPIRING_SOON.

        
      
page (optional, integer, default: 0): Số thứ tự trang hiện tại (Bắt đầu từ 0).

        
      
size (optional, integer, default: 20): Số lượng bản ghi trên một trang.

Business Logic & Validation:


        
      
Validate Tham số:


days phải là số dương và không quá 3 năm (1095 ngày).



        
      
Điều kiện Lọc (Query Filter):


        
      Chỉ lấy các lô có quantity_on_hand > 0 (Hàng đang thực sự nằm trong kho).

        
      Chỉ lấy các lô có expiry_date <= (Current Date + days).



        
      
Sắp xếp (Sorting):

Mặc định ORDER BY expiry_date ASC. Lô hết hạn sớm nhất (nguy cấp nhất) phải nằm đầu tiên.



        
      
Phân loại Trạng thái (status):


        
      Tính daysRemaining = expiryDate - CurrentDate.

        
      
EXPIRED: daysRemaining < 0 (Đã quá hạn -> Cần hủy).

        
      
CRITICAL: 0 <= daysRemaining <= 7 (Khẩn cấp -> Ưu tiên dùng ngay).

        
      
EXPIRING_SOON: 7 < daysRemaining <= days (Cảnh báo -> Cân nhắc trả/đẩy hàng).



        
      
Tổng hợp Thống kê:

Tính toán header stats (Tổng số lô theo từng trạng thái, Tổng số lượng tồn) để hiển thị Dashboard.



Response Body (200 OK):
{ "statusCode": 200, "message": "Expiring alerts retrieved successfully", "data": { // 1. Context Report "reportDate": "2025-11-24T10:00:00", "thresholdDays": 30,

// 2. Summary Stats (Thống kê vận hành)
"stats": {
  "totalAlerts": 5,
  "expiredCount": 1,        // Số lô đã hết hạn
  "criticalCount": 1,       // Số lô còn <= 7 ngày
  "expiringSoonCount": 3,   // Số lô còn <= 30 ngày
  "totalQuantity": 300      // Tổng số lượng hàng hóa bị ảnh hưởng
},

// 3. Metadata: Phân trang
"meta": {
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 5
},

// 4. List: Danh sách chi tiết
"alerts": [
  {
    "batchId": 105,
    "itemCode": "DP-AMOX-500",
    "itemName": "Amoxicillin 500mg",
    "categoryName": "Thuốc Kháng sinh",
    "warehouseType": "COLD",
    "lotNumber": "LOT-2023-X1",
    
    // Logistics Info: Giúp nhân viên tìm hàng nhanh
    "binLocation": "Kệ A - Tầng 2",
    "quantityOnHand": 50,
    "unitName": "Hộp",
    
    // Expiry Info
    "expiryDate": "2025-11-20", 
    "daysRemaining": -4,
    "status": "EXPIRED", // Enum: EXPIRED | CRITICAL | EXPIRING_SOON
    
    // Supplier Info
    "supplierName": "Dược Hậu Giang"
  },
  {
    "batchId": 208,
    "itemCode": "VT-GANG-TAY",
    "itemName": "Găng tay cao su Y tế",
    "categoryName": "Vật tư tiêu hao",
    "warehouseType": "NORMAL",
    "lotNumber": "GT-009",
    
    "binLocation": "Kho B - Hộc 12",
    "quantityOnHand": 200,
    "unitName": "Đôi",
    
    "expiryDate": "2025-11-28",
    "daysRemaining": 4,
    "status": "CRITICAL",
    
    "supplierName": "3M Vietnam"
  }
]