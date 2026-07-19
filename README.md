# RMS SWT Demo

He thong demo Recruitment Management System (RMS) phuc vu mon Software Testing.

- Frontend: React + Vite
- Backend: ASP.NET Core Minimal API
- Database: SQLite file `backend/rms-swt.db`
- Auth: demo login theo role, chua dung JWT
- Email: co helper/endpoint san trong backend, nhung delivery bi lock trong demo; he thong chi luu `EmailNotifications`
- CV upload: luu file local trong `backend/uploads/cv`

## Demo-only scope

- Password `12345` duoc validate o frontend de man hinh login trong chinh chu hon. Backend hien chi nhan email/role cho demo, chua co password hash hay JWT.
- `Reset demo data` la endpoint ho tro test lai flow. Sau khi reset, frontend logout ve Login de tranh lech session/state.
- Email phong van va email xac nhan co ham san o backend/frontend, nhung SMTP delivery bi khoa trong demo vi dung email gia. He thong chi tao notification record voi status `DemoLocked`.

## Tai khoan demo

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@company.com | 12345 |
| Employer | employer@company.com | 12345 |
| Interviewer | interviewer@company.com | 12345 |
| Candidate | candidate@example.com | 12345 |

## Chay backend

```powershell
cd backend
dotnet restore
dotnet run
```

Backend mac dinh chay tai:

```text
http://localhost:5082
```

SQLite DB se duoc tao tu dong khi backend chay lan dau.

## Chay frontend

Mo terminal khac:

```powershell
cd frontend
npm install
npm run dev
```

Frontend mac dinh chay tai:

```text
http://127.0.0.1:5174
```

Frontend mac dinh goi API:

```text
http://localhost:5082
```

Neu backend doi port:

```powershell
$env:VITE_API_URL="http://localhost:PORT"
npm run dev
```

## Demo script

Xem [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) de chay kich ban demo 5 phut theo tung role.

## Scope chuc nang

Candidate:

- Search/filter active jobs theo keyword, location, level
- View job detail before applying
- Chon job va nop application kem CV
- Validate required info, email, phone, CV extension, CV size <= 5MB
- Chan duplicate application cung email/job trong 30 ngay neu ho so chua bi reject
- Track application status bang history

Employer:

- Create job post, save draft, submit pending approval
- View job/application thuoc employer hien tai
- Xem CV ung vien da nop
- Pass/reject CV
- Schedule interview cho application da `CV Passed`
- View interviews, pass/fail interview
- Offer hoac mark hired cho candidate phu hop

Interviewer:

- Login demo bang role Interviewer
- View assigned interview schedule
- Dashboard read-only cho lich duoc phan cong

Admin:

- Create staff account voi email `@company.com`
- Assign role, lock/unlock account
- Khong cho lock tai khoan Admin
- Approve/reject job dang `Pending Approval`
- View/search audit logs
- Reset demo data de test lai flow tu dau

## Endpoint smoke test nhanh

```powershell
Invoke-RestMethod http://localhost:5082/api/health
```

## Ghi chu build

Build co the bao warning NuGet `NU1903` tu dependency `Microsoft.OpenApi` va `SQLitePCLRaw.lib.e_sqlite3`. Warning nay khong chan demo/build. Neu can nop sach warning, can nang/pin package len ban da va.
