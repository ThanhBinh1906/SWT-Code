# RMS Demo Script

## Chuan bi

1. Chay backend:

```powershell
cd "E:\FPT\SWT\Final project\SWT Code\backend"
dotnet run
```

2. Chay frontend:

```powershell
cd "E:\FPT\SWT\Final project\SWT Code\frontend"
npm run dev
```

3. Mo trinh duyet:

```text
http://127.0.0.1:5174
```

## Tai khoan demo

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@company.com | 12345 |
| Employer | employer@company.com | 12345 |
| Interviewer | interviewer@company.com | 12345 |
| Candidate | candidate@example.com | 12345 |

## Kich ban demo 5 phut

### 1. Admin reset data

1. Login bang role `Admin`.
2. Vao `Accounts`.
3. Bam `Reset demo data`.
4. Xac nhan popup.
5. Expected result: he thong bao reset thanh cong va quay ve man Login.

### 2. Candidate nop CV

1. Login bang role `Candidate`.
2. Vao `Find jobs`.
3. Search/filter job theo keyword, location hoac level neu can.
4. Bam `View detail` o mot job active.
5. Expected result: he thong hien thong tin chi tiet job.
6. Bam `Apply` hoac `Apply to this job`.
7. Expected result: he thong tu chuyen sang `Apply`.
8. Chon file CV `.pdf`, `.doc`, hoac `.docx`.
9. Bam `Submit application`.
10. Expected result: he thong tu chuyen sang `History`, status la `Waiting for CV screening`.

### 3. Employer pass CV va dat lich phong van

1. Login bang role `Employer`.
2. Vao `Applications`.
3. Bam `View CV` de kiem tra file ung vien da nop.
4. Bam `Pass CV` cho ho so vua nop.
5. Bam `Schedule`.
6. Expected result: he thong tu chuyen sang tab `Schedule`.
7. Chon candidate, thoi gian trong ngay lam viec, mode, link/room, va it nhat mot interviewer.
8. Bam `Create interview schedule`.
9. Expected result: he thong tu chuyen sang `Interviews`, interview co status `Scheduled`.

### 4. Interviewer xem lich

1. Login bang role `Interviewer`.
2. Vao `Schedule`.
3. Expected result: thay lich phong van vua duoc phan cong.
4. Note: email invitation duoc luu thanh notification record voi status `DemoLocked`; demo khong gui SMTP that.

### 5. Employer cap nhat ket qua phong van

1. Login lai bang role `Employer`.
2. Vao `Interviews`.
3. Bam `Pass interview` hoac `Fail interview`.
4. Expected result:
   - Pass: application chuyen sang `Interview Passed`.
   - Fail: application chuyen sang `Interview Failed`.

### 6. Candidate xem ket qua

1. Login bang role `Candidate`.
2. Vao `History`.
3. Expected result:
   - Pass interview hien thi `Interview passed`.
   - Fail interview hien thi `Not selected after interview`.

### 7. Employer offer va hired

1. Login bang role `Employer`.
2. Vao `Applications`.
3. Voi candidate `Interview Passed`, bam `Offer`.
4. Voi candidate `Offered`, bam `Mark hired`.
5. Expected result: status lan luot la `Offered` va `Hired`.

### 8. Admin approve job va audit log

1. Login bang role `Admin`.
2. Vao `Job approvals`.
3. Approve mot job pending.
4. Vao `Audit logs`.
5. Search audit logs theo action/user/time neu can.
6. Bam `Try delete audit log`.
7. Expected result: he thong bao audit log la read-only.

## Loi co the demo

- Candidate nop trung cung job khi ho so chua bi reject: bao duplicate application.
- Employer schedule interview nhung chua chon interviewer: bao can chon interviewer.
- Employer chon lich cuoi tuan: bao interview phai tu Monday-Friday.
- Admin tao account voi email khong phai `@company.com`: bao loi company email.
- Admin thu lock tai khoan Admin: he thong khong cho lock.
