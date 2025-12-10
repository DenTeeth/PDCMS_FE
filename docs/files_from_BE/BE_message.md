## Patient Booking Block Fields - API Changes Summary

### What Changed

The Patient entity was **refactored to consolidate confusing redundant fields** (`is_blacklisted` vs `is_booking_blocked`) into a unified booking restriction system.

### Old Structure (REMOVED)
```json
{
  "isBlacklisted": true,
  "blacklistReason": "Có hành vi bạo lực với nhân viên",
  "blacklistNotes": "Additional details...",
  "blacklistedBy": "admin123",
  "blacklistedAt": "2025-12-10T10:30:00",
  "isBookingBlocked": true,
  "bookingBlockReason": "Bị chặn do bỏ hẹn..."
}
```

### New Structure (CURRENT)
```json
{
  "isActive": true,
  "isBookingBlocked": true,
  "bookingBlockReason": "EXCESSIVE_NO_SHOWS",
  "bookingBlockNotes": "Bị chặn do bỏ hẹn 3 lần liên tiếp...",
  "blockedBy": "system",
  "blockedAt": "2025-12-10T10:30:00",
  "consecutiveNoShows": 3
}
```

### Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `isBlacklisted` | ❌ **REMOVED** | Use `bookingBlockReason` to determine if blacklisted |
| `blacklistReason` | ❌ **REMOVED** | Merged into `bookingBlockReason` enum |
| `blacklistNotes` | `bookingBlockNotes` | Renamed (same purpose) |
| `blacklistedBy` | `blockedBy` | Renamed (same purpose) |
| `blacklistedAt` | `blockedAt` | Renamed (same purpose) |
| `isBookingBlocked` | `isBookingBlocked` | ✅ **KEPT** - unified flag for ALL restrictions |
| `bookingBlockReason` | `bookingBlockReason` | ✅ Changed from free text to **ENUM** |

### BookingBlockReason Enum Values

#### Temporary Block (Can be auto-unblocked)
- `EXCESSIVE_NO_SHOWS` - Patient no-showed 3+ times (BR-005)

#### Permanent Blacklist (Requires manager approval to unblock)
- `EXCESSIVE_CANCELLATIONS` - Canceled 3+ appointments within 30 days (BR-043)
- `STAFF_ABUSE` - Verbal/physical abuse toward staff (BR-044)
- `DEBT_DEFAULT` - Unpaid treatment costs
- `FRIVOLOUS_LAWSUIT` - Filed baseless legal claims
- `PROPERTY_DAMAGE` - Damaged clinic property
- `INTOXICATION` - Arrived intoxicated
- `DISRUPTIVE_BEHAVIOR` - Disturbed other patients/operations
- `POLICY_VIOLATION` - Violated clinic policies
- `OTHER_SERIOUS` - Other serious violations

### Frontend Logic

#### Check if Patient is Blocked
```javascript
// OLD WAY (no longer works)
if (patient.isBlacklisted || patient.isBookingBlocked) {
  // blocked
}

// NEW WAY
if (patient.isBookingBlocked) {
  // Patient is blocked (could be temporary OR permanent)
}
```

#### Check if Patient is Permanently Blacklisted
```javascript
const BLACKLIST_REASONS = [
  'EXCESSIVE_CANCELLATIONS',
  'STAFF_ABUSE',
  'DEBT_DEFAULT',
  'FRIVOLOUS_LAWSUIT',
  'PROPERTY_DAMAGE',
  'INTOXICATION',
  'DISRUPTIVE_BEHAVIOR',
  'POLICY_VIOLATION',
  'OTHER_SERIOUS'
];

if (patient.isBookingBlocked && 
    BLACKLIST_REASONS.includes(patient.bookingBlockReason)) {
  // Permanently blacklisted - requires manager to unblock
  showBlacklistWarning(patient.bookingBlockNotes);
}
```
#### Check if Temporarily Blocked (No-Shows)
```javascript
if (patient.isBookingBlocked && 
    patient.bookingBlockReason === 'EXCESSIVE_NO_SHOWS') {
  // Temporary block - can be auto-unblocked when patient shows up
  showNoShowWarning(patient.consecutiveNoShows);
}
```

### Display Logic

