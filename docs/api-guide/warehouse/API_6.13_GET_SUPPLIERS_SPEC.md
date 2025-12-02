# API 6.13: Get Suppliers List - Technical Specification

**Status**: 📋 PENDING REVIEW
**Priority**: MEDIUM
**Estimated Effort**: 3-4 hours
**Version**: V27 (Proposed)

---

## 📌 Overview

**Endpoint**: `GET /api/v1/warehouse/suppliers`
**Method**: GET
**Purpose**: Retrieve list of suppliers with business metrics for smart procurement decisions

**Business Context:**

- Phòng khám có 5-10 NCC (thuốc, vật tư, dụng cụ)
- Thủ kho cần: Tìm số điện thoại sales, check lịch sử giao dịch, phát hiện NCC lâu không liên hệ
- Support import transaction workflow (chọn NCC khi tạo phiếu nhập)

---

## 🎯 SCOPE DECISION (After Expert Review)

### ✅ IMPLEMENT (Core Features)

| Feature                                     | Reason                                         | Complexity  |
| ------------------------------------------- | ---------------------------------------------- | ----------- |
| **Pagination**                              | Cần thiết cho danh sách lớn                    | ⭐ Easy     |
| **Search** (name, phone, email)             | Thủ kho tìm nhanh NCC                          | ⭐ Easy     |
| **totalOrders**                             | Business value cao (xem NCC nào mua nhiều)     | ⭐⭐ Medium |
| **lastOrderDate**                           | Phát hiện NCC "ngủ đông" (lâu không giao dịch) | ⭐⭐ Medium |
| **isActive filter**                         | Phân biệt NCC còn hợp tác vs ngừng             | ⭐ Easy     |
| **isBlacklisted flag**                      | Cảnh báo NCC cấm mua (hàng giả, lừa đảo)       | ⭐ Easy     |
| **Sort** (name, totalOrders, lastOrderDate) | UI sắp xếp linh hoạt                           | ⭐ Easy     |

### ❌ SKIP (Phase 2 - After Defense)

| Feature                      | Reason                                               | Complexity           |
| ---------------------------- | ---------------------------------------------------- | -------------------- |
| **ratingScore** (1-5 sao)    | Cần thêm bảng `supplier_reviews`, CRON tính điểm     | ⭐⭐⭐⭐ High        |
| **Tier Levels** (TIER_1/2/3) | Feature cho enterprise ERP, không cần cho phòng khám | ⭐⭐⭐ Medium        |
| **Smart Procurement AI**     | Gợi ý NCC tự động dựa trên ML                        | ⭐⭐⭐⭐⭐ Very High |
| **Supplier Dashboard**       | Biểu đồ performance, analytics                       | ⭐⭐⭐⭐ High        |
| **minRating filter**         | Không có rating system nên không cần                 | N/A                  |

---

## 📦 REQUEST SPECIFICATION

### Query Parameters

```typescript
interface GetSuppliersRequest {
  // Pagination
  page?: number; // Default: 0
  size?: number; // Default: 20

  // Search (flexible - tìm qua nhiều trường)
  search?: string; // Tìm theo: supplierName, contactPerson, phone, email

  // Filters
  isActive?: boolean; // Default: true (chỉ hiện NCC đang hợp tác)
  // null = all, false = chỉ NCC ngừng hợp tác

  // Sorting
  sortBy?: "supplierName" | "totalOrders" | "lastOrderDate"; // Default: 'supplierName'
  sortDir?: "asc" | "desc"; // Default: 'asc'
}
```

### Example Requests

**1. Default - Danh sách NCC đang hợp tác (A-Z):**

```bash
GET /api/v1/warehouse/suppliers
```

**2. Tìm NCC theo số điện thoại:**

```bash
GET /api/v1/warehouse/suppliers?search=0901234567
```

**3. NCC mua nhiều nhất (ưu tiên gọi):**

```bash
GET /api/v1/warehouse/suppliers?sortBy=totalOrders&sortDir=desc
```

**4. NCC lâu không giao dịch (cần check giá):**

```bash
GET /api/v1/warehouse/suppliers?sortBy=lastOrderDate&sortDir=asc
```

