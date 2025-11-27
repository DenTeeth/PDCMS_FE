# BE Open Issues (2025-01-27)

> ⚠️ Only **open** issues remain below. All resolved warehouse issues (#1‒#14) have been removed as requested.

---

## 📊 Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 15 | Warehouse `GET /api/v1/storage` returns 500 | 🔴 Open | Critical | BE | ~1h |

---

## #15 – Warehouse `GET /api/v1/storage` returns 500

**Status:** 🔴 **OPEN** • **Priority:** Critical  
**Endpoint:** `GET /api/v1/storage`  
**Files (suspected):** `warehouse/controller/StorageInOutController.java`, `warehouse/service/StorageInOutService.java`, `warehouse/repository/StorageTransactionRepository.java`  
**Last Checked:** 2025-01-27 (Next.js console log & screenshot)

### ❌ Problem Statement
- Warehouse list API now responds with HTTP 500 on every request, even with default params.
- Regression occurred immediately after BE reported all warehouse issues resolved, so likely tied to recent mapper/service refactor.
- Because this endpoint powers `/admin/warehouse/storage`, users cannot view, filter, or open transactions; all downstream workflows are blocked.

### 🔎 Evidence
- FE console log: `❌ Get all transactions error: Request failed with status code 500` (`src/services/storageService.ts:67`).
- Stack trace shows Axios rejects before FE processes payload (screenshot shared earlier).
- Network tab confirms `GET /api/v1/storage` → 500 with empty body; request params were `{}` (React Query default).

### 🧪 Reproduction Steps
1. Login with warehouse permissions (admin account).  
2. Navigate to `/admin/warehouse/storage`.  
3. Observe toast + console error; transactions table remains empty because request fails with 500.

### 🚨 Impact
- **Critical blocker**: Warehouse operators cannot list/manage any import/export transactions.
- QA cannot verify the all issues resolved build because the first API already fails.
- Reports tab (which reuses this endpoint) also fails, so analytics are unavailable.

### ✅ Expected Behavior
- Endpoint should return `200 OK` with `List<TransactionResponse>` (even if empty).
- Must gracefully handle missing filters instead of throwing server errors.

### 🛠 Suggested Investigation
1. Inspect BE logs for the stack trace triggered by `/api/v1/storage`; likely originates inside `StorageInOutService.getAllTransactions`.
2. Ensure the new mapper/helper guards against null `supplier`, `createdBy`, or `item` references (possible NPE).
3. Verify latest warehouse DB migrations (new columns like `unit_name`, `item_master_id`) are applied to the environment returning 500.
4. Add temporary controller/service logging to capture request params and exception details to speed up debugging.

### ✅ Definition of Done
- `GET /api/v1/storage` reliably returns 200 with valid list payload.
- Warehouse list UI loads again so users can open transaction detail modal.
- Regression checks: import/export creation, detail view, and reports continue to work after the fix.
