# FE Update Required - After BE Issues Resolution

**Date:** 2025-11-28  
**Related:** BE Issues #15, #16, #17 resolved

---

## ✅ Issues Resolved by BE

1. ✅ **Issue #15** - API 6.6 500 error fixed (removed emojis from logs)
2. ✅ **Issue #16** - Approval workflow endpoints implemented
3. ✅ **Issue #17** - Missing fields added to response DTOs

---

## 🔧 FE Updates Required

### 1. **Add Approval Workflow Methods** (`src/services/storageService.ts`)

**Add these methods:**

```typescript
/**
 * POST /api/v1/warehouse/transactions/{id}/approve - Duyệt phiếu
 */
approve: async (id: number, notes?: string): Promise<StorageTransactionV3> => {
  try {
    const response = await api.post<StorageTransactionV3>(
      `${TRANSACTION_BASE}/${id}/approve`,
      notes ? { notes } : undefined
    );
    return mapTransactionDetail(response.data);
  } catch (error: any) {
    console.error('❌ Approve transaction error:', error.response?.data || error.message);
    throw error;
  }
},

/**
 * POST /api/v1/warehouse/transactions/{id}/reject - Từ chối phiếu
 */
reject: async (id: number, rejectionReason: string): Promise<StorageTransactionV3> => {
  try {
    const response = await api.post<StorageTransactionV3>(
      `${TRANSACTION_BASE}/${id}/reject`,
      { rejectionReason }
    );
    return mapTransactionDetail(response.data);
  } catch (error: any) {
    console.error('❌ Reject transaction error:', error.response?.data || error.message);
    throw error;
  }
},

/**
 * POST /api/v1/warehouse/transactions/{id}/cancel - Hủy phiếu
 */
cancel: async (id: number, cancellationReason?: string): Promise<StorageTransactionV3> => {
  try {
    const response = await api.post<StorageTransactionV3>(
      `${TRANSACTION_BASE}/${id}/cancel`,
      cancellationReason ? { cancellationReason } : undefined
    );
    return mapTransactionDetail(response.data);
  } catch (error: any) {
    console.error('❌ Cancel transaction error:', error.response?.data || error.message);
    throw error;
  }
},
```

---

### 2. **Update Types** (`src/types/warehouse.ts`)

**Verify these fields exist in `StorageTransactionV3`:**

```typescript
export interface StorageTransactionV3 {
  // ... existing fields ...
  
  // Approval Info (NEW)
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledBy?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Payment Info (for IMPORT) - NEW
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  paidAmount?: number; // RBAC: requires VIEW_COST
  remainingDebt?: number; // RBAC: requires VIEW_COST
  dueDate?: string;
  
  // Appointment Info (for EXPORT) - NEW
  relatedAppointmentId?: number;
  patientName?: string;
  
  // Status should be enum, not string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}
```

---

### 3. **Update UI Components**

#### **StorageDetailModal.tsx**

**Add approve/reject/cancel buttons:**

```typescript
// Add state
const [isApproving, setIsApproving] = useState(false);
const [isRejecting, setIsRejecting] = useState(false);
const [isCancelling, setIsCancelling] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');

// Add handlers
const handleApprove = async () => {
  if (!transaction) return;
  setIsApproving(true);
  try {
    await storageService.approve(transaction.id);
    toast.success('Đã duyệt phiếu thành công');
    queryClient.invalidateQueries(['transactions']);
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Lỗi khi duyệt phiếu');
  } finally {
    setIsApproving(false);
  }
};

const handleReject = async () => {
  if (!transaction || !rejectionReason.trim()) {
    toast.error('Vui lòng nhập lý do từ chối');
    return;
  }
  setIsRejecting(true);
  try {
    await storageService.reject(transaction.id, rejectionReason);
    toast.success('Đã từ chối phiếu thành công');
    queryClient.invalidateQueries(['transactions']);
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Lỗi khi từ chối phiếu');
  } finally {
    setIsRejecting(false);
  }
};

const handleCancel = async () => {
  if (!transaction) return;
  setIsCancelling(true);
  try {
    await storageService.cancel(transaction.id);
    toast.success('Đã hủy phiếu thành công');
    queryClient.invalidateQueries(['transactions']);
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Lỗi khi hủy phiếu');
  } finally {
    setIsCancelling(false);
  }
};

// Add UI in modal
{transaction?.status === 'PENDING_APPROVAL' && (
  <div className="flex gap-2">
    <Button onClick={handleApprove} disabled={isApproving}>
      {isApproving ? 'Đang duyệt...' : 'Duyệt'}
    </Button>
    <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
      Từ chối
    </Button>
  </div>
)}

{(transaction?.status === 'DRAFT' || transaction?.status === 'PENDING_APPROVAL') && (
  <Button variant="outline" onClick={handleCancel} disabled={isCancelling}>
    {isCancelling ? 'Đang hủy...' : 'Hủy phiếu'}
  </Button>
)}
```