**5. Tất cả NCC (kể cả ngừng hợp tác):**

```bash
GET /api/v1/warehouse/suppliers?isActive=null
```

---

## 📦 RESPONSE SPECIFICATION

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Suppliers retrieved successfully",
  "data": {
    // Pagination metadata
    "page": 0,
    "size": 20,
    "totalPages": 1,
    "totalElements": 4,

    // Supplier list
    "content": [
      {
        "supplierId": 1,
        "supplierCode": "SUP-001",
        "supplierName": "Công ty Vật tư Nha khoa A",
        "contactPerson": "Nguyễn Văn A (Sales Manager)",
        "phone": "0901234567",
        "email": "info@vatlieunk.vn",
        "address": "123 Nguyễn Huệ, Q1, TPHCM",

        // ✅ Business Metrics (KEEP)
        "totalOrders": 150, // Đã mua 150 lần
        "lastOrderDate": "2025-11-20", // Lần cuối 3 ngày trước → Tin cậy

        // Status flags
        "isActive": true,
        "isBlacklisted": false,

        // Metadata
        "createdDate": "2024-01-15T08:00:00",
        "lastModifiedDate": "2025-11-20T10:30:00",
        "notes": "NCC uy tín, giao hàng nhanh, chiết khấu 5%"
      },
      {
        "supplierId": 2,
        "supplierCode": "SUP-002",
        "supplierName": "Công ty Thiết bị Y tế B",
        "contactPerson": "Trần Thị B",
        "phone": "0912345678",
        "email": "sales@thietbiyb.vn",
        "address": "456 Lê Lợi, Q1, TPHCM",

        "totalOrders": 5,
        "lastOrderDate": "2024-05-10", // ⚠️ 6 tháng trước → Cần check giá

        "isActive": true,
        "isBlacklisted": false,
        "notes": "⚠️ Lâu không giao dịch. Nên gọi confirm giá trước khi đặt!"
      },
      {
        "supplierId": 3,
        "supplierCode": "SUP-003",
        "supplierName": "Công ty Dược phẩm C - Mới",
        "contactPerson": "Lê Văn C",
        "phone": "0923456789",
        "email": "order@duocphamc.vn",

        "totalOrders": 0, // Chưa từng mua
        "lastOrderDate": null, // Chưa có giao dịch

        "isActive": true,
        "isBlacklisted": false,
        "notes": "NCC mới, cần test với đơn nhỏ trước khi đặt số lượng lớn"
      },
      {
        "supplierId": 99,
        "supplierCode": "SUP-099",
        "supplierName": "Công ty Ma (Lừa đảo)",
        "contactPerson": "Nguyễn Văn Lừa",
        "phone": "0987654321",

        "totalOrders": 1,
        "lastOrderDate": "2023-01-15",

        "isActive": false,
        "isBlacklisted": true, // 🚨 CẤM MUA

        "notes": "🚨 BLACKLIST: Hàng giả, đã report công an. KHÔNG ĐƯỢC ĐẶT HÀNG!"
      }
    ]
  }
}
```

### Field Descriptions

| Field              | Type      | Nullable | Description                       |
| ------------------ | --------- | -------- | --------------------------------- |
| `supplierId`       | Long      | No       | Primary key                       |
| `supplierCode`     | String    | No       | Mã NCC (VD: SUP-001)              |
| `supplierName`     | String    | No       | Tên công ty                       |
| `contactPerson`    | String    | Yes      | Người liên hệ (Sales)             |
| `phone`            | String    | No       | Số điện thoại                     |
| `email`            | String    | Yes      | Email                             |
| `address`          | String    | Yes      | Địa chỉ                           |
| `totalOrders`      | Integer   | No       | Tổng số lần đã mua (COUNT)        |
| `lastOrderDate`    | LocalDate | Yes      | Ngày mua hàng gần nhất (MAX)      |
| `isActive`         | Boolean   | No       | true: Đang hợp tác, false: Ngừng  |
| `isBlacklisted`    | Boolean   | No       | true: CẤM MUA (hàng giả, lừa đảo) |
| `createdDate`      | DateTime  | No       | Ngày tạo NCC                      |
| `lastModifiedDate` | DateTime  | Yes      | Ngày cập nhật cuối                |
| `notes`            | String    | Yes      | Ghi chú (chiết khấu, đánh giá)    |

---

## 🔒 SECURITY & AUTHORIZATION

### Required Permissions

**Any ONE of:**

- `ROLE_ADMIN` (full access)
- `VIEW_WAREHOUSE` (warehouse staff - view only)
- `MANAGE_SUPPLIERS` (purchasing manager - full CRUD)

```java
@PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_WAREHOUSE', 'MANAGE_SUPPLIERS')")
```

### Permission Rationale

- **Read-only API** (không modify data)
- **Warehouse staff** cần xem để tạo phiếu nhập (API 6.4)
- **Purchasing manager** cần để quản lý NCC

---

## ⚙️ BUSINESS LOGIC

### 1. Search Logic (Flexible Multi-Field)

```sql
WHERE (:search IS NULL OR
       supplier_name ILIKE %:search% OR
       contact_person ILIKE %:search% OR
       phone LIKE %:search% OR
       email ILIKE %:search%)
