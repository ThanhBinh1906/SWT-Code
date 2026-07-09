# RMS Demo Script

## Chuẩn bị

1. Chạy backend:

```powershell
cd "E:\FPT\SWT\Final project\SWT Code\backend"
dotnet run
```

2. Chạy frontend:

```powershell
cd "E:\FPT\SWT\Final project\SWT Code\frontend"
npm run dev
```

3. Mở trình duyệt:

```text
http://127.0.0.1:5174
```

## Tài khoản demo

| Role | Email |
| --- | --- |
| Admin | admin@company.com |
| Employer | employer@company.com |
| Interviewer | interviewer@company.com |
| Candidate | candidate@example.com |

## Kịch bản 5 phút

### 1. Admin reset data

1. Login bằng role `Admin`.
2. Vào `Accounts`.
3. Bấm `Reset demo data`.
4. Xác nhận popup.
5. Expected result: hệ thống báo reset thành công và quay về màn Login.

### 2. Candidate nộp CV

1. Login bằng role `Candidate`.
2. Vào `Find jobs`.
3. Bấm `Select this job` ở một job active.
4. Expected result: hệ thống tự chuyển sang `Apply`.
5. Chọn file CV `.pdf`, `.doc`, hoặc `.docx`.
6. Bấm `Submit application`.
7. Expected result: hệ thống tự chuyển sang `History`, status là `Waiting for CV screening`.

### 3. Employer pass CV và đặt lịch phỏng vấn

1. Login bằng role `Employer`.
2. Vào `Applications`.
3. Bấm `Pass CV` cho hồ sơ vừa nộp.
4. Bấm `Schedule`.
5. Expected result: hệ thống tự chuyển sang tab `Schedule`.
6. Chọn candidate, thời gian trong ngày làm việc, mode, link/room, và ít nhất một interviewer.
7. Bấm `Create interview schedule`.
8. Expected result: hệ thống tự chuyển sang `Interviews`, interview có status `Scheduled`.

### 4. Interviewer xem lịch

1. Login bằng role `Interviewer`.
2. Vào `Schedule`.
3. Expected result: thấy lịch phỏng vấn vừa được phân công.

### 5. Employer cập nhật kết quả phỏng vấn

1. Login lại bằng role `Employer`.
2. Vào `Interviews`.
3. Bấm `Pass interview` hoặc `Fail interview`.
4. Expected result:
   - Pass: application chuyển sang `Interview Passed`.
   - Fail: application chuyển sang `Interview Failed`.

### 6. Candidate xem kết quả

1. Login bằng role `Candidate`.
2. Vào `History`.
3. Expected result:
   - Pass interview hiển thị `Interview passed`.
   - Fail interview hiển thị `Not selected after interview`.

### 7. Employer offer và hired

1. Login bằng role `Employer`.
2. Vào `Applications`.
3. Với candidate `Interview Passed`, bấm `Offer`.
4. Với candidate `Offered`, bấm `Mark hired`.
5. Expected result: status lần lượt là `Offered` và `Hired`.

### 8. Admin approve job và audit log

1. Login bằng role `Admin`.
2. Vào `Job approvals`.
3. Approve một job pending.
4. Vào `Audit logs`.
5. Bấm `Try delete audit log`.
6. Expected result: hệ thống báo audit log là read-only.

## Lỗi có thể demo

- Candidate nộp trùng cùng job khi hồ sơ chưa bị reject: báo duplicate application.
- Employer schedule interview nhưng chưa chọn interviewer: báo cần chọn interviewer.
- Employer chọn lịch cuối tuần: báo interview phải từ Monday-Friday.
- Admin tạo account với email không phải `@company.com`: báo lỗi company email.
