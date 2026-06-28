# RMS SWT Demo

Hệ thống demo tối giản cho môn SWT:

- Frontend: React + Vite
- Backend: ASP.NET Core Web API
- Database: SQLite file `rms-swt.db`
- Auth: login demo theo role, không dùng JWT
- Email: mock bằng bảng `EmailNotifications`
- CV upload: lưu file local trong `backend/uploads/cv`

## Tài khoản demo

| Role | Email |
| --- | --- |
| Admin | admin@company.com |
| Employer | employer@company.com |
| Interviewer | interviewer@company.com |
| Candidate | candidate@example.com |

Frontend tự login theo tab đang chọn.

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
- Chặn duplicate application cùng email/job trong 30 ngày
- Track application status

Employer:

- Create job post
- Save draft hoặc submit pending approval
- Validate title, quantity > 0, deadline tối thiểu +3 ngày, JD required
- View applications
- Update application status: `CV Passed`, `Rejected`
- Rejected application được archive khỏi danh sách chính
- Schedule interview
- Validate CV Passed, weekday, working hours, interviewer conflict, online link

Admin:

- Create staff account với email `@company.com`
- Assign role, lock/unlock account
- View audit logs
- Audit logs read-only

## Endpoint smoke test nhanh

```powershell
Invoke-RestMethod http://localhost:5082/api/health
```

## Ghi chú

Build hiện có thể báo warning NuGet `NU1903` từ dependency SQLite native package. Warning này không chặn demo/build, nhưng nếu cần nộp sạch warning thì có thể pin package SQLite native sang bản đã vá hoặc đổi version EF Core.
