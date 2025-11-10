# Service Category Implementation Plan

## 📋 Tổng Quan

Service Category module (V17) quản lý nhóm dịch vụ nha khoa để tổ chức menu giá dễ xem hơn. Mỗi category là một nhóm dịch vụ (VD: "A. General Dentistry", "B. Cosmetic & Restoration").

**Mục đích:**
- Tổ chức services theo nhóm/category
- Hỗ trợ drag-drop reorder cho UX tốt hơn
- Soft delete với validation (không xóa category có active services)
- Tích hợp với Service Management module

---

## 🔍 Phân Tích Hiện Trạng

### Dự Án Hiện Tại

#### ✅ Đã Có:
1. **Service Management Module**
   - `src/types/service.ts` - Service types (chưa có categoryId)
   - `src/services/serviceService.ts` - Service API service
   - `src/app/admin/services/page.tsx` - Service management page
   - `src/app/admin/booking/services/page.tsx` - Booking services page
   - Service có `specializationId` nhưng chưa có `categoryId`

2. **Permissions**
   - `VIEW_SERVICE`
   - `CREATE_SERVICE`
   - `UPDATE_SERVICE`
   - `DELETE_SERVICE`

#### ❌ Chưa Có:
1. **Service Category Module**
   - Không có ServiceCategory types
   - Không có ServiceCategory service
   - Không có ServiceCategory management page
   - Service chưa có `categoryId` field

2. **Integration**
   - Service management pages chưa filter theo category
   - Service forms chưa có category selection
   - Appointment creation chưa group services theo category

---

## 📐 Database Schema (BE Reference)

```sql
CREATE TABLE service_categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

**Relationship:**
```
service_categories (1) ----< (N) services
                           (FK: category_id)