```javascript
function getBlockStatusDisplay(patient) {
  if (!patient.isBookingBlocked) {
    return { status: 'active', color: 'green', message: 'Có thể đặt hẹn' };
  }

  const reasonLabels = {
    'EXCESSIVE_NO_SHOWS': 'Bỏ hẹn quá nhiều',
    'EXCESSIVE_CANCELLATIONS': 'Hủy hẹn quá nhiều',
    'STAFF_ABUSE': 'Bạo lực với nhân viên',
    'DEBT_DEFAULT': 'Nợ chi phí điều trị',
    'FRIVOLOUS_LAWSUIT': 'Kiện tụng vô căn cứ',
    'PROPERTY_DAMAGE': 'Phá hoại tài sản',
    'INTOXICATION': 'Say xỉn',
    'DISRUPTIVE_BEHAVIOR': 'Gây rối',
    'POLICY_VIOLATION': 'Vi phạm quy định',
    'OTHER_SERIOUS': 'Vi phạm nghiêm trọng khác'
  };

  const isTemporary = patient.bookingBlockReason === 'EXCESSIVE_NO_SHOWS';
  
  return {
    status: isTemporary ? 'temporarily_blocked' : 'blacklisted',
    color: isTemporary ? 'orange' : 'red',
    message: reasonLabels[patient.bookingBlockReason] || 'Bị chặn',
    details: patient.bookingBlockNotes,
    blockedBy: patient.blockedBy,
    blockedAt: patient.blockedAt,
    canAutoUnblock: isTemporary
  };
}
```

### API Endpoints Affected

All endpoints returning patient data now use the new structure:
- `GET /api/patients/{id}` - Patient detail
- `GET /api/patients` - Patient list
- `GET /api/appointments/{id}` - Appointment detail (includes patient summary)
- `GET /api/appointments` - Appointment list (includes patient summary)
- `GET /api/treatment-plans` - Treatment plan list (includes patient summary)
- `POST /api/patients/blacklist` - Still works (uses old enum externally, maps internally)
- `DELETE /api/patients/blacklist/{id}` - Still works

### Migration Notes

**No frontend code will break** - the API still returns all necessary data, just in a cleaner structure. However, you should:

1. ✅ **Update UI checks** - Use `isBookingBlocked` instead of checking both `isBlacklisted` and `isBookingBlocked`
2. ✅ **Display enum values** - Map `bookingBlockReason` enum to Vietnamese labels
3. ✅ **Rename labels** - Change "Blacklisted By" → "Blocked By", "Blacklisted At" → "Blocked At"
4. ✅ **Add visual distinction** - Show temporary blocks (orange) vs permanent blacklist (red)

### Testing Checklist

- [ ] Patient detail page displays `bookingBlockReason` correctly
- [ ] Appointment booking prevents blocked patients from booking
- [ ] Block status shows appropriate color (orange for no-shows, red for blacklist)
- [ ] "Blocked by" and "Blocked at" fields display correctly
- [ ] Blacklist management still works for managers



DTO Patient update
## Patient API Response Changes - FE Integration Guide

### 🔄 Updated: GET Patient Detail Response

**Endpoint**: `GET /api/v1/patients/{patientCode}`

**What Changed**: Added 2 missing fields to match database schema

#### Old Response (Missing Fields)
```json
{
  "patientId": 1,
  "patientCode": "BN-1001",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "isBookingBlocked": true,
  "bookingBlockReason": "STAFF_ABUSE",
  "blockedAt": "2025-12-10 10:30:00"
}
```

#### New Response (Complete)
```json
{
  "patientId": 1,
  "patientCode": "BN-1001",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "isBookingBlocked": true,
  "bookingBlockReason": "STAFF_ABUSE",
  "bookingBlockNotes": "Có hành vi bạo lực với nhân viên tiếp tân",
  "blockedBy": "admin",
  "blockedAt": "2025-12-10 10:30:00"
}
```

### ✅ New Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `bookingBlockNotes` | String (nullable) | Chi tiết lý do chặn/blacklist | "Có hành vi bạo lực với nhân viên tiếp tân ngày 10/12" |
| `blockedBy` | String (nullable) | Username của người thực hiện chặn | "admin", "manager01" |

### 🆕 Admin Update Capability

**Endpoint**: `PATCH /api/v1/patients/{patientCode}`

**New**: Admins can now update booking block status via API

#### Authorization
- ✅ `ROLE_ADMIN` - Full access
- ✅ `UPDATE_PATIENT` permission - Can update

#### Request Body (New Fields)
```json
{
  "isBookingBlocked": true,
  "bookingBlockReason": "STAFF_ABUSE",
  "bookingBlockNotes": "Có hành vi bạo lực với nhân viên tiếp tân"
}
```

#### Validation Rules