```

**Examples:**

- Search "0901234567" → Tìm theo phone
- Search "Nguyen" → Tìm theo contactPerson
- Search "vatlieu" → Tìm theo supplierName

### 2. Metrics Calculation

```sql
-- totalOrders: COUNT import transactions
SELECT COUNT(t.transaction_id)
FROM import_transactions t
WHERE t.supplier_id = s.supplier_id

-- lastOrderDate: MAX transaction date
SELECT MAX(t.transaction_date)
FROM import_transactions t
WHERE t.supplier_id = s.supplier_id
```

### 3. Default Sorting

- **Default**: `supplierName ASC` (A-Z cho UI dropdown)
- **Business priority**: `totalOrders DESC` (NCC mua nhiều lên đầu)
- **Alert priority**: `lastOrderDate ASC` (NCC lâu không mua lên đầu)

### 4. Blacklist Warning

Frontend nên hiển thị:

```javascript
if (supplier.isBlacklisted) {
  return <Badge color="red">🚨 CẤM MUA</Badge>;
}

if (supplier.totalOrders === 0) {
  return <Badge color="yellow">⚠️ NCC MỚI</Badge>;
}

const daysSinceLastOrder = daysBetween(supplier.lastOrderDate, today);
if (daysSinceLastOrder > 180) {
  return <Badge color="orange">⚠️ LÂU KHÔNG LIÊN HỆ</Badge>;
}
```

---

## 💻 IMPLEMENTATION CHECKLIST

### 1. Database Schema (Already exists)

```sql
-- Table: suppliers (V22 - already created)
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,  -- ✅ Need to ADD this column
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);
```

**TODO**: Add `is_blacklisted` column to existing table

### 2. Entity (Update existing)

**File**: `Supplier.java`

```java
@Entity
@Table(name = "suppliers")
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long supplierId;

    private String supplierCode;
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private Boolean isActive = true;

    @Column(name = "is_blacklisted")
    private Boolean isBlacklisted = false;  // ✅ ADD THIS

    private String notes;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;

    // OneToMany relationship (optional - for eager loading)
    @OneToMany(mappedBy = "supplier")
    private List<ImportTransaction> importTransactions;
}
```

### 3. DTOs (Create new)

**File**: `SupplierListDTO.java` (Response)

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierListDTO {
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;

    // Business metrics
    private Integer totalOrders;
    private LocalDate lastOrderDate;

    // Status
    private Boolean isActive;
    private Boolean isBlacklisted;

    // Metadata
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
    private String notes;
}
```

**File**: `SupplierFilterRequest.java` (Request)

```java
@Getter
@Setter
public class SupplierFilterRequest {
    private Integer page = 0;
    private Integer size = 20;
    private String search;
    private Boolean isActive = true;  // Default: only active suppliers
    private String sortBy = "supplierName";
    private String sortDir = "asc";
}
```

**File**: `SupplierPageResponse.java` (Wrapper)

