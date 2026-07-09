# RMS SWT Demo

Hệ thống demo tối giản cho môn SWT:

- Frontend: React + Vite
- Backend: ASP.NET Core Minimal API
- Database: SQLite file `backend/rms-swt.db`
- Auth: login demo theo role, chưa dùng JWT
- Email: mock bằng bảng `EmailNotifications`
- CV upload: lưu file local trong `backend/uploads/cv`

## Tài khoản demo

| Role | Email |
| --- | --- |
| Admin | admin@company.com |
| Employer | employer@company.com |
| Interviewer | interviewer@company.com |
| Candidate | candidate@example.com |

Frontend đăng nhập bằng tài khoản demo theo role đã chọn.

## Chạy backend

```powershell
cd backend
dotnet restore
dotnet run
```

Backend mặc định chạy tại:

```text
http://localhost:5082
```

SQLite DB sẽ được tạo tự động khi backend chạy lần đầu.

## Chạy frontend

Mở terminal khác:

```powershell
cd frontend
npm install
npm run dev
```

Frontend đang chạy ở port:

```text
http://127.0.0.1:5174
```

Frontend mặc định gọi API:

```text
http://localhost:5082
```

Nếu backend đổi port:

```powershell
$env:VITE_API_URL="http://localhost:PORT"
npm run dev
```

## Scope chức năng

Candidate:

- Search/filter active jobs
- View job detail cơ bản
- Submit application với CV
- Validate required info, email, phone, CV extension, CV size <= 5MB
- Chặn duplicate application cùng email/job trong 30 ngày nếu hồ sơ chưa bị reject
- Track application status

Employer:

- Create job post
- Save draft hoặc submit pending approval
- Validate title, quantity > 0, deadline tối thiểu +3 ngày, JD required
- View job/application thuộc employer hiện tại
- Update application status: `CV Passed`, `Rejected`
- Rejected application được archive khỏi danh sách chính
- Schedule interview cho application đã `CV Passed`
- Validate weekday, working hours, active interviewer, interviewer conflict, online link

Admin:

- Create staff account với email `@company.com`
- Assign role, lock/unlock account
- Approve/reject job đang `Pending Approval`
- View audit logs
- Audit logs read-only
- Reset demo data để test lại flow từ đầu

## Endpoint smoke test nhanh

```powershell
Invoke-RestMethod http://localhost:5082/api/health
```

## Ghi chú

Build hiện có thể báo warning NuGet `NU1903` từ dependency `Microsoft.OpenApi` và `SQLitePCLRaw.lib.e_sqlite3`. Warning này không chặn demo/build, nhưng nếu cần nộp sạch warning thì cần nâng/pin package lên bản đã vá.