```

---

## 🎯 Kế Hoạch Triển Khai

### Phase 1: Types & Service Layer (Priority: 🔴 High)

#### 1.1. Tạo Service Category Types
**File:** `src/types/serviceCategory.ts`

```typescript
export interface ServiceCategory {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceCategoryRequest {
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  description?: string;
}

export interface UpdateServiceCategoryRequest {
  categoryCode?: string;
  categoryName?: string;
  displayOrder?: number;
  description?: string;
  isActive?: boolean;
}

export interface ReorderServiceCategoriesRequest {
  orders: CategoryOrder[];
}

export interface CategoryOrder {
  categoryId: number;
  displayOrder: number;
}

export enum ServiceCategoryErrorCode {
  CATEGORY_CODE_EXISTS = 'CATEGORY_CODE_EXISTS',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_HAS_ACTIVE_SERVICES = 'CATEGORY_HAS_ACTIVE_SERVICES',
  INVALID_REQUEST = 'INVALID_REQUEST'
}
```

#### 1.2. Tạo Service Category Service
**File:** `src/services/serviceCategoryService.ts`

**APIs cần implement:**
- `GET /api/v1/service-categories` - List all categories
- `GET /api/v1/service-categories/{categoryId}` - Get category by ID
- `POST /api/v1/service-categories` - Create category
- `PATCH /api/v1/service-categories/{categoryId}` - Update category
- `DELETE /api/v1/service-categories/{categoryId}` - Soft delete category
- `POST /api/v1/service-categories/reorder` - Reorder categories

**Permissions:**
- `VIEW_SERVICE` - List, Get
- `CREATE_SERVICE` - Create
- `UPDATE_SERVICE` - Update, Reorder
- `DELETE_SERVICE` - Delete

---

### Phase 2: Gộp Service Category vào Service Management Page (Priority: 🔴 High)

#### 2.1. Cập Nhật Service Management Page với Tabs
**File:** `src/app/admin/services/page.tsx`

**Cấu trúc mới:**
- **Tab 1: Services** (existing) - Quản lý services
- **Tab 2: Categories** (new) - Quản lý service categories

**Features cho Tab Categories:**
- ✅ List all categories (table view)
- ✅ Create new category (modal)
- ✅ Update category (modal)
- ✅ Soft delete category (with validation)
- ✅ Reorder categories (drag-drop)
- ✅ Filter by active/inactive
- ✅ Search by name/code
- ✅ Sort by displayOrder, name, code

**UI Components:**
- Tabs component để switch giữa Services và Categories
- Table với columns: Code, Name, Display Order, Description, Status, Actions
- Create/Update modal form
- Delete confirmation dialog
- Drag-drop reorder (sử dụng `@dnd-kit/core` hoặc `react-beautiful-dnd`)
- Filter & Search bar

**Business Rules:**
- Không thể xóa category có active services (show error message)
- Display order: số càng nhỏ hiện trước
- Category code phải unique

---

### Phase 3: Update Service Types & Integration (Priority: 🟡 Medium)

#### 3.1. Cập Nhật Service Types
**File:** `src/types/service.ts`

**Thêm vào Service interface:**
```typescript
export interface Service {
  // ... existing fields
  categoryId?: number;        // NEW
  categoryName?: string;      // NEW
  categoryCode?: string;      // NEW
}
```

**Cập Nhật ServiceFilters:**
```typescript
export interface ServiceFilters {
  // ... existing fields
  categoryId?: string;        // NEW - filter by category
}
```

**Cập Nhật CreateServiceRequest:**
```typescript
export interface CreateServiceRequest {
  // ... existing fields
  categoryId?: number;        // NEW
}
```

**Cập Nhật UpdateServiceRequest:**
```typescript
export interface UpdateServiceRequest {
  // ... existing fields
  categoryId?: number;        // NEW
}
```

#### 3.2. Cập Nhật Service Service
**File:** `src/services/serviceService.ts`

**Thêm categoryId vào filters:**
```typescript
if (filters.categoryId !== undefined && filters.categoryId !== '') {
  params.append('categoryId', String(filters.categoryId));
}
```

#### 3.3. Cập Nhật Service Management Pages

**File:** `src/app/admin/services/page.tsx`
- ✅ Thêm category filter dropdown
- ✅ Hiển thị category name trong service table
- ✅ Thêm category selection trong create/update form

**File:** `src/app/admin/booking/services/page.tsx`
- ✅ Thêm category filter dropdown
- ✅ Hiển thị category name trong service list
- ✅ Group services by category (optional - for better UX)

---

### Phase 4: Appointment Integration (Priority: 🟢 Low)

#### 4.1. Cập Nhật Create Appointment Modal
**File:** `src/components/appointments/CreateAppointmentModal.tsx`

**Features:**
- ✅ Group services by category trong service selection
- ✅ Filter services by category
- ✅ Hiển thị category name trong service list

**UI Enhancement:**
```typescript
// Group services by category
const groupedServices = useMemo(() => {
  const grouped: Record<string, Service[]> = {};
  services.forEach(service => {
    const categoryName = service.categoryName || 'Uncategorized';
    if (!grouped[categoryName]) {
      grouped[categoryName] = [];
    }
    grouped[categoryName].push(service);
  });
  return grouped;
}, [services]);
```

---

### Phase 5: Navigation & Permissions (Priority: 🟡 Medium)

#### 5.1. Kiểm Tra Permissions
- ✅ ProtectedRoute cho Service Management page (đã có)
- ✅ Permission checks cho CRUD operations trong Categories tab
- ✅ Disable buttons nếu không có permission
- ✅ Hide Categories tab nếu không có VIEW_SERVICE permission

---

## 📁 Cấu Trúc Files Cần Tạo

```
src/
├── types/
│   └── serviceCategory.ts                    # NEW
├── services/
│   └── serviceCategoryService.ts              # NEW
├── app/
│   └── admin/
│       └── services/
│           ├── page.tsx                        # UPDATE (add Categories tab)
│           └── [serviceCode]/
│               └── page.tsx                   # UPDATE (add category field)
└── components/
    └── appointments/
        └── CreateAppointmentModal.tsx         # UPDATE (group by category)
```

**Note:** Không tạo page riêng cho categories, mà gộp vào Service Management page dưới dạng tabs.

---

## 🔧 Technical Details

### 1. Drag-Drop Reorder Implementation

**Option 1: @dnd-kit/core** (Recommended)
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Option 2: react-beautiful-dnd**
```bash
npm install react-beautiful-dnd
```

**Implementation:**
- Drag handle icon on each row
- Visual feedback during drag
- Save order on drop
- Optimistic update + rollback on error

### 2. Error Handling

**Error Codes:**
- `409 Conflict` - Category code already exists
- `409 Conflict` - Category has active services (cannot delete)
- `404 Not Found` - Category not found
- `400 Bad Request` - Validation failed

**Error Messages:**
```typescript
if (error.response?.status === 409) {
  if (error.response?.data?.errorCode === 'CATEGORY_HAS_ACTIVE_SERVICES') {
    toast.error('Không thể xóa category này vì còn dịch vụ đang active');
  } else {
    toast.error('Category code đã tồn tại');
  }
}
```

### 3. Validation Rules

**Create/Update:**
- `categoryCode`: Required, max 50 chars, unique
- `categoryName`: Required, max 255 chars
- `displayOrder`: Required, min 0
- `description`: Optional, max 1000 chars

**Delete:**
- Check if category has active services
- Show error if has active services
- Soft delete (set isActive=false)

---

## 📊 UI/UX Design

### Service Management Page với Tabs

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Service Management                    [+ New]  │
├─────────────────────────────────────────────────┤
│  [Services]  [Categories]  ← Tabs              │
├─────────────────────────────────────────────────┤
│  [Search...]  [Filter: All/Active/Inactive]    │
├─────────────────────────────────────────────────┤
│  Code  │ Name          │ Order │ Status │ Actions│
├─────────────────────────────────────────────────┤
│  GEN   │ General...    │   0   │ Active │ [Edit]│
│  COS   │ Cosmetic...   │   1   │ Active │ [Edit]│
│  ORTH  │ Orthodontics  │   2   │ Active │ [Edit]│
└─────────────────────────────────────────────────┘
```

**Tab Structure:**
- **Tab 1: Services** - Existing service management
- **Tab 2: Categories** - Service category management

**Create/Update Modal:**
```
┌─────────────────────────────────────┐
│  Create Service Category        [X]  │
├─────────────────────────────────────┤
│  Category Code *                    │
│  [GEN________________]               │
│                                      │
│  Category Name *                    │
│  [General Dentistry________]        │
│                                      │
│  Display Order *                    │
│  [0________________]                 │
│                                      │
│  Description                         │
│  [________________________]         │
│  [________________________]         │
│                                      │
│              [Cancel]  [Create]     │
└─────────────────────────────────────┘
```

**Reorder UI:**
- Drag handle icon (⋮⋮) on left side of each row
- Highlight row during drag
- Show new order numbers after drop
- Save button appears after reorder

---

## ✅ Testing Checklist

### Unit Tests
- [ ] ServiceCategoryService - all API methods
- [ ] ServiceCategory types validation
- [ ] Error handling

### Integration Tests
- [ ] Create category
- [ ] Update category
- [ ] Delete category (with/without active services)
- [ ] Reorder categories
- [ ] Filter services by category
- [ ] Create service with category

### UI Tests
- [ ] Service Category management page loads
- [ ] Create category form validation
- [ ] Update category form
- [ ] Delete category confirmation
- [ ] Drag-drop reorder works
- [ ] Filter & search works

---

## 🚀 Implementation Order

1. **Phase 1** - Types & Service Layer (1-2 days)
   - Create types
   - Create service
   - Test API integration

2. **Phase 2** - Gộp Service Category vào Service Management Page (2-3 days)
   - Refactor Service Management page với Tabs
   - Implement Categories tab với CRUD operations
   - Implement drag-drop reorder
   - Keep existing Services tab intact

3. **Phase 3** - Service Integration (1-2 days)
   - Update Service types (thêm categoryId)
   - Update Service service (thêm category filter)
   - Update Services tab (thêm category filter & field)

4. **Phase 4** - Appointment Integration (1 day)
   - Update Create Appointment Modal
   - Group services by category

5. **Phase 5** - Navigation & Polish (0.5 day)
   - Test permissions (không cần thêm nav item vì đã gộp)
   - Final UI polish

**Total Estimated Time:** 5-8 days

---

## 📝 Notes

1. **Backend Compatibility:**
   - Ensure backend API endpoints match the documentation
   - Test all endpoints before implementation
   - Handle both success and error responses

2. **Migration:**
   - Existing services may not have categoryId
   - Handle null/undefined categoryId gracefully
   - Show "Uncategorized" for services without category

3. **Performance:**
   - Use pagination for large category lists
   - Debounce search input
   - Optimize reorder API calls (batch update)

4. **Accessibility:**
   - Keyboard navigation for drag-drop
   - ARIA labels for screen readers
   - Focus management in modals

---

## 🔗 Related Files

- `files_from_BE/service-category/ServiceCategory.md` - API Documentation
- `files_from_BE/service-category/service/` - BE Code Reference
- `src/types/service.ts` - Service Types (to be updated)
- `src/services/serviceService.ts` - Service Service (to be updated)
- `src/app/admin/services/page.tsx` - Service Management (to be updated)

---

**Last Updated:** 2025-01-XX  
**Status:** 📋 Planning Phase