```java
@Getter
@Setter
@AllArgsConstructor
public class SupplierPageResponse {
    private Integer page;
    private Integer size;
    private Integer totalPages;
    private Long totalElements;
    private List<SupplierListDTO> content;
}
```

### 4. Repository (Update existing)

**File**: `SupplierRepository.java`

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    /**
     * API 6.13: Get suppliers with business metrics
     * Uses LEFT JOIN to calculate totalOrders and lastOrderDate
     */
    @Query("""
        SELECT new com.dental.clinic.management.warehouse.dto.response.SupplierListDTO(
            s.supplierId,
            s.supplierCode,
            s.supplierName,
            s.contactPerson,
            s.phone,
            s.email,
            s.address,
            COUNT(t.transactionId),
            MAX(t.transactionDate),
            s.isActive,
            s.isBlacklisted,
            s.createdDate,
            s.lastModifiedDate,
            s.notes
        )
        FROM Supplier s
        LEFT JOIN ImportTransaction t ON t.supplier.supplierId = s.supplierId
        WHERE (:search IS NULL OR
               LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(s.contactPerson) LIKE LOWER(CONCAT('%', :search, '%')) OR
               s.phone LIKE CONCAT('%', :search, '%') OR
               LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:isActive IS NULL OR s.isActive = :isActive)
        GROUP BY s.supplierId
        ORDER BY
          CASE WHEN :sortBy = 'totalOrders' AND :sortDir = 'desc'
               THEN COUNT(t.transactionId) END DESC,
          CASE WHEN :sortBy = 'totalOrders' AND :sortDir = 'asc'
               THEN COUNT(t.transactionId) END ASC,
          CASE WHEN :sortBy = 'lastOrderDate' AND :sortDir = 'desc'
               THEN MAX(t.transactionDate) END DESC,
          CASE WHEN :sortBy = 'lastOrderDate' AND :sortDir = 'asc'
               THEN MAX(t.transactionDate) END ASC,
          CASE WHEN :sortBy = 'supplierName' AND :sortDir = 'asc'
               THEN s.supplierName END ASC,
          CASE WHEN :sortBy = 'supplierName' AND :sortDir = 'desc'
               THEN s.supplierName END DESC
        """)
    Page<SupplierListDTO> findAllWithStats(
        @Param("search") String search,
        @Param("isActive") Boolean isActive,
        @Param("sortBy") String sortBy,
        @Param("sortDir") String sortDir,
        Pageable pageable
    );
}
```

### 5. Service Layer (Update existing)

**File**: `SupplierService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

    private final SupplierRepository supplierRepository;

    /**
     * API 6.13: Get suppliers with business metrics
     */
    @Transactional(readOnly = true)
    public SupplierPageResponse getSuppliers(SupplierFilterRequest filter) {
        log.info("Fetching suppliers - page: {}, size: {}, search: '{}', isActive: {}",
            filter.getPage(), filter.getSize(), filter.getSearch(), filter.getIsActive());

        // Validate sort parameters
        validateSortParams(filter.getSortBy(), filter.getSortDir());

        // Create pageable
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize());

        // Query with metrics
        Page<SupplierListDTO> page = supplierRepository.findAllWithStats(
            filter.getSearch(),
            filter.getIsActive(),
            filter.getSortBy(),
            filter.getSortDir(),
            pageable
        );

        log.info("Found {} suppliers (total: {})", page.getContent().size(), page.getTotalElements());

        return new SupplierPageResponse(
            page.getNumber(),
            page.getSize(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getContent()
        );
    }

    private void validateSortParams(String sortBy, String sortDir) {
        List<String> validSortFields = List.of("supplierName", "totalOrders", "lastOrderDate");
        if (!validSortFields.contains(sortBy)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("Invalid sort field '%s'. Allowed: %s", sortBy, validSortFields)
            );
        }

        if (!List.of("asc", "desc").contains(sortDir)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid sort direction. Allowed: asc, desc"
            );
        }
    }
}
```

### 6. Controller (Update existing)

**File**: `SupplierController.java`

```java
@RestController
@RequestMapping("/api/v1/warehouse/suppliers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supplier Management", description = "API 6.13 - Get Suppliers with Business Metrics")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @ApiMessage("Suppliers retrieved successfully")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_WAREHOUSE', 'MANAGE_SUPPLIERS')")
    @Operation(summary = "Get Suppliers List with Business Metrics", description = """
        API 6.13 - Retrieve list of suppliers with transaction statistics

        **Business Metrics:**
        - totalOrders: Number of import transactions from this supplier
        - lastOrderDate: Most recent purchase date (helps detect inactive suppliers)

        **Use Cases:**
        1. Import form: Select supplier dropdown (sort by totalOrders DESC)
        2. Procurement: Find reliable suppliers (high totalOrders)
        3. Price check: Identify suppliers with old lastOrderDate (>6 months)
        4. Blacklist check: Avoid blocked suppliers

        **Search**: Multi-field search (name, contact, phone, email)
        **Filter**: isActive (true/false/null for all)
        **Sort**: supplierName | totalOrders | lastOrderDate

        **Permissions:**
        - VIEW_WAREHOUSE: View suppliers (warehouse staff)
        - MANAGE_SUPPLIERS: Full CRUD access (purchasing manager)
        """)
    public ResponseEntity<SupplierPageResponse> getSuppliers(
        @ModelAttribute SupplierFilterRequest filter) {

        log.info("GET /api/v1/warehouse/suppliers - Filters: search='{}', isActive={}, sortBy={}",
            filter.getSearch(), filter.getIsActive(), filter.getSortBy());

        SupplierPageResponse response = supplierService.getSuppliers(filter);

        return ResponseEntity.ok(response);
    }
}
```

### 7. Migration Script (Add is_blacklisted column)

**File**: `V27__add_supplier_blacklist.sql` (NEW)

```sql
-- Version: V27
-- Date: 2025-11-29
-- Description: Add is_blacklisted flag to suppliers table for API 6.13

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_blacklisted ON suppliers(is_blacklisted);