**Display approval info:**

```typescript
{transaction?.approvedByName && (
  <div>
    <span className="text-sm text-gray-500">Người duyệt:</span>
    <span className="ml-2">{transaction.approvedByName}</span>
    {transaction.approvedAt && (
      <span className="ml-2 text-xs text-gray-400">
        ({new Date(transaction.approvedAt).toLocaleString('vi-VN')})
      </span>
    )}
  </div>
)}

{transaction?.rejectionReason && (
  <div>
    <span className="text-sm text-red-500">Lý do từ chối:</span>
    <span className="ml-2">{transaction.rejectionReason}</span>
  </div>
)}
```

**Display payment info (with RBAC):**

```typescript
const hasViewCost = usePermission('VIEW_COST');

{transaction?.type === 'IMPORT' && hasViewCost && (
  <div>
    <span className="text-sm text-gray-500">Trạng thái thanh toán:</span>
    <Badge>{transaction.paymentStatus}</Badge>
    {transaction.paidAmount !== undefined && (
      <div>
        <span>Đã thanh toán: {formatCurrency(transaction.paidAmount)}</span>
        {transaction.remainingDebt !== undefined && (
          <span> | Còn nợ: {formatCurrency(transaction.remainingDebt)}</span>
        )}
      </div>
    )}
    {transaction.dueDate && (
      <div>Hạn thanh toán: {formatDate(transaction.dueDate)}</div>
    )}
  </div>
)}
```

**Display appointment info (for EXPORT):**

```typescript
{transaction?.type === 'EXPORT' && transaction?.relatedAppointmentId && (
  <div>
    <span className="text-sm text-gray-500">Ca điều trị:</span>
    <Link href={`/admin/appointments/${transaction.relatedAppointmentId}`}>
      {transaction.relatedAppointmentCode || `#${transaction.relatedAppointmentId}`}
    </Link>
    {transaction.patientName && (
      <span className="ml-2">- {transaction.patientName}</span>
    )}
  </div>
)}
```

---

### 4. **Update Transaction List** (`src/app/admin/warehouse/storage/page.tsx`)

**Display new fields in table:**

```typescript
// Add columns for approval info
{hasViewCost && (
  <TableHead>Trạng thái thanh toán</TableHead>
)}

// In table body
{hasViewCost && transaction.paymentStatus && (
  <TableCell>
    <Badge>{transaction.paymentStatus}</Badge>
  </TableCell>
)}
```

---

## 🧪 Testing Checklist

- [ ] Test API 6.6 - Should work now (no more 500 error)
- [ ] Test approve endpoint - Verify status changes to APPROVED
- [ ] Test reject endpoint - Verify status changes to REJECTED, reason is saved
- [ ] Test cancel endpoint - Verify status changes to CANCELLED
- [ ] Verify approval info displays correctly
- [ ] Verify payment info displays (with RBAC check)
- [ ] Verify appointment info displays for exports
- [ ] Verify patient name displays for exports

---

## 📝 Notes

1. **Permissions:**
   - Approve/Reject: Requires `APPROVE_TRANSACTION` permission
   - Cancel: Requires `UPDATE_WAREHOUSE` or `CANCEL_WAREHOUSE` permission

2. **Status Validation:**
   - Approve/Reject: Only works when status = `PENDING_APPROVAL`
   - Cancel: Only works when status = `DRAFT` or `PENDING_APPROVAL`

3. **RBAC:**
   - Payment info (`paidAmount`, `remainingDebt`) only visible with `VIEW_COST` permission
   - Use `usePermission('VIEW_COST')` hook to check

---

**Last Updated:** 2025-11-28  
**Status:** ⚠️ **FE Updates Required**



