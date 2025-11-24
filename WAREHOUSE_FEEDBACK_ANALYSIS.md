# 📦 WAREHOUSE FEEDBACK ANALYSIS & SOLUTION

> **Feedback Date:** November 24, 2025  
> **Current System:** Warehouse Management V3  
> **Issue Category:** Logistics & Item Management  

---

## 🎯 FEEDBACK SUMMARY

### 🔴 **CRITICAL ISSUES**

1. **Missing Item Code in Batch Details**
   - ❌ Storage transaction items không có `item_code`
   - ❌ Nhân viên kho không biết bóc vật tư gì ở đâu
   - ⚠️ **Risk:** Vi phạm chuẩn ERP, bị audit fail

2. **Parent-Child Item Relationships**
   - ❌ Không có cách quản lý item cha-con
   - ❌ VD: 1 hộp 10 vỉ → lấy 2 vỉ → không trừ được item cha
   - ⚠️ **Risk:** Sai lệch tồn kho, không tracking được usage

3. **Unit of Measure (UOM) Management**
   - ❌ Không có field `unit` để quản lý đơn vị
   - ❌ VD: Hộp vs Vỉ vs Viên → cùng 1 thuốc nhưng đơn vị khác nhau
   - ⚠️ **Risk:** Khách hàng yêu cầu thay đổi đơn vị → không flexible

4. **Expiry Date Coverage**
   - ❌ Một số items không có `expiry_date`
   - ⚠️ **Risk:** Không quản lý được hạn sử dụng cho một số loại vật tư

---

## 📊 CURRENT DATABASE STRUCTURE

### Existing Tables:

```sql
-- ✅ Đã có
item_masters          -- Item cha (định nghĩa vật tư)
item_batches          -- Lô hàng
storage_transactions  -- Phiếu xuất/nhập
storage_transaction_items -- Chi tiết phiếu
supplier_items        -- Mapping supplier-item
categories            -- Danh mục vật tư
```

### Table Structure:

#### `item_masters` (Hiện tại)
```sql
CREATE TABLE item_masters (
  item_master_id SERIAL PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE,        -- ✅ Có rồi
  item_name VARCHAR(200),
  category_id INTEGER,
  unit_of_measure VARCHAR(50),         -- ✅ Có rồi nhưng chưa dùng đúng
  warehouse_type VARCHAR(20),
  min_stock_level INTEGER,
  max_stock_level INTEGER,
  is_tool BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `item_batches` (Hiện tại)
```sql
CREATE TABLE item_batches (
  batch_id SERIAL PRIMARY KEY,
  item_master_id INTEGER,
  lot_number VARCHAR(100),
  quantity_on_hand INTEGER,
  expiry_date DATE,                    -- ❌ NULL cho tools
  imported_at TIMESTAMP,
  unit_price DECIMAL(18,2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `storage_transaction_items` (Hiện tại)
```sql
CREATE TABLE storage_transaction_items (
  transaction_item_id SERIAL PRIMARY KEY,
  transaction_id INTEGER,
  batch_id INTEGER,
  item_master_id INTEGER,              -- ✅ Có
  lot_number VARCHAR(100),              -- ✅ Có
  quantity_change INTEGER,
  unit_price DECIMAL(18,2),
  total_price DECIMAL(18,2),
  expiry_date DATE,
  notes TEXT
);
-- ❌ THIẾU: item_code (chỉ có item_master_id)
-- ❌ THIẾU: unit_of_measure
```

---

## 🛠️ PROPOSED SOLUTIONS

### ✅ SOLUTION 1: Add Item Code to Transaction Items

**Backend Changes:**

1. **DTO Enhancement:**
```java
// StorageTransactionItemResponse.java
@Data
public class StorageTransactionItemResponse {
    private Long transactionItemId;
    private Long batchId;
    private Long itemMasterId;
    
    // 🆕 ADD THESE
    private String itemCode;        // JOIN from item_masters
    private String itemName;        // Already exists
    private String unitOfMeasure;   // JOIN from item_masters
    
    private String lotNumber;
    private Integer quantityChange;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private LocalDate expiryDate;
}
```

2. **Service Update:**
```java
// StorageTransactionService.java
@Transactional(readOnly = true)
public StorageTransactionResponse getById(Long id) {
    StorageTransaction tx = repository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    
    List<StorageTransactionItemResponse> items = tx.getItems().stream()
        .map(item -> {
            ItemMaster master = itemMasterRepository.findById(item.getItemMasterId())
                .orElseThrow();
            
            return StorageTransactionItemResponse.builder()
                .transactionItemId(item.getId())
                .itemMasterId(master.getId())
                .itemCode(master.getItemCode())         // 🆕 ADD
                .itemName(master.getItemName())
                .unitOfMeasure(master.getUnitOfMeasure()) // 🆕 ADD
                .lotNumber(item.getLotNumber())
                .quantityChange(item.getQuantityChange())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .expiryDate(item.getExpiryDate())
                .build();
        })
        .collect(Collectors.toList());
    
    return StorageTransactionResponse.builder()
        .transactionId(tx.getId())
        .items(items)
        .build();
}
```

3. **SQL Query Alternative (if using native SQL):**
```sql
SELECT 
  sti.transaction_item_id,
  sti.item_master_id,
  im.item_code,              -- 🆕 JOIN
  im.item_name,
  im.unit_of_measure,        -- 🆕 JOIN
  sti.lot_number,
  sti.quantity_change,
  sti.unit_price,
  sti.total_price,
  sti.expiry_date
FROM storage_transaction_items sti
JOIN item_masters im ON sti.item_master_id = im.item_master_id
WHERE sti.transaction_id = ?
```

**Frontend Changes:**

```typescript
// storageService.ts - Type Update
export interface StorageTransactionItem {
  transactionItemId?: number;
  itemMasterId: number;
  itemCode: string;           // 🆕 ADD
  itemName?: string;
  unitOfMeasure?: string;     // 🆕 ADD
  lotNumber: string;
  quantityChange: number;
  unitPrice: number;
  totalPrice?: number;
  expiryDate?: string;
  notes?: string;
}
```

**Impact:** ✅ Giải quyết vấn đề "không biết bóc cái gì ở đâu"

---

### ✅ SOLUTION 2: Parent-Child Item Management

**New Table: `item_components`**

```sql
CREATE TABLE item_components (
  component_id SERIAL PRIMARY KEY,
  parent_item_id INTEGER NOT NULL REFERENCES item_masters(item_master_id),
  child_item_id INTEGER NOT NULL REFERENCES item_masters(item_master_id),
  quantity_per_parent INTEGER NOT NULL,  -- VD: 1 hộp = 10 vỉ
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_parent_child UNIQUE(parent_item_id, child_item_id)
);

-- Index for performance
CREATE INDEX idx_item_components_parent ON item_components(parent_item_id);
CREATE INDEX idx_item_components_child ON item_components(child_item_id);
```

**Sample Data:**

```sql
-- VD: Thuốc tê Lidocaine
-- Parent: LIDO-BOX (Hộp 10 vỉ)
-- Child:  LIDO-STRIP (Vỉ 10 viên)

INSERT INTO item_masters (item_code, item_name, unit_of_measure, warehouse_type) VALUES
('LIDO-BOX', 'Lidocaine 2% (Hộp)', 'Hộp', 'COLD'),
('LIDO-STRIP', 'Lidocaine 2% (Vỉ)', 'Vỉ', 'COLD');

INSERT INTO item_components (parent_item_id, child_item_id, quantity_per_parent) VALUES
(1, 2, 10);  -- 1 hộp = 10 vỉ
```

**Backend Entity:**

```java
@Entity
@Table(name = "item_components")
@Data
public class ItemComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long componentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_item_id", nullable = false)
    private ItemMaster parentItem;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_item_id", nullable = false)
    private ItemMaster childItem;
    
    @Column(nullable = false)
    private Integer quantityPerParent;
    
    private Boolean isActive = true;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**Business Logic: Deduction Flow**

```java
@Service
public class ItemComponentService {
    
    /**
     * Khi xuất 2 vỉ từ hộp 10 vỉ:
     * 1. Tạo transaction xuất 2 vỉ (child item)
     * 2. Tự động update quantity của parent item
     */
    @Transactional
    public void exportChildItem(Long childItemId, int quantity) {
        // 1. Find parent-child relationship
        ItemComponent component = componentRepository
            .findByChildItemId(childItemId)
            .orElse(null);
        
        if (component == null) {
            // No parent, export normally
            exportItem(childItemId, quantity);
            return;
        }
        
        // 2. Export child item
        exportItem(childItemId, quantity);
        
        // 3. Calculate parent quantity to deduct
        // VD: Xuất 2 vỉ, 1 hộp = 10 vỉ
        // → Nếu xuất đủ 10 vỉ thì trừ 1 hộp
        int parentDeduction = quantity / component.getQuantityPerParent();
        int remainingChildUnits = quantity % component.getQuantityPerParent();
        
        if (parentDeduction > 0) {
            // Update parent stock
            ItemMaster parent = component.getParentItem();
            updateItemStock(parent.getId(), -parentDeduction);
            
            // Log: "Xuất 2 vỉ → Trừ item cha còn 8 vỉ trong hộp"
            logComponentDeduction(parent.getId(), childItemId, 
                                  parentDeduction, remainingChildUnits);
        }
    }
    
    /**
     * Track remaining child units in partial parent
     * VD: Hộp ban đầu 10 vỉ, xuất 2 vỉ → còn 8 vỉ
     */
    private void logComponentDeduction(Long parentId, Long childId, 
                                      int parentQtyUsed, int childQtyRemaining) {
        // Option 1: Store in notes field
        // Option 2: New table `item_component_usage`
        // Option 3: Update batch notes
    }
}
```

**Frontend Integration:**

```typescript
// Item Form - Add Parent-Child Selection
interface ItemMasterForm {
  itemCode: string;
  itemName: string;
  unitOfMeasure: string;
  
  // 🆕 ADD
  hasComponents: boolean;
  components?: {
    childItemId: number;
    childItemCode: string;
    quantityPerParent: number;
  }[];
}
```

**Impact:** ✅ Giải quyết bài toán "1 hộp 10 vỉ, xuất 2 vỉ → trừ item cha"

---

### ✅ SOLUTION 3: Unit of Measure Flexibility

**Current `unit_of_measure` field usage:**

```sql
-- ❌ Hiện tại chỉ lưu string đơn giản
unit_of_measure VARCHAR(50)  -- 'Cái', 'Hộp', 'Vỉ', 'Viên'
```

**Enhanced Approach:**

**Option A: Simple String (Current - OK)**
- ✅ Đã có field `unit_of_measure` trong `item_masters`
- ✅ Chỉ cần sử dụng đúng
- ✅ Validation: dropdown với pre-defined units

```typescript
// Frontend - Unit dropdown
const UNIT_OPTIONS = [
  'Cái',
  'Hộp', 
  'Vỉ',
  'Viên',
  'Chai',
  'Ống',
  'Tuýp',
  'Lọ',
  'Gói',
  'Bộ'
];
```

**Option B: UOM Conversion Table (Advanced)**

```sql
CREATE TABLE unit_conversions (
  conversion_id SERIAL PRIMARY KEY,
  item_master_id INTEGER REFERENCES item_masters(item_master_id),
  base_unit VARCHAR(50),      -- 'Viên'
  conversion_unit VARCHAR(50), -- 'Vỉ'
  conversion_factor DECIMAL(10,4), -- 10 (1 vỉ = 10 viên)
  is_active BOOLEAN DEFAULT TRUE
);

-- Example
INSERT INTO unit_conversions VALUES
(1, 1, 'Viên', 'Vỉ', 10.0, TRUE),
(2, 1, 'Vỉ', 'Hộp', 10.0, TRUE);
-- → 1 Hộp = 10 Vỉ = 100 Viên
```

**Impact:** ✅ Flexible unit management, support customer requirements

---

### ✅ SOLUTION 4: Mandatory Expiry Date

**Current Issue:**
```sql
expiry_date DATE NULL  -- ❌ Nullable for tools
```

**Solutions:**

**Option 1: Default Expiry for Tools**
```java
// When creating tool items
if (itemMaster.getIsTool()) {
    // Set expiry = 10 years from now
    LocalDate defaultExpiry = LocalDate.now().plusYears(10);
    batch.setExpiryDate(defaultExpiry);
}
```

**Option 2: Separate Tool Management**
```java
// Validation
@AssertTrue(message = "Expiry date required for non-tool items")
private boolean isExpiryDateValid() {
    return isTool || expiryDate != null;
}
```

**Option 3: Virtual Expiry Category**
```sql
-- Add column
ALTER TABLE item_masters ADD COLUMN expiry_tracking_type VARCHAR(20);
-- Values: 'STANDARD', 'LONG_TERM', 'NO_EXPIRY'

-- Tools = 'NO_EXPIRY' → UI không hiển thị warning
-- Medicine = 'STANDARD' → Cảnh báo 30 ngày
-- Equipment = 'LONG_TERM' → Cảnh báo warranty period
```

**Impact:** ✅ Quản lý HSD đầy đủ, phù hợp từng loại vật tư

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1 (CRITICAL - Must Fix) ⚡
1. **Add `item_code` to transaction items response** (Backend DTO)
   - ⏱️ Estimate: 2 hours
   - 🎯 Impact: HIGH - Fix logistics issue immediately

2. **Add `unit_of_measure` validation** (Frontend + Backend)
   - ⏱️ Estimate: 1 hour
   - 🎯 Impact: MEDIUM - Ensure data quality

### Phase 2 (IMPORTANT - Scalability) 🚀
3. **Create `item_components` table** (Database + Backend)
   - ⏱️ Estimate: 4 hours
   - 🎯 Impact: HIGH - Enable parent-child tracking

4. **Implement component deduction logic** (Backend service)
   - ⏱️ Estimate: 6 hours
   - 🎯 Impact: HIGH - Solve "1 hộp → xuất vỉ" problem

### Phase 3 (ENHANCEMENT - Quality) ✨
5. **Expiry date enforcement** (Validation + UI)
   - ⏱️ Estimate: 2 hours
   - 🎯 Impact: MEDIUM - Better compliance

6. **Frontend UI updates** (Display item_code, units, parent-child)
   - ⏱️ Estimate: 4 hours
   - 🎯 Impact: MEDIUM - Better UX

---

## 📝 ACTION ITEMS

### Backend Team:
- [ ] Add `itemCode` and `unitOfMeasure` fields to `StorageTransactionItemResponse`
- [ ] Create `item_components` table migration
- [ ] Implement `ItemComponent` entity and repository
- [ ] Implement component deduction logic in `StorageTransactionService`
- [ ] Add validation for expiry dates based on `isTool` flag
- [ ] Update Swagger documentation

### Frontend Team:
- [ ] Update `StorageTransactionItem` TypeScript interface
- [ ] Add `item_code` display in transaction detail tables
- [ ] Add unit selector dropdown in Item Master form
- [ ] Create Parent-Child item relationship UI
- [ ] Add validation for required expiry dates
- [ ] Update transaction printing templates to show item codes

### Database Team:
- [ ] Create migration script for `item_components` table
- [ ] Add indexes for performance
- [ ] Backfill missing `unit_of_measure` data
- [ ] Set default expiry dates for existing tool items

---

## ✅ EXPECTED OUTCOMES

After implementing all solutions:

✅ **Item Code Visibility**
- Mọi transaction items đều hiển thị `item_code`
- Nhân viên kho dễ dàng identify vật tư cần bóc

✅ **Parent-Child Tracking**
- Hệ thống tự động trừ item cha khi xuất item con
- VD: Xuất 2 vỉ → Hộp 10 vỉ tự động update còn 8 vỉ

✅ **Flexible Units**
- Khách hàng có thể chọn quản lý theo Hộp, Vỉ, hoặc Viên
- System support conversion giữa các đơn vị

✅ **Complete Expiry Tracking**
- Tất cả items đều có expiry date (hoặc default cho tools)
- Đầy đủ cảnh báo và compliance

---

## 🔗 REFERENCES

- [WAREHOUSE_COMPLETE_API_GUIDE.md](./WAREHOUSE_COMPLETE_API_GUIDE.md)
- [Backend Swagger UI](http://localhost:8080/swagger-ui/index.html)
- [Database Schema Diagram](#) (TBD)

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Pending Implementation 🚧
