# 📦 Warehouse API Documentation Index

**Last Updated:** November 27, 2025  
**Total APIs:** 8 Primary Endpoints + CRUD Operations

---

## 📚 Documentation Structure

### Naming Convention:
- **`API_X.Y_FEATURE_NAME_COMPLETE.md`** - Đặc tả API đầy đủ
- **`API_X.Y_FEATURE_NAME_TESTING_GUIDE.md`** - Hướng dẫn test
- **`API_X.Y_FEATURE_NAME_IMPLEMENTATION_SUMMARY.md`** - Tóm tắt implementation

---

## 🗂️ API Documentation Files

### API 6.1 - Inventory Summary
📄 **Specification:**
- `API_6.1_INVENTORY_SUMMARY_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.1_TESTING_GUIDE.md` - Hướng dẫn test

**Endpoint:** `GET /api/v1/warehouse/summary`  
**Purpose:** Báo cáo tổng hợp tồn kho với filters và stock status

---

### API 6.2 - Item Batches Detail
📄 **Specification:**
- `API_6.2_ITEM_BATCHES_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.2_TESTING_GUIDE.md` - Hướng dẫn test

**Endpoint:** `GET /api/v1/warehouse/batches/{itemMasterId}`  
**Purpose:** Xem chi tiết các lô hàng của 1 vật tư (FEFO sorting)

---

### API 6.3 - Expiring Alerts
📄 **Specification:**
- `API_6.3_EXPIRING_ALERTS_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.3_TESTING_GUIDE.md` - Hướng dẫn test

**Endpoint:** `GET /api/v1/warehouse/alerts/expiring`  
**Purpose:** Cảnh báo lô hàng sắp hết hạn

---

### API 6.4 - Import Transaction (Create)
📄 **Specification:**
- `API_6.4_IMPORT_TRANSACTION_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.4_IMPORT_TRANSACTION_TEST_GUIDE.md` - Hướng dẫn test

**Endpoint:** `POST /api/v1/warehouse/import`  
**Purpose:** Tạo phiếu nhập kho từ nhà cung cấp

---

### API 6.5 - Export Transaction (Create)
📄 **Specification:**
- ⚠️ Documentation pending (API implemented)

**Endpoint:** `POST /api/v1/inventory/export`  
**Purpose:** Tạo phiếu xuất kho với FEFO và auto-unpacking

---

### API 6.6 - Transaction History (List)
📄 **Specification:**
- `API_6.6_TRANSACTION_HISTORY_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.6_TRANSACTION_HISTORY_TESTING_GUIDE.md` - Hướng dẫn test
- `API_6.6_TRANSACTION_HISTORY_IMPLEMENTATION_SUMMARY.md` - Implementation summary

**Endpoint:** `GET /api/v1/warehouse/transactions`  
**Purpose:** Danh sách lịch sử giao dịch với filters và pagination

---

### API 6.7 - Transaction Detail (View) ✨ NEW
📄 **Specification:**
- `API_6.7_TRANSACTION_DETAIL_COMPLETE.md` - Đặc tả đầy đủ
- `API_6.7_TRANSACTION_DETAIL_TESTING_GUIDE.md` - Hướng dẫn test
- `API_6.7_TRANSACTION_DETAIL_IMPLEMENTATION_SUMMARY.md` - Implementation summary

**Endpoint:** `GET /api/v1/warehouse/transactions/{id}`  
**Purpose:** Xem chi tiết đầy đủ của một phiếu Nhập/Xuất kho

**Key Features:**
- ✅ Hiển thị full item details với batch info
- ✅ Unpacking information (nếu có)
- ✅ RBAC data masking (VIEW_COST permission)
- ✅ Support cả IMPORT và EXPORT transactions

---

### API 6.8 - Item Masters (List)
📄 **Specification:**
- `API_6.8_ITEM_MASTERS_COMPLETE.md` - Đặc tả đầy đủ

**Endpoint:** `GET /api/v1/warehouse/items`  
**Purpose:** Danh sách vật tư với filters và denormalized cache

**Note:** Đã đổi số từ API 6.7 → 6.8 (Nov 27, 2025)

---

## 🔗 Related Documentation

### General:
- `COMPLETE_API_INVENTORY.md` - Tổng hợp tất cả APIs trong module warehouse
- `LEGACY_CODE_CLEANUP_SUMMARY.md` - Lịch sử cleanup legacy code

---

## 📋 Quick Reference Table

| API | Endpoint | Method | Purpose | Docs |
|-----|----------|--------|---------|------|
| 6.1 | `/warehouse/summary` | GET | Inventory summary | ✅ Complete |
| 6.2 | `/warehouse/batches/{id}` | GET | Batch details | ✅ Complete |
| 6.3 | `/warehouse/alerts/expiring` | GET | Expiring alerts | ✅ Complete |
| 6.4 | `/warehouse/import` | POST | Create import | ✅ Complete |
| 6.5 | `/inventory/export` | POST | Create export | ⚠️ Pending |
| 6.6 | `/warehouse/transactions` | GET | Transaction list | ✅ Complete |
| 6.7 | `/warehouse/transactions/{id}` | GET | Transaction detail | ✅ Complete |
| 6.8 | `/warehouse/items` | GET | Item masters list | ✅ Complete |

---

## 🎯 For Developers

### Reading Order (Recommended):
1. **Start:** `COMPLETE_API_INVENTORY.md` - Overview tất cả APIs
2. **Core APIs:** 
   - API 6.4 (Import) → API 6.5 (Export)
   - API 6.1 (Summary) → API 6.2 (Batches)
3. **Transaction Flow:**
   - API 6.6 (List) → API 6.7 (Detail)
4. **Supporting:** API 6.3 (Alerts), API 6.8 (Items)

### For QA Testing:
1. Read `*_TESTING_GUIDE.md` files in order
2. Setup test data using API 6.4 and 6.5
3. Verify with API 6.1, 6.2, 6.6, 6.7

### For Frontend:
1. Read `*_COMPLETE.md` for request/response schemas
2. Check RBAC requirements in each API
3. Implement list→detail flow: API 6.6 → API 6.7

---

## 📝 Documentation Standards

### File Types:
- **COMPLETE.md** - Full API specification (request, response, errors, examples)
- **TESTING_GUIDE.md** - Test cases, scenarios, expected results
- **IMPLEMENTATION_SUMMARY.md** - Technical details, code changes, deployment info

### Content Requirements:
- ✅ Request/Response examples
- ✅ Authorization & RBAC details
- ✅ Error handling
- ✅ Use cases & business logic
- ✅ Frontend integration examples
- ✅ Performance considerations

---

## 🔄 Version History

### November 27, 2025
- ✅ Added API 6.7 (Transaction Detail)
- ✅ Renumbered API 6.7 → 6.8 (Item Masters)
- ✅ Standardized file naming convention
- ✅ Created this README index

### November 26, 2025
- ✅ Added API 6.6 documentation
- ✅ Legacy code cleanup

### Earlier
- ✅ APIs 6.1 - 6.4 documentation completed

---

## 📞 Contact

**Questions?** Contact Backend Team  
**Issues?** Create ticket in JIRA  
**Updates?** Check Git commit history

---

**Last Reviewed:** November 27, 2025  
**Next Review:** December 1, 2025