-- Add comment
COMMENT ON COLUMN suppliers.is_blacklisted IS 'Flag to mark suppliers as blacklisted (fake products, fraud). UI should show warning.';

-- Example: Mark fake supplier as blacklisted
-- UPDATE suppliers SET is_blacklisted = TRUE WHERE supplier_code = 'SUP-099';
```

### 8. Update seed data (Add sample blacklisted supplier)

**File**: `dental-clinic-seed-data.sql`

```sql
-- Add blacklisted supplier example
INSERT INTO suppliers (
    supplier_code, supplier_name, contact_person, phone, email, address,
    is_active, is_blacklisted, notes
) VALUES (
    'SUP-099',
    'Công ty Ma (Lừa đảo)',
    'Nguyễn Văn Lừa',
    '0987654321',
    'fake@scam.com',
    '123 Đường Giả, Q.Lừa, TP.Scam',
    FALSE,
    TRUE,
    '🚨 BLACKLIST: Hàng giả, đã report công an. KHÔNG ĐƯỢC ĐẶT HÀNG!'
) ON CONFLICT (supplier_code) DO NOTHING;
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests (SupplierServiceTest.java)

```java
@Test
void testGetSuppliers_DefaultFilters_ShouldReturnActiveSuppliers() {
    // Arrange
    SupplierFilterRequest filter = new SupplierFilterRequest();

    // Act
    SupplierPageResponse response = supplierService.getSuppliers(filter);

    // Assert
    assertThat(response.getContent()).isNotEmpty();
    assertThat(response.getContent())
        .allMatch(s -> s.getIsActive() == true);
}

@Test
void testGetSuppliers_SearchByPhone_ShouldFindSupplier() {
    // Arrange
    SupplierFilterRequest filter = new SupplierFilterRequest();
    filter.setSearch("0901234567");

    // Act
    SupplierPageResponse response = supplierService.getSuppliers(filter);

    // Assert
    assertThat(response.getContent()).hasSize(1);
    assertThat(response.getContent().get(0).getPhone()).contains("0901234567");
}

@Test
void testGetSuppliers_SortByTotalOrders_ShouldOrderCorrectly() {
    // Arrange
    SupplierFilterRequest filter = new SupplierFilterRequest();
    filter.setSortBy("totalOrders");
    filter.setSortDir("desc");

    // Act
    SupplierPageResponse response = supplierService.getSuppliers(filter);

    // Assert
    List<Integer> orders = response.getContent().stream()
        .map(SupplierListDTO::getTotalOrders)
        .toList();
    assertThat(orders).isSorted(Comparator.reverseOrder());
}
```

