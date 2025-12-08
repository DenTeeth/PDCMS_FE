# Issue #49: Update Prices Trigger Status Change

**Date:** 2025-12-09  
**Priority:** HIGH  
**Status:** 🔴 **OPEN**

---

## 📋 Problem Description

Khi update giá tiền (API 5.13) và lưu, treatment plan status bị thay đổi mặc dù không có item status update. Điều này không đúng với logic hiện tại:

- **Expected:** Update prices chỉ nên update prices, không thay đổi status
- **Actual:** Update prices → Status thay đổi (có thể từ null → COMPLETED)

---

## 🔍 Root Cause Analysis

### API 5.13: Update Prices

**File:** `files_from_BE/treatment_plans/service/TreatmentPlanPricingService.java`

**Method:** `updatePlanPrices()` (line 62-130)

**Current Flow:**
1. Load plan từ DB
2. Update item prices
3. **Recalculate total cost** (line 98) ← **VẤN ĐỀ Ở ĐÂY**
4. Save plan

### Vấn Đề: Lazy Loading trong `recalculateTotalCost()`

**File:** `TreatmentPlanPricingService.java` (line 218-232)

```java
private BigDecimal recalculateTotalCost(PatientTreatmentPlan plan) {
    BigDecimal total = BigDecimal.ZERO;

    for (var phase : plan.getPhases()) {  // ← LAZY LOAD phases
        for (var item : phase.getItems()) {  // ← LAZY LOAD items
            if (item.getPrice() != null) {
                total = total.add(item.getPrice());
            }
        }
    }

    return total;
}
```

**Vấn đề:**
- Khi gọi `plan.getPhases()`, JPA lazy load phases từ DB
- Khi gọi `phase.getItems()`, JPA lazy load items từ DB
- **NHƯNG:** Code này KHÔNG gọi `checkAndCompletePlan()` hoặc `checkAndCompletePhase()`

### Tại Sao Status Lại Thay Đổi?

Có 3 khả năng:

#### 1. Database Trigger (Most Likely)

Có thể có database trigger tự động check completion khi plan được update:

```sql
CREATE TRIGGER check_plan_completion
AFTER UPDATE ON patient_treatment_plans
FOR EACH ROW
WHEN (NEW.status IS NULL OR NEW.status != 'COMPLETED')
BEGIN
    -- Check if all phases completed
    -- If yes, set status = 'COMPLETED'
END;
```

**Cần verify:** Check database schema có trigger không.

#### 2. JPA Entity Listener (Unlikely)

**File:** `PatientTreatmentPlan.java` (line 166-174)

```java
@PrePersist
protected void onCreate() {
    // Only runs on INSERT, not UPDATE
}
```

**Kết luận:** Không có `@PreUpdate` hoặc `@PostUpdate` → Không phải entity listener.

#### 3. Logic Khác Được Gọi Khi Save (Need Investigation)

Có thể có:
- Repository custom method
- Service interceptor
- AOP aspect

**Cần verify:** Check xem có custom repository methods hoặc interceptors không.

---

## 🎯 Expected Behavior

**Logic đúng:**
- Update prices → Chỉ update prices và recalculate costs
- **KHÔNG** check completion
- **KHÔNG** thay đổi status

**Logic auto-complete chỉ nên chạy khi:**
- Item status được update (API 5.6)
- Appointment completed (AppointmentStatusService)

---

## 💡 Suggested Fix

### Option 1: Fix Lazy Loading Issue (Recommended)

**File:** `TreatmentPlanPricingService.java` (line 218-232)

**Change:**
```java
private BigDecimal recalculateTotalCost(PatientTreatmentPlan plan) {
    BigDecimal total = BigDecimal.ZERO;

    // FIX: Query items directly from DB instead of lazy loading
    // This avoids triggering any potential completion checks
    List<PatientPlanItem> allItems = itemRepository.findByTreatmentPlan_PlanId(plan.getPlanId());
    
    for (PatientPlanItem item : allItems) {
        if (item.getPrice() != null) {
            total = total.add(item.getPrice());
        }
    }

    log.debug("Recalculated total cost: {} VND", total);
    return total;
}
```

**Lợi ích:**
- Tránh lazy loading phases/items
- Tránh trigger bất kỳ logic nào liên quan đến completion check
- Performance tốt hơn (direct query)

### Option 2: Disable Auto-Complete Check (If Database Trigger)

Nếu có database trigger, cần:
1. **Verify trigger exists:** Check database schema
2. **Disable trigger for price updates:** Add condition để skip trigger khi chỉ update prices
3. **Or remove trigger:** Nếu không cần thiết

### Option 3: Add Guard in Pricing Service

**File:** `TreatmentPlanPricingService.java` (line 109)

**Add after save:**
```java
// 9. Save plan with updated costs
planRepository.save(plan);

// 9.5. GUARD: Ensure status was not changed by any triggers/listeners
// Reload plan to check if status was modified
planRepository.refresh(plan);
if (plan.getStatus() != originalStatus) {
    log.warn("Plan status was changed during price update! Original: {}, Current: {}. Reverting...", 
            originalStatus, plan.getStatus());
    plan.setStatus(originalStatus);
    planRepository.save(plan);
}
```

---

## 🔗 Related Issues

- **Issue #40:** Phase và Plan không auto-complete do lazy loading (✅ RESOLVED)
- **Issue #47:** Existing plans với all phases completed nhưng status vẫn null (✅ RESOLVED)
- **Issue #48:** AppointmentStatusService không check completion nếu plan status = null (🔴 OPEN)

---

## 📝 Next Steps

1. ✅ **Log issue** (this document)
2. ⏳ **Verify database triggers** - Check xem có trigger nào check completion không
3. ⏳ **Fix lazy loading** - Update `recalculateTotalCost()` để query trực tiếp từ DB
4. ⏳ **Test** - Verify update prices không thay đổi status
5. ⏳ **Update documentation** - Document behavior

---

## 🧪 Test Cases

**Test 1: Update prices cho plan với all phases completed**
- **Setup:** Plan có status = null, all phases = COMPLETED
- **Action:** Update prices via API 5.13
- **Expected:** Prices updated, status vẫn = null (KHÔNG thay đổi)
- **Actual:** ❓ Status có thay đổi không?

**Test 2: Update prices cho plan với phases chưa completed**
- **Setup:** Plan có status = IN_PROGRESS, một số phases chưa completed
- **Action:** Update prices via API 5.13
- **Expected:** Prices updated, status vẫn = IN_PROGRESS (KHÔNG thay đổi)
- **Actual:** ❓ Status có thay đổi không?

---

**Note:** Cần verify với BE team xem có database trigger hoặc logic nào khác trigger auto-complete khi save plan.