**bookingBlockReason** - Must be one of these enum values:
- `EXCESSIVE_NO_SHOWS` - Bỏ hẹn quá nhiều (temporary)
- `EXCESSIVE_CANCELLATIONS` - Hủy hẹn quá nhiều (permanent)
- `STAFF_ABUSE` - Bạo lực với nhân viên (permanent)
- `DEBT_DEFAULT` - Nợ chi phí điều trị (permanent)
- `FRIVOLOUS_LAWSUIT` - Kiện tụng vô căn cứ (permanent)
- `PROPERTY_DAMAGE` - Phá hoại tài sản (permanent)
- `INTOXICATION` - Say xỉn (permanent)
- `DISRUPTIVE_BEHAVIOR` - Gây rối (permanent)
- `POLICY_VIOLATION` - Vi phạm quy định (permanent)
- `OTHER_SERIOUS` - Vi phạm nghiêm trọng khác (permanent)

**bookingBlockNotes** - Max 5000 characters

### 🤖 Auto-Tracking

When admin updates `isBookingBlocked`:

**Blocking (true)**:
- System automatically sets `blockedBy` = current username
- System automatically sets `blockedAt` = current timestamp

**Unblocking (false)**:
- System automatically clears all blocking fields:
  - `bookingBlockReason` → null
  - `bookingBlockNotes` → null
  - `blockedBy` → null
  - `blockedAt` → null

### 💡 UI Display Examples

#### Patient Detail Card
```javascript
function PatientBlockStatus({ patient }) {
  if (!patient.isBookingBlocked) {
    return <Badge color="green">Có thể đặt hẹn</Badge>;
  }

  const isTemporary = patient.bookingBlockReason === 'EXCESSIVE_NO_SHOWS';
return (
    <div className="block-status">
      <Badge color={isTemporary ? 'orange' : 'red'}>
        {isTemporary ? 'Tạm chặn' : 'Blacklist'}
      </Badge>
      
      <div className="block-details">
        <p><strong>Lý do:</strong> {translateReason(patient.bookingBlockReason)}</p>
        {patient.bookingBlockNotes && (
          <p><strong>Chi tiết:</strong> {patient.bookingBlockNotes}</p>
        )}
        <p><strong>Bị chặn bởi:</strong> {patient.blockedBy}</p>
        <p><strong>Thời gian:</strong> {formatDateTime(patient.blockedAt)}</p>
      </div>
    </div>
  );
}
```

#### Admin Update Form
```javascript
function BlockPatientForm({ patientCode, onSuccess }) {
  const [formData, setFormData] = useState({
    isBookingBlocked: true,
    bookingBlockReason: '',
    bookingBlockNotes: ''
  });

  const handleSubmit = async () => {
    await axios.patch(`/api/v1/patients/${patientCode}`, formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <select 
        value={formData.bookingBlockReason}
        onChange={(e) => setFormData({...formData, bookingBlockReason: e.target.value})}
        required
      >
        <option value="">-- Chọn lý do --</option>
        <option value="STAFF_ABUSE">Bạo lực với nhân viên</option>
        <option value="DEBT_DEFAULT">Nợ chi phí điều trị</option>
        <option value="FRIVOLOUS_LAWSUIT">Kiện tụng vô căn cứ</option>
        {/* ... other options */}
      </select>
      
      <textarea
        value={formData.bookingBlockNotes}
        onChange={(e) => setFormData({...formData, bookingBlockNotes: e.target.value})}
        placeholder="Mô tả chi tiết (tùy chọn)"
        maxLength={5000}
      />
      
      <button type="submit">Chặn bệnh nhân</button>
    </form>
  );
}
```

#### Unblock Patient
```javascript
function UnblockPatient({ patientCode, onSuccess }) {
  const handleUnblock = async () => {
    await axios.patch(`/api/v1/patients/${patientCode}`, {
      isBookingBlocked: false
      // No need to send other fields - system clears them automatically
    });
    onSuccess();
  };

  return <button onClick={handleUnblock}>Bỏ chặn</button>;
}
```

### 🔧 Migration Notes

**No Breaking Changes** - All new fields are nullable, existing FE code will continue working.

**Recommended Updates**:
1. ✅ Display `bookingBlockNotes` in patient detail view
2. ✅ Show `blockedBy` for audit trail
3. ✅ Add admin UI to update booking block status
4. ✅ Update block status badge to show temporary vs permanent

**Testing**:
- [ ] Verify patient detail shows all blocking info
- [ ] Test admin can block/unblock patients
- [ ] Verify `blockedBy` shows current username automatically
- [ ] Test enum validation (invalid reason should fail)