### Integration Tests (Manual)

1. **GET default** → Trả về NCC active, sort A-Z
2. **GET ?search=0901** → Tìm theo phone
3. **GET ?search=Nguyen** → Tìm theo contact person
4. **GET ?isActive=false** → Chỉ NCC ngừng hợp tác
5. **GET ?sortBy=totalOrders&sortDir=desc** → NCC mua nhiều nhất lên đầu
6. **GET ?sortBy=lastOrderDate&sortDir=asc** → NCC lâu không mua lên đầu
7. **Check blacklisted supplier** → Hiển thị warning

---

## 📊 IMPACT ANALYSIS

### Database Impact

- ✅ **Minimal**: 1 column added (`is_blacklisted`)
- ✅ **No breaking changes**: Existing queries unaffected
- ✅ **Index added**: Performance optimized

### Performance Impact

**Query complexity:**

```sql
-- Single query with LEFT JOIN + GROUP BY
-- Expected execution time: 20-50ms (for 10 suppliers, 100 transactions)
```

**Scaling:**

- 10 suppliers, 1,000 transactions → ~50ms
- 100 suppliers, 10,000 transactions → ~200ms (still acceptable)

### Frontend Impact

**New API available for:**

- Import transaction form (chọn NCC)
- Supplier management page
- Dashboard widgets (top suppliers)

---

## ⏱️ IMPLEMENTATION ESTIMATE

| Task                                    | Time         | Priority |
| --------------------------------------- | ------------ | -------- |
| Add `is_blacklisted` column + migration | 30 min       | High     |
| Update Entity, DTOs                     | 30 min       | High     |
| Update Repository query                 | 1 hour       | High     |
| Service layer + validation              | 1 hour       | High     |
| Controller + Swagger docs               | 30 min       | High     |
| Unit tests                              | 1 hour       | Medium   |
| Manual testing                          | 30 min       | High     |
| **TOTAL**                               | **~5 hours** |          |

**Note**: Estimate increased from 3-4h to 5h due to:

- Complex ORDER BY with multiple conditions
- Unit test coverage for all scenarios
- Manual testing for edge cases

---

## ✅ REVIEW CHECKLIST (For You to Check)

- [ ] **Business value clear?** → totalOrders + lastOrderDate giúp quyết định mua hàng
- [ ] **Scope reasonable?** → Bỏ rating system, chỉ giữ core metrics
- [ ] **Implementation feasible?** → Single query, không phức tạp
- [ ] **Test coverage?** → 3 unit tests + 7 manual scenarios
- [ ] **No breaking changes?** → Chỉ thêm column, không sửa existing
- [ ] **Frontend ready?** → DTO structure rõ ràng, có pagination
- [ ] **Security OK?** → VIEW_WAREHOUSE permission (đã có sẵn)
- [ ] **Worth the effort?** → 5 giờ cho feature thiết yếu (NCC management)

---

## 🚦 DECISION NEEDED

**Option 1: IMPLEMENT NOW** ✅ Recommended

- API 6.13 là core feature cho warehouse module
- Cần thiết cho import transaction workflow
- Không phức tạp (5 giờ)

**Option 2: DEFER TO PHASE 2**

- Focus vào module khác trước (Treatment Plan, Appointment)
- Implement sau khi core workflows done

**Option 3: SIMPLIFY FURTHER**

- Bỏ totalOrders + lastOrderDate
- Chỉ implement basic list (2 giờ thay vì 5 giờ)

---

## 📝 NOTES

- Spec này đã được review bởi expert (Senior Dev + Dentist)
- Đã loại bỏ các feature overkill (rating, tier, AI)
- totalOrders + lastOrderDate được GIỮ vì business value cao
- Ready để implement khi bạn approve

---

**Last Updated**: 2025-11-29
**Status**: 📋 PENDING REVIEW
**Next Step**: Waiting for your decision to implement
