# Test Checklist: Employee & Patient Management

## ✅ Code Review Results

### 1. Type Safety Check
- ✅ `UpdateEmployeeRequest` khớp với BE (không có account fields)
- ✅ `UpdatePatientRequest` khớp với BE (không có account fields)
- ✅ `isActive` đã được thêm vào `UpdateEmployeeRequest`
- ✅ `employeeType` được map đúng thành `employmentType` trong service

### 2. Linter Check
- ✅ Không có lỗi linter
- ✅ Tất cả imports đúng
- ✅ Types được sử dụng đúng

### 3. Logic Check
- ✅ Account fields đã được xóa khỏi edit forms
- ✅ Update logic chỉ gửi các fields được BE hỗ trợ
- ✅ Partial update logic đúng (chỉ gửi fields đã thay đổi)

---

## 🧪 Manual Test Checklist

### Test 1: Update Employee (Detail Page)
**Location:** `/admin/accounts/employees/[employeeCode]`

1. **Basic Update**
   - [ ] Mở employee detail page
   - [ ] Click "Edit" button
   - [ ] Thay đổi First Name
   - [ ] Thay đổi Last Name
   - [ ] Click "Save"
   - [ ] Verify: Employee được update thành công
   - [ ] Verify: Không có account fields (username, email, password) trong form

2. **Role Update**
   - [ ] Mở edit modal
   - [ ] Thay đổi Role
   - [ ] Click "Save"
   - [ ] Verify: Role được update thành công

3. **Specializations Update (Doctor/Nurse)**
   - [ ] Mở edit modal cho Doctor hoặc Nurse
   - [ ] Thay đổi Specializations
   - [ ] Click "Save"
   - [ ] Verify: Specializations được update thành công

4. **No Changes**
   - [ ] Mở edit modal
   - [ ] Không thay đổi gì
   - [ ] Click "Save"
   - [ ] Verify: Hiển thị message "No changes to update"

5. **Account Information Display**
   - [ ] Verify: Account Information section hiển thị (read-only)
   - [ ] Verify: Username, Email, Status được hiển thị
   - [ ] Verify: Không có form để edit account

### Test 2: Update Employee (List Page)
**Location:** `/admin/accounts/employees`

1. **Update from List**
   - [ ] Tìm một employee trong list
   - [ ] Click "Edit" (nếu có)
   - [ ] Thay đổi thông tin
   - [ ] Click "Save"
   - [ ] Verify: Employee được update và list được refresh

### Test 3: Update Patient (Detail Page)
**Location:** `/admin/accounts/users/[patientCode]`

1. **Basic Update**
   - [ ] Mở patient detail page
   - [ ] Click "Edit" button
   - [ ] Thay đổi First Name
   - [ ] Thay đổi Last Name
   - [ ] Thay đổi Email
   - [ ] Click "Save"
   - [ ] Verify: Patient được update thành công
   - [ ] Verify: Không có account fields (username, password) trong form

2. **Medical Information Update**
   - [ ] Mở edit modal
   - [ ] Thay đổi Medical History
   - [ ] Thay đổi Allergies
   - [ ] Click "Save"
   - [ ] Verify: Medical information được update thành công

3. **Emergency Contact Update**
   - [ ] Mở edit modal
   - [ ] Thay đổi Emergency Contact Name
   - [ ] Thay đổi Emergency Contact Phone
   - [ ] Click "Save"
   - [ ] Verify: Emergency contact được update thành công

4. **No Changes**
   - [ ] Mở edit modal
   - [ ] Không thay đổi gì
   - [ ] Click "Save"
   - [ ] Verify: Hiển thị message "No changes to update"

### Test 4: Update Patient (List Page)
**Location:** `/admin/accounts/users`

1. **Update from List**
   - [ ] Tìm một patient trong list
   - [ ] Click "Edit" (nếu có)
   - [ ] Thay đổi thông tin
   - [ ] Click "Save"
   - [ ] Verify: Patient được update và list được refresh

### Test 5: Create Employee
**Location:** `/admin/accounts/employees`

1. **Create with Account**
   - [ ] Click "Create Employee"
   - [ ] Điền đầy đủ thông tin:
     - Username (required)
     - Email (required)
     - Password (required)
     - Role
     - First Name, Last Name
   - [ ] Click "Create"
   - [ ] Verify: Employee được tạo thành công
   - [ ] Verify: Account được tạo tự động

### Test 6: Create Patient
**Location:** `/admin/accounts/users`

1. **Create with Account**
   - [ ] Click "Create Patient"
   - [ ] Điền đầy đủ thông tin:
     - Username (optional)
     - Password (optional, nếu có username)
     - Email
     - First Name, Last Name
   - [ ] Click "Create"
   - [ ] Verify: Patient được tạo thành công
   - [ ] Verify: Account được tạo nếu có username/password

2. **Create without Account**
   - [ ] Click "Create Patient"
   - [ ] Điền thông tin (KHÔNG điền username/password)
   - [ ] Click "Create"
   - [ ] Verify: Patient được tạo thành công
   - [ ] Verify: Không có account được tạo

---

## 🔍 API Test (Using Browser DevTools)

### Test 7: Verify API Payload

1. **Update Employee API**
   - [ ] Mở DevTools → Network tab
   - [ ] Update một employee
   - [ ] Tìm request `PATCH /api/v1/employees/{employeeCode}`
   - [ ] Verify: Payload KHÔNG có `username`, `email`, `password`
   - [ ] Verify: Payload có `firstName`, `lastName`, `roleId`, etc.
   - [ ] Verify: `employeeType` được gửi (sẽ được map thành `employmentType` ở service)

2. **Update Patient API**
   - [ ] Mở DevTools → Network tab
   - [ ] Update một patient
   - [ ] Tìm request `PATCH /api/v1/patients/{patientCode}`
   - [ ] Verify: Payload KHÔNG có `username`, `password`
   - [ ] Verify: Payload có `email` (vì email là part of patient record)
   - [ ] Verify: Payload có các fields khác đúng

---

## ⚠️ Expected Behaviors

### ✅ Should Work
- Update employee/patient basic information
- Update role, specializations
- Update medical information (patient)
- Partial updates (chỉ gửi fields đã thay đổi)
- Create employee/patient với account

### ❌ Should NOT Work (và không nên có trong UI)
- Update account username qua employee/patient update
- Update account email qua employee/patient update
- Update account password qua employee/patient update

---

## 🐛 Error Scenarios to Test

1. **Network Error**
   - [ ] Disconnect internet
   - [ ] Try to update
   - [ ] Verify: Error message hiển thị đúng

2. **Validation Error**
   - [ ] Update với invalid data (e.g., invalid email format)
   - [ ] Verify: BE validation error được hiển thị

3. **Permission Error**
   - [ ] Login với user không có quyền UPDATE_EMPLOYEE/UPDATE_PATIENT
   - [ ] Try to update
   - [ ] Verify: 403 error được handle đúng

---

## 📝 Notes

- Account chỉ có thể được tạo khi tạo employee/patient
- Account không thể được update qua employee/patient update endpoints
- Email trong patient là part of patient record, không phải account field
- `employeeType` trong FE được map thành `employmentType` trong BE (đúng)

---

## ✅ Completion Status

Sau khi test xong, đánh dấu:
- [ ] Tất cả test cases đã pass
- [ ] Không có lỗi console
- [ ] API calls đúng format
- [ ] UI/UX hoạt động mượt mà

