# 🚀 QUICK START - Testing Warehouse APIs

## 🔧 Prerequisites

1. **Backend API Running**

   ```bash
   # Check backend is running
   curl http://localhost:8080/api/v1/health
   ```

2. **Login to get Bearer Token**

   ```bash
   # Login and save token
   curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password123"}'
   ```

3. **Start Frontend**
   ```bash
   cd d:\PDCMS_FE
   npm run dev
   ```

---

## 📋 Testing Steps

### 1️⃣ Test Inventory Management

**Access Page:**

```
http://localhost:3000/admin/warehouse/inventory
```

**Features to Test:**

1. ✅ View inventory list with stats
2. ✅ Search by item name/code
3. ✅ Filter tabs (ALL, COLD, NORMAL, LOW_STOCK, EXPIRING_SOON)
4. ✅ Click "Thêm vật tư" → Fill form → Create
5. ✅ Click Edit icon → Update item
6. ✅ Click Eye icon → View details with batches
7. ✅ Click Delete → Confirm → Delete

**API Calls to Monitor (DevTools Network Tab):**

```
GET /api/v1/inventory/stats
GET /api/v1/inventory/summary?page=0&size=10
GET /api/v1/inventory/categories
GET /api/v1/inventory/batches/{id}
POST /api/v1/inventory/item-master
PUT /api/v1/inventory/item-master/{id}
DELETE /api/v1/inventory/item-master/{id}
```

---

### 2️⃣ Test Supplier Management

**Access Page:**

```
http://localhost:3000/admin/warehouse/suppliers
```

**Features to Test:**

1. ✅ View suppliers list (paginated)
2. ✅ Search by name/code/phone/email (debounced)
3. ✅ Navigate pages (Previous/Next buttons)
4. ✅ Sort by clicking table headers
5. ✅ Click "Thêm nhà cung cấp" → Fill form → Create
6. ✅ Click Edit icon → Update supplier
7. ✅ Click Eye icon → View details + supplied items history
8. ✅ Click Delete → Confirm → Delete

**API Calls to Monitor:**

```
GET /api/v1/suppliers?page=0&size=10&sort=supplierName,asc
GET /api/v1/suppliers/{id}
GET /api/v1/suppliers/{id}/supplied-items
POST /api/v1/suppliers
PUT /api/v1/suppliers/{id}
DELETE /api/v1/suppliers/{id}
```

---

### 3️⃣ Test Storage In/Out

**Access Page:**

```
http://localhost:3000/admin/warehouse/storage-in-out
```

**Features to Test:**

1. ✅ View transactions list with monthly stats
2. ✅ Filter tabs (ALL, IMPORT, EXPORT, ADJUSTMENT, LOSS)
3. ✅ Search transactions (debounced)
4. ✅ Click "Nhập kho" → Select supplier → Add items → Create import
5. ✅ Click "Xuất kho" → Select batches (FEFO) → Create export
6. ✅ Click Eye icon → View transaction details
7. ✅ Click Edit icon → Update notes
8. ✅ Click Delete → Confirm → Delete

**API Calls to Monitor:**

```
GET /api/v1/storage/stats
GET /api/v1/storage?transactionType=IMPORT
POST /api/v1/storage/import
POST /api/v1/storage/export
GET /api/v1/storage/{id}
PUT /api/v1/storage/{id}?notes=Updated
DELETE /api/v1/storage/{id}
```

---

## 🔍 Debug Tools

### 1. React Query DevTools

Already installed! Open browser and look for floating React Query icon (bottom-left).

**Features:**

- View all active queries
- See cached data
- Manually trigger refetch
- Check query status (loading/success/error)

### 2. Browser DevTools

**Network Tab:**

```
Filter: XHR
Look for: /api/v1/inventory, /api/v1/suppliers, /api/v1/storage
Check: Request Headers (Authorization: Bearer ...)
```

**Console Tab:**

```javascript
// All API calls log:
✅ Get inventory summary: {...}
❌ Create item error: {...}
```

**React DevTools:**

```
Components → Select page component
Props → View query data
Hooks → See React Query state
```

---

## 🐛 Common Issues

### Issue 1: "401 Unauthorized"

**Solution:**

```tsx
// Check token exists in localStorage
localStorage.getItem("accessToken");

// If missing, login again
window.location.href = "/login";
```

### Issue 2: "Network Error"

**Solution:**

```bash
# Check backend is running
curl http://localhost:8080/api/v1/health

# Check CORS headers
# Backend should allow: http://localhost:3000
```

### Issue 3: "Invalid response from API"

**Solution:**

```tsx
// Check service response handling
// Services expect: response.data or response.data.data
console.log("API Response:", response.data);
```

### Issue 4: Pagination not working

**Solution:**

```tsx
// Supplier pagination: Server-side (useSuppliers hook)
// Inventory pagination: Client-side (manual slicing)
// Storage pagination: Client-side (manual slicing)

// Check totalPages calculation:
const totalPages = Math.ceil(allData.length / size);
```

---

## ✅ Success Criteria

### Inventory Page

- [ ] Stats cards show correct numbers
- [ ] Search filters list correctly
- [ ] Can create new item with categories
- [ ] Can edit existing item
- [ ] Can view item details with batches (FEFO order)
- [ ] Can delete item (with confirmation)
- [ ] Toast notifications appear on success/error

### Suppliers Page

- [ ] Pagination works (page numbers, next/prev)
- [ ] Search debounce works (500ms delay)
- [ ] Can create new supplier
- [ ] Can edit supplier details
- [ ] Can view supplier with supplied items history
- [ ] Can delete supplier
- [ ] Status badge shows ACTIVE/INACTIVE correctly

### Storage In/Out Page

- [ ] Monthly stats show import/export values
- [ ] Growth percentages calculated correctly
- [ ] Can create import transaction (select supplier + items)
- [ ] Can create export transaction (FEFO batch selection)
- [ ] Can view transaction details with all items
- [ ] Can update transaction notes
- [ ] Can delete transaction
- [ ] Transaction type badges (IMPORT=green, EXPORT=blue)

---

## 📊 Test Data

### Sample Inventory Item

```json
{
  "itemCode": "MED-001",
  "itemName": "Paracetamol 500mg",
  "categoryId": 1,
  "unitOfMeasure": "Box",
  "warehouseType": "NORMAL",
  "minStockLevel": 100,
  "maxStockLevel": 1000,
  "isTool": false,
  "notes": "Pain relief medication"
}
```

### Sample Supplier

```json
{
  "supplierCode": "SUP-001",
  "supplierName": "Công ty TNHH Dược phẩm ABC",
  "address": "123 Nguyễn Văn Linh, Q7, TP.HCM",
  "phoneNumber": "0901234567",
  "email": "contact@abc-pharma.com",
  "notes": "Nhà cung cấp chính"
}
```

### Sample Import Transaction

```json
{
  "supplierId": 1,
  "transactionDate": "2025-11-23T10:00:00",
  "notes": "Nhập kho tháng 11",
  "items": [
    {
      "itemMasterId": 1,
      "lotNumber": "LOT-20251123-001",
      "quantity": 500,
      "importPrice": 15000,
      "expiryDate": "2026-11-23"
    }
  ]
}
```

---

## 🎯 Next Actions

1. ✅ Test all 3 pages with real data
2. ✅ Verify pagination works correctly
3. ✅ Check all modals open/close properly
4. ✅ Test form validations
5. ✅ Verify toast notifications appear
6. ✅ Check loading states (skeletons/spinners)
7. ✅ Test error handling (network errors, validation errors)
8. ✅ Verify data refreshes after mutations

---

**Happy Testing!** 🚀